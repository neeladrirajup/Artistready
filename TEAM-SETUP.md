# Artistready developer setup

The source repository contains the application and the complete local PostgreSQL schema (including tables, catalogs, and stored procedures). It does not contain anyone's profile records, uploaded media, database passwords, or Cloudflare resources.

These steps are for a Windows laptop. Each developer gets an independent local database. The owner should first invite developers who will push code through **Repository Settings → Collaborators → Add people**; the repository can be cloned without an invitation. Developers must accept the invitation before pushing branches.

## One-script setup on a new Windows laptop

Windows Package Manager (`winget`) must be available. Open PowerShell and run these commands. Review the script in the repository before running it; the process-scoped execution policy below does not change the machine's permanent settings.

```powershell
$setup = Join-Path $env:TEMP 'Setup-Artistready.ps1'
Invoke-WebRequest 'https://raw.githubusercontent.com/neeladrirajup/Artistready/main/Setup-Artistready.ps1' -OutFile $setup
Unblock-File -LiteralPath $setup
powershell.exe -NoProfile -ExecutionPolicy RemoteSigned -File $setup
```

The script installs missing Git, Node.js 24 LTS, and PostgreSQL 17 using `winget`. Complete any Windows installer and administrator prompts. In the PostgreSQL installer, choose port `5432` and set a password **for that developer's laptop**. The script then clones the public repository to `%USERPROFILE%\Artistready`, installs packages, prompts for the PostgreSQL password, applies the 14 migrations, runs the type check and build, and starts the app on `http://127.0.0.1:5173`. Press Ctrl+C to stop it. It does not save the password to the repository or a file.

The script can be rerun on a clean checkout. It refuses to overwrite local Git changes or an unrelated directory. To install somewhere else, add `-InstallPath 'C:\path\to\Artistready'` to the final command. Add `-NoLaunch` if setup should finish without starting the app. If `winget` is unavailable, install Microsoft's App Installer first or use the manual instructions below.

The setup script is interactive because the PostgreSQL installer and any Windows permission prompts require the developer's input. It does not copy real profile records or uploaded media.

## Manual setup

## Prerequisites

- [Git for Windows](https://git-scm.com/download/win) and [Node.js 24 LTS](https://nodejs.org/en/download).
- [PostgreSQL 17 for Windows](https://www.postgresql.org/download/windows/) for the PostgreSQL-backed local app. Install the database server, leave it running on port `5432`, and remember the local `postgres` administrator password. The database setup needs permission to create a database and roles. Each developer chooses their own password; do not share the owner's password.
- On Windows, use PowerShell. The commands below run from the cloned repository root.

Check the tools after installation:

```powershell
git --version
node --version
npm.cmd --version
```

## Clone and install

```powershell
git clone https://github.com/neeladrirajup/Artistready.git
cd Artistready
npm.cmd ci
```

## Create the local PostgreSQL database

The setup command creates database `artistready`, application roles, tables, catalog rows, and stored procedures from `postgresql/sql/001` through `014`. It records migration checksums and can be rerun; an edited, already-applied migration is rejected.

```powershell
$secure = Read-Host 'Local PostgreSQL postgres password' -AsSecureString
$password = [System.Net.NetworkCredential]::new('', $secure).Password
$encoded = [Uri]::EscapeDataString($password)
$env:ARTISTREADY_PG_ADMIN_URL = "postgresql://postgres:${encoded}@127.0.0.1:5432/postgres"
npm.cmd run db:postgres:setup
$env:ARTISTREADY_LOCAL_PG_URL = "postgresql://postgres:${encoded}@127.0.0.1:5432/artistready"
Remove-Item Env:ARTISTREADY_PG_ADMIN_URL
Remove-Variable password, encoded, secure
```

Keep the connection URL private. Do not commit it, send it in chat, or place it in an issue or pull request. `ARTISTREADY_LOCAL_PG_URL` stays in this terminal session; set it again after opening a new terminal. Developers use separate local databases. The local app connects as `postgres` and switches to the restricted `artistready_api` role for profile operations.

## Run and check

```powershell
npm.cmd run dev:postgres
```

Open `http://127.0.0.1:5173` and use the local test sign-in at `http://127.0.0.1:5173/signin-with-chatgpt?return_to=/`. The catalog helper runs on `127.0.0.1:5174` and starts automatically. Profile uploads use the local R2 emulator; those files are separate from PostgreSQL and from the hosted site. Stop the app with Ctrl+C.

Expected first-run results: the migration command reports **14 migrations**, the app loads on port `5173`, and eight illustrative artists appear. A developer's own profile starts empty until they create it. If PostgreSQL is on a different port, use that port in both connection URLs.

Before opening a pull request:

```powershell
npm.cmd run typecheck
npm.cmd run build
```

The hosted site still uses Cloudflare D1 and R2. The local PostgreSQL database is independent of it. The eight sample artists are built into the UI; real profiles and uploads are not copied to a fresh developer database.

## Simpler UI preview

To work on the UI without PostgreSQL, run `npm.cmd run dev`. This uses the local D1/R2 emulator instead of the PostgreSQL profile backend. Stop one development server before starting the other; both use port `5173`.

## Database changes

Add a new numbered SQL migration in `postgresql/sql/`. Do not edit a migration that has already been applied. Rerun `npm.cmd run db:postgres:setup` to apply new migrations. For hosted D1 changes, update `db/schema.ts`, generate a Drizzle migration, and review the SQL. The two database backends currently have separate migration paths.

Use a Git branch and pull request for each change. Repository write access requires an invitation from the owner; the public repository can be cloned without one.

```powershell
git switch -c feature/short-description
# After editing and checking the change:
git add -A
git diff --cached --stat
git status
git commit -m "Describe the change"
git push -u origin feature/short-description
```

Open a pull request on GitHub rather than pushing changes directly to `main`. Never commit `.env` files, connection URLs, local database files, generated uploads, or private profile records.

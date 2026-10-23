# Artistready developer setup

The source repository contains the application and the complete local PostgreSQL schema (including tables, catalogs, and stored procedures). It does not contain anyone's profile records, uploaded media, database passwords, or Cloudflare resources.

## Prerequisites

- Git and Node.js 24 or newer.
- PostgreSQL 17 for the PostgreSQL-backed local app. Install it locally and remember the `postgres` administrator password. The database setup needs permission to create a database and roles.
- On Windows, use PowerShell. The commands below run from the cloned repository root.

## Clone and install

```powershell
git clone https://github.com/neeladrirajup/Artistready.git
cd Artistready
npm ci
```

## Create the local PostgreSQL database

The setup command creates database `artistready`, application roles, tables, catalog rows, and stored procedures from `postgresql/sql/001` through `014`. It records migration checksums and can be rerun; an edited, already-applied migration is rejected.

```powershell
$secure = Read-Host 'Local PostgreSQL postgres password' -AsSecureString
$password = [System.Net.NetworkCredential]::new('', $secure).Password
$encoded = [Uri]::EscapeDataString($password)
$env:ARTISTREADY_PG_ADMIN_URL = "postgresql://postgres:${encoded}@127.0.0.1:5432/postgres"
npm run db:postgres:setup
$env:ARTISTREADY_LOCAL_PG_URL = "postgresql://postgres:${encoded}@127.0.0.1:5432/artistready"
Remove-Item Env:ARTISTREADY_PG_ADMIN_URL
Remove-Variable password, encoded, secure
```

Keep the connection URL private. Do not commit it, send it in chat, or place it in an issue or pull request. `ARTISTREADY_LOCAL_PG_URL` stays in this terminal session; set it again after opening a new terminal. Developers use separate local databases. The local app connects as `postgres` and switches to the restricted `artistready_api` role for profile operations.

## Run and check

```powershell
npm run dev:postgres
```

Open `http://127.0.0.1:5173` and use the local test sign-in at `/signin-with-chatgpt?return_to=/`. The catalog helper runs on `127.0.0.1:5174` and starts automatically. Profile uploads use the local R2 emulator; those files are separate from PostgreSQL and from the hosted site.

Before opening a pull request:

```powershell
npm run typecheck
npm run build
```

The hosted site still uses Cloudflare D1 and R2. The local PostgreSQL database is independent of it. The eight sample artists are built into the UI; real profiles and uploads are not copied to a fresh developer database.

## Simpler UI preview

To work on the UI without PostgreSQL, run `npm run dev`. This uses the local D1/R2 emulator instead of the PostgreSQL profile backend.

## Database changes

Add a new numbered SQL migration in `postgresql/sql/`. Do not edit a migration that has already been applied. Rerun `npm run db:postgres:setup` to apply new migrations. For hosted D1 changes, update `db/schema.ts`, generate a Drizzle migration, and review the SQL. The two database backends currently have separate migration paths.

Use a Git branch and pull request for each change. Repository write access requires an invitation from the owner; the public repository can be cloned without one.

[CmdletBinding()]
param(
    [string]$InstallPath = (Join-Path $env:USERPROFILE 'Artistready'),
    [switch]$NoLaunch,
    [switch]$CheckOnly
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if ($env:OS -ne 'Windows_NT') { throw 'This setup script is for Windows. See TEAM-SETUP.md for the manual steps.' }
$InstallPath = [IO.Path]::GetFullPath($InstallPath)

function Refresh-CommandPath {
    $machine = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $user = [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = (@($machine, $user, $env:Path) | Where-Object { $_ } | Select-Object -Unique) -join ';'
    foreach ($directory in @('C:\Program Files\Git\cmd', 'C:\Program Files\nodejs')) {
        if ((Test-Path -LiteralPath $directory) -and ($env:Path -notlike "*$directory*")) {
            $env:Path = "$directory;$env:Path"
        }
    }
}

function Get-Executable([string]$name) {
    $command = Get-Command $name -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
    return $null
}

function Install-FromWinget([string]$id) {
    $winget = Get-Executable 'winget.exe'
    if (-not $winget) {
        throw "Windows Package Manager (winget) is required to install $id. Install App Installer from Microsoft, then rerun this script."
    }
    Write-Host "Installing $id using Windows Package Manager. Complete any installer or permission prompts."
    & $winget install --id $id --exact --source winget --interactive
    if ($LASTEXITCODE -ne 0) { throw "Installation of $id failed (exit code $LASTEXITCODE)." }
    Refresh-CommandPath
}

function Test-LocalPort([int]$port) {
    $client = [Net.Sockets.TcpClient]::new()
    try {
        $attempt = $client.BeginConnect('127.0.0.1', $port, $null, $null)
        if (-not $attempt.AsyncWaitHandle.WaitOne(750)) { return $false }
        $client.EndConnect($attempt)
        return $true
    } catch { return $false }
    finally { $client.Dispose() }
}

Refresh-CommandPath
if ($CheckOnly) {
    $node = Get-Executable 'node.exe'
    $git = Get-Executable 'git.exe'
    $postgres = Test-Path -LiteralPath 'C:\Program Files\PostgreSQL\17\bin\psql.exe'
    Write-Host "Git: $([bool]$git)  Node: $([bool]$node)  PostgreSQL 17: $postgres  Port 5432: $(Test-LocalPort 5432)"
    Write-Host "Install path: $InstallPath"
    return
}

$previousAdmin = $env:ARTISTREADY_PG_ADMIN_URL
$previousLocal = $env:ARTISTREADY_LOCAL_PG_URL
try {
    $git = Get-Executable 'git.exe'
    if (-not $git) {
        Install-FromWinget 'Git.Git'
        $git = Get-Executable 'git.exe'
    }
    if (-not $git) { throw 'Git was installed but is not available. Open a new PowerShell window and rerun this script.' }

    $node = Get-Executable 'node.exe'
    $nodeMajor = if ($node) { [int](([string](& $node --version)).TrimStart('v').Split('.')[0]) } else { 0 }
    if ($nodeMajor -lt 24) {
        if ($node) {
            $winget = Get-Executable 'winget.exe'
            if (-not $winget) { throw 'Windows Package Manager (winget) is needed to update Node.js.' }
            & $winget upgrade --id 'OpenJS.NodeJS.LTS' --exact --source winget --interactive
            if ($LASTEXITCODE -ne 0) { throw 'Node.js update failed.' }
            Refresh-CommandPath
        } else {
            Install-FromWinget 'OpenJS.NodeJS.LTS'
        }
        $node = Get-Executable 'node.exe'
        $nodeMajor = if ($node) { [int](([string](& $node --version)).TrimStart('v').Split('.')[0]) } else { 0 }
    }
    if ($nodeMajor -lt 24) { throw 'Node.js 24 or newer is required. Open a new PowerShell window and rerun this script.' }
    $npm = Get-Executable 'npm.cmd'
    if (-not $npm) { throw 'npm.cmd is unavailable after installing Node.js. Open a new PowerShell window and rerun this script.' }

    $postgresBinary = 'C:\Program Files\PostgreSQL\17\bin\psql.exe'
    if (-not (Test-Path -LiteralPath $postgresBinary)) {
        Write-Host 'In the PostgreSQL installer, select port 5432 and set a local postgres password you will remember.'
        Install-FromWinget 'PostgreSQL.PostgreSQL.17'
    }
    if (-not (Test-Path -LiteralPath $postgresBinary)) { throw 'PostgreSQL 17 was not found at its standard installation path. Complete the installer, then rerun this script.' }
    if (-not (Test-LocalPort 5432)) {
        try {
            $service = Get-Service -Name 'postgresql-x64-17' -ErrorAction Stop
            if ($service.Status -ne 'Running') { Start-Service -Name $service.Name }
        } catch { throw 'PostgreSQL is not listening on port 5432. Start the PostgreSQL 17 service, then rerun this script.' }
    }
    if (-not (Test-LocalPort 5432)) { throw 'PostgreSQL is not listening on port 5432. Check the installer port and service status.' }

    if (Test-Path -LiteralPath $InstallPath) {
        if (-not (Test-Path -LiteralPath (Join-Path $InstallPath '.git'))) {
            throw "The install path already exists and is not a Git checkout: $InstallPath"
        }
        $originOutput = & $git -C $InstallPath remote get-url origin
        $origin = if ($originOutput) { ([string]$originOutput).Trim() } else { '' }
        if ($LASTEXITCODE -ne 0 -or $origin -notin @('https://github.com/neeladrirajup/Artistready.git', 'https://github.com/neeladrirajup/Artistready')) {
            throw "The existing checkout has an unexpected Git origin: $InstallPath"
        }
        if (@(& $git -C $InstallPath status --porcelain).Count -gt 0) {
            throw "The existing checkout has local changes. Preserve them before rerunning setup: $InstallPath"
        }
        Write-Host 'Updating the existing clean checkout.'
        & $git -C $InstallPath pull --ff-only origin main
        if ($LASTEXITCODE -ne 0) { throw 'Git could not fast-forward the existing checkout.' }
    } else {
        $parent = Split-Path -Parent $InstallPath
        New-Item -ItemType Directory -Path $parent -Force | Out-Null
        & $git clone 'https://github.com/neeladrirajup/Artistready.git' $InstallPath
        if ($LASTEXITCODE -ne 0) { throw 'Could not clone the Artistready repository.' }
    }

    Push-Location $InstallPath
    try {
        Write-Host 'Installing application dependencies.'
        & $npm ci --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw 'npm ci failed.' }

        if (-not $env:ARTISTREADY_PG_ADMIN_URL) {
            $secure = Read-Host "Enter this laptop's PostgreSQL postgres password" -AsSecureString
            $plain = [Net.NetworkCredential]::new('', $secure).Password
            $encoded = [Uri]::EscapeDataString($plain)
            $env:ARTISTREADY_PG_ADMIN_URL = "postgresql://postgres:${encoded}@127.0.0.1:5432/postgres"
            Remove-Variable plain, encoded, secure
        }
        $url = [UriBuilder]::new($env:ARTISTREADY_PG_ADMIN_URL)
        if ($url.Scheme -notin @('postgres', 'postgresql') -or $url.Host -notin @('127.0.0.1', 'localhost') -or $url.Port -ne 5432) {
            throw 'The PostgreSQL administrator URL must point to this laptop on port 5432.'
        }
        $url.Path = 'artistready'
        $env:ARTISTREADY_LOCAL_PG_URL = $url.Uri.AbsoluteUri

        Write-Host 'Creating the artistready database, catalogs, and stored procedures.'
        & $npm run db:postgres:setup
        if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL database setup failed. Verify the local postgres password.' }
        & $npm run typecheck
        if ($LASTEXITCODE -ne 0) { throw 'Type check failed.' }
        & $npm run build
        if ($LASTEXITCODE -ne 0) { throw 'Application build failed.' }

        Write-Host 'Artistready setup is complete.'
        Write-Host 'Local app: http://127.0.0.1:5173/'
        Write-Host 'Use the local test sign-in; the eight sample artists should be visible.'
        if (-not $NoLaunch) {
            if (Test-LocalPort 5173) { throw 'Port 5173 is already in use. Stop the other development server, then run npm.cmd run dev:postgres.' }
            Write-Host 'Starting Artistready. Press Ctrl+C to stop the server.'
            & $npm run dev:postgres
            if ($LASTEXITCODE -ne 0) { throw 'Artistready stopped with an error.' }
        }
    } finally { Pop-Location }
} finally {
    $env:ARTISTREADY_PG_ADMIN_URL = $previousAdmin
    $env:ARTISTREADY_LOCAL_PG_URL = $previousLocal
}

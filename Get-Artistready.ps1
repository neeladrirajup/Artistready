[CmdletBinding()]
param(
    [string]$WorkspacePath = (Join-Path $env:USERPROFILE 'source'),
    [switch]$Update
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repositoryUrl = 'https://github.com/neeladrirajup/Artistready.git'
$workspace = [IO.Path]::GetFullPath($WorkspacePath)
$checkout = Join-Path $workspace 'Artistready'
$gitCommand = Get-Command git.exe -ErrorAction SilentlyContinue
if (-not $gitCommand) {
    throw 'Git for Windows is required. Install it from https://git-scm.com/download/win, open a new PowerShell window, and rerun this script. For a complete machine setup, use Setup-Artistready.ps1 instead.'
}
$git = $gitCommand.Source

if (Test-Path -LiteralPath $checkout) {
    if (-not (Test-Path -LiteralPath (Join-Path $checkout '.git'))) {
        throw "The destination already exists and is not a Git checkout: $checkout"
    }
    $originOutput = & $git -C $checkout remote get-url origin
    if ($LASTEXITCODE -ne 0) { throw "Could not read the Git origin in $checkout" }
    $origin = ([string]$originOutput).Trim()
    $allowedOrigins = @(
        'https://github.com/neeladrirajup/Artistready.git',
        'https://github.com/neeladrirajup/Artistready',
        'git@github.com:neeladrirajup/Artistready.git'
    )
    if ($origin -notin $allowedOrigins) {
        throw "The destination points to a different repository: $checkout"
    }
    if ($Update) {
        $branch = ([string](& $git -C $checkout branch --show-current)).Trim()
        if ($LASTEXITCODE -ne 0 -or $branch -ne 'main') {
            throw "Switch to the main branch before updating: $checkout"
        }
        if (@(& $git -C $checkout status --porcelain).Count -gt 0) {
            throw "The checkout has local changes. Commit or preserve them before updating: $checkout"
        }
        & $git -C $checkout pull --ff-only origin main
        if ($LASTEXITCODE -ne 0) { throw 'Git could not fast-forward the checkout.' }
        Write-Host "Updated Artistready in $checkout"
    } else {
        Write-Host "Artistready is already in $checkout. Use -Update to pull the latest main branch."
    }
} else {
    if ((Test-Path -LiteralPath $workspace) -and -not (Test-Path -LiteralPath $workspace -PathType Container)) {
        throw "The workspace path is not a folder: $workspace"
    }
    New-Item -ItemType Directory -Path $workspace -Force | Out-Null
    & $git clone $repositoryUrl $checkout
    if ($LASTEXITCODE -ne 0) { throw 'Git could not download the Artistready repository.' }
    Write-Host "Downloaded Artistready to $checkout"
}

Write-Host "Next: Set-Location -LiteralPath '$checkout'"
Write-Host 'Then follow TEAM-SETUP.md to install packages and set up the local database.'

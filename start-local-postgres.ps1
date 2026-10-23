$ErrorActionPreference = 'Stop'
$priorUrl = $env:ARTISTREADY_LOCAL_PG_URL
try {
  if (-not $env:ARTISTREADY_LOCAL_PG_URL) {
    $credentialFile = Join-Path $env:LOCALAPPDATA 'Artistready/PostgreSQL17/postgres.credential.xml'
    if (-not (Test-Path -LiteralPath $credentialFile)) {
      throw 'Set ARTISTREADY_LOCAL_PG_URL to your local artistready PostgreSQL connection URL.'
    }
    $credential = Import-Clixml -LiteralPath $credentialFile
    $password = [Uri]::EscapeDataString($credential.GetNetworkCredential().Password)
    $env:ARTISTREADY_LOCAL_PG_URL = "postgresql://postgres:${password}@127.0.0.1:5432/artistready"
  }
  Push-Location $PSScriptRoot
  try { & npm.cmd run dev:postgres } finally { Pop-Location }
} finally {
  $env:ARTISTREADY_LOCAL_PG_URL = $priorUrl
}

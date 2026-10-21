$ErrorActionPreference='Stop'
$credential=Import-Clixml -LiteralPath 'C:\Users\neela\AppData\Local\Artistready\PostgreSQL17\postgres.credential.xml'
$priorPassword=$env:PGPASSWORD
$priorLocal=$env:ARTISTREADY_LOCAL_POSTGRES
$priorClient=$env:VITE_ARTISTREADY_LOCAL_POSTGRES
$priorLocation=Get-Location
$helper=$null
try {
 $env:PGPASSWORD=$credential.GetNetworkCredential().Password
 $env:ARTISTREADY_LOCAL_POSTGRES='1'
 $env:VITE_ARTISTREADY_LOCAL_POSTGRES='1'
 $helper=Start-Process -FilePath 'C:\Program Files\nodejs\node.exe' -ArgumentList 'scripts/local-body-types-server.mjs' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -PassThru
 $ready=$false
 for($i=0;$i -lt 15;$i++){
  if($helper.HasExited){throw 'Local Body Type catalog service stopped unexpectedly'}
  try {if((Invoke-WebRequest -Uri 'http://127.0.0.1:5174/health' -UseBasicParsing -TimeoutSec 1).StatusCode -eq 200){$ready=$true;break}}catch{}
  Start-Sleep -Milliseconds 250
 }
 if(-not $ready){throw 'Local Body Type catalog service did not start'}
 Set-Location $PSScriptRoot
 & npm.cmd run dev
} finally {
 if($helper -and -not $helper.HasExited){Stop-Process -Id $helper.Id}
 $env:PGPASSWORD=$priorPassword
 $env:ARTISTREADY_LOCAL_POSTGRES=$priorLocal
 $env:VITE_ARTISTREADY_LOCAL_POSTGRES=$priorClient
 Set-Location $priorLocation
 $credential=$null
}

$ErrorActionPreference = "Stop"
$Project = "C:\Users\426174\Documents\code\calcmot-site"
Set-Location $Project

Write-Host "[1/4] Instalando dependências..."
npm install

Write-Host "[2/4] QA estático..."
npm run qa:static

Write-Host "[3/4] Build SSR..."
npm run build

Write-Host "[4/4] Validando HTML inicial SSR..."
$process = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "serve:ssr" -PassThru -WindowStyle Hidden
try {
  Start-Sleep -Seconds 4
  $html = (Invoke-WebRequest "http://localhost:4000/" -UseBasicParsing).Content
  if ($html -notmatch "Pare de aceitar corrida no escuro") {
    throw "SSR falhou: headline principal não apareceu no HTML inicial."
  }
  Write-Host "SSR OK: headline encontrada no HTML inicial." -ForegroundColor Green
}
finally {
  if (!$process.HasExited) { Stop-Process -Id $process.Id -Force }
}

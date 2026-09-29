$ErrorActionPreference = "Stop"
$Project = Split-Path -Parent $PSScriptRoot
Set-Location $Project

$routes = @(
  @{ Path = "/"; Text = "Pare de aceitar corrida no escuro" },
  @{ Path = "/como-funciona"; Text = "Por que o CalcMot usa acessibilidade" },
  @{ Path = "/calculadora-ganhos-motorista-app"; Text = "Duas contas antes de aceitar" },
  @{ Path = "/privacidade"; Text = "Em três linhas" },
  @{ Path = "/suporte"; Text = "Os quatro passos de sempre" }
)

Write-Host "[1/4] QA estático..."
npm run qa:static
if ($LASTEXITCODE -ne 0) { throw "QA estático falhou." }

Write-Host "[2/4] Build SSR..."
npm run build
if ($LASTEXITCODE -ne 0) { throw "Build falhou." }

Write-Host "[3/4] Sitemap a partir das rotas..."
node scripts/generate-sitemap.mjs

Write-Host "[4/4] Validando HTML inicial SSR..."
$process = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "serve:ssr" -PassThru -WindowStyle Hidden
try {
  Start-Sleep -Seconds 5

  foreach ($route in $routes) {
    $url = "http://localhost:4000$($route.Path)"
    $html = (Invoke-WebRequest $url -UseBasicParsing).Content

    if ($html -notmatch [regex]::Escape($route.Text)) {
      throw "SSR falhou em $url : conteúdo principal ausente no HTML inicial."
    }
    if ($html -notmatch 'ng-server-context="ssr"') {
      throw "SSR falhou em $url : marcador ng-server-context=ssr ausente."
    }
    if ($html -notmatch 'application/ld\+json') {
      throw "SEO falhou em $url : dados estruturados ausentes."
    }

    Write-Host "OK $url" -ForegroundColor Green
  }

  $home = (Invoke-WebRequest "http://localhost:4000/" -UseBasicParsing).Content
  foreach ($required in @("Pare de aceitar corrida no escuro.", "R$ 2,41/km", "R$ 48/h", "exemplo visual", "Android · Uber e 99 · A decisão continua sua", "https://play.google.com/store/apps/details?id=br.com.calcmot")) {
    if ($home -notmatch [regex]::Escape($required)) {
      throw "HTML inicial sem o conteúdo obrigatório: $required"
    }
  }

  if ($home -match 'rel="canonical"') {
    throw "Canonical emitido sem domínio canônico confirmado."
  }

  Write-Host "SSR OK: 5 rotas renderizadas no servidor, sem canonical inventado." -ForegroundColor Green
}
finally {
  if (!$process.HasExited) { Stop-Process -Id $process.Id -Force }
}

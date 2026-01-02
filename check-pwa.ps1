# Script de Verificação Rápida do PWA
# Execute: .\check-pwa.ps1

Write-Host "🔍 Verificando configuração do PWA..." -ForegroundColor Cyan
Write-Host ""

# 1. Verificar se o build foi feito
Write-Host "1️⃣ Verificando build..." -ForegroundColor Yellow
if (Test-Path ".\dist\index.html") {
    Write-Host "   ✅ Build existe" -ForegroundColor Green
} else {
    Write-Host "   ❌ Build não encontrado. Execute: npm run build" -ForegroundColor Red
    exit 1
}

# 2. Verificar arquivos PWA essenciais
Write-Host ""
Write-Host "2️⃣ Verificando arquivos PWA..." -ForegroundColor Yellow

$arquivosPWA = @(
    ".\dist\manifest.json",
    ".\dist\service-worker.js",
    ".\dist\.htaccess",
    ".\dist\icon-192.png",
    ".\dist\icon-512.png",
    ".\dist\favicon.png"
)

$todosOk = $true
foreach ($arquivo in $arquivosPWA) {
    $nome = Split-Path $arquivo -Leaf
    if (Test-Path $arquivo) {
        $tamanho = (Get-Item $arquivo).Length
        Write-Host "   ✅ $nome ($tamanho bytes)" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $nome não encontrado!" -ForegroundColor Red
        $todosOk = $false
    }
}

if (-not $todosOk) {
    Write-Host ""
    Write-Host "   ⚠️  Alguns arquivos estão faltando. Execute: npm run build" -ForegroundColor Yellow
    exit 1
}

# 3. Verificar conteúdo do manifest.json
Write-Host ""
Write-Host "3️⃣ Verificando manifest.json..." -ForegroundColor Yellow
try {
    $manifest = Get-Content ".\dist\manifest.json" -Raw | ConvertFrom-Json
    Write-Host "   ✅ Nome: $($manifest.name)" -ForegroundColor Green
    Write-Host "   ✅ Nome curto: $($manifest.short_name)" -ForegroundColor Green
    Write-Host "   ✅ Start URL: $($manifest.start_url)" -ForegroundColor Green
    Write-Host "   ✅ Ícones: $($manifest.icons.Count)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro ao ler manifest.json: $_" -ForegroundColor Red
    exit 1
}

# 4. Verificar service-worker.js
Write-Host ""
Write-Host "4️⃣ Verificando service-worker.js..." -ForegroundColor Yellow
$sw = Get-Content ".\dist\service-worker.js" -Raw
if ($sw -match "edusampaio-pwa-v") {
    Write-Host "   ✅ Service worker configurado" -ForegroundColor Green
    if ($sw -match "CACHE_NAME = '([^']+)'") {
        Write-Host "   ✅ Cache name: $($matches[1])" -ForegroundColor Green
    }
} else {
    Write-Host "   ❌ Service worker pode estar incorreto" -ForegroundColor Red
}

# 5. Verificar .htaccess
Write-Host ""
Write-Host "5️⃣ Verificando .htaccess..." -ForegroundColor Yellow
$htaccess = Get-Content ".\dist\.htaccess" -Raw
if ($htaccess -match "RewriteEngine On") {
    Write-Host "   ✅ Configuração de rewrite presente" -ForegroundColor Green
}
if ($htaccess -match "service-worker") {
    Write-Host "   ✅ Configuração específica para service worker" -ForegroundColor Green
}
if ($htaccess -match "manifest") {
    Write-Host "   ✅ Configuração específica para manifest" -ForegroundColor Green
}

# 6. Tamanho total do build
Write-Host ""
Write-Host "6️⃣ Informações do build..." -ForegroundColor Yellow
$tamanhoTotal = (Get-ChildItem ".\dist" -Recurse | Measure-Object -Property Length -Sum).Sum
$tamanhoMB = [math]::Round($tamanhoTotal / 1MB, 2)
Write-Host "   📦 Tamanho total: $tamanhoMB MB" -ForegroundColor Cyan

$arquivosTotal = (Get-ChildItem ".\dist" -Recurse -File).Count
Write-Host "   📄 Total de arquivos: $arquivosTotal" -ForegroundColor Cyan

# Resumo final
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ VERIFICAÇÃO CONCLUÍDA COM SUCESSO!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📤 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Fazer upload da pasta dist/ para o servidor" -ForegroundColor White
Write-Host "   2. Garantir que está em HTTPS" -ForegroundColor White
Write-Host "   3. Verificar no navegador:" -ForegroundColor White
Write-Host "      - https://seudominio.com/manifest.json" -ForegroundColor Gray
Write-Host "      - https://seudominio.com/service-worker.js" -ForegroundColor Gray
Write-Host "   4. Abrir DevTools (F12) e verificar Console" -ForegroundColor White
Write-Host ""
Write-Host "📚 Consulte PWA-TROUBLESHOOTING.md para mais detalhes" -ForegroundColor Cyan
Write-Host ""

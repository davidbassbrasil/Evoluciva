#!/usr/bin/env pwsh
# Script para corrigir erro 500 no signup do Supabase
# Este script aplica o fix SQL diretamente no seu projeto Supabase

Write-Host "🔧 FIX SIGNUP 500 ERROR - Supabase" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host ""

# Ler o arquivo .env para pegar as credenciais do Supabase
$envFile = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Arquivo .env não encontrado!" -ForegroundColor Red
    Write-Host "   Crie um arquivo .env com:" -ForegroundColor Yellow
    Write-Host "   VITE_SUPABASE_URL=https://seu-projeto.supabase.co" -ForegroundColor Yellow
    Write-Host "   VITE_SUPABASE_ANON_KEY=sua-anon-key" -ForegroundColor Yellow
    Write-Host "   SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key" -ForegroundColor Yellow
    exit 1
}

# Parse .env file
$env:VITE_SUPABASE_URL = (Get-Content $envFile | Where-Object { $_ -match "^VITE_SUPABASE_URL=" }) -replace "^VITE_SUPABASE_URL=", ""
$env:SUPABASE_SERVICE_ROLE_KEY = (Get-Content $envFile | Where-Object { $_ -match "^SUPABASE_SERVICE_ROLE_KEY=" }) -replace "^SUPABASE_SERVICE_ROLE_KEY=", ""

if (-not $env:VITE_SUPABASE_URL -or -not $env:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "❌ Variáveis do Supabase não encontradas no .env!" -ForegroundColor Red
    Write-Host "   Certifique-se de que VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão configurados" -ForegroundColor Yellow
    exit 1
}

Write-Host "📍 Projeto Supabase: $env:VITE_SUPABASE_URL" -ForegroundColor Green
Write-Host ""

# Ler o arquivo SQL
$sqlFile = Join-Path $PSScriptRoot "supabase\FIX-SIGNUP-500-ERROR.sql"
if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ Arquivo SQL não encontrado: $sqlFile" -ForegroundColor Red
    exit 1
}

$sqlContent = Get-Content $sqlFile -Raw

Write-Host "📝 Aplicando fix no banco de dados..." -ForegroundColor Yellow
Write-Host ""

# Executar SQL via API do Supabase
$url = "$env:VITE_SUPABASE_URL/rest/v1/rpc/exec_sql"
$headers = @{
    "apikey" = $env:SUPABASE_SERVICE_ROLE_KEY
    "Authorization" = "Bearer $env:SUPABASE_SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
}

# Nota: A API REST do Supabase não tem endpoint direto para SQL
# A melhor opção é usar a Supabase CLI ou executar manualmente no Dashboard

Write-Host "⚠️  ATENÇÃO: Você precisa executar o SQL manualmente!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Como aplicar o fix:" -ForegroundColor Cyan
Write-Host "1. Acesse o Supabase Dashboard: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Selecione seu projeto" -ForegroundColor White
Write-Host "3. Vá em 'SQL Editor' no menu lateral" -ForegroundColor White
Write-Host "4. Clique em 'New query'" -ForegroundColor White
Write-Host "5. Cole o conteúdo do arquivo:" -ForegroundColor White
Write-Host "   $sqlFile" -ForegroundColor Green
Write-Host "6. Clique em 'Run' para executar" -ForegroundColor White
Write-Host ""

# Opção: copiar SQL para clipboard
if (Get-Command Set-Clipboard -ErrorAction SilentlyContinue) {
    Write-Host "📋 Copiar SQL para área de transferência? (S/N): " -ForegroundColor Cyan -NoNewline
    $response = Read-Host
    if ($response -eq "S" -or $response -eq "s") {
        Set-Clipboard -Value $sqlContent
        Write-Host "✅ SQL copiado para área de transferência!" -ForegroundColor Green
        Write-Host "   Agora você pode colar diretamente no SQL Editor do Supabase" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "📖 Alternativamente, use a Supabase CLI:" -ForegroundColor Cyan
Write-Host "   supabase db push --db-url 'sua-connection-string'" -ForegroundColor White
Write-Host ""
Write-Host "Após executar o SQL, o erro 500 no signup deve estar corrigido!" -ForegroundColor Green

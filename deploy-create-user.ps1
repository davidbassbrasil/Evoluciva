# Script de Deploy da Edge Function create-user
# Automatiza o processo de deploy no Supabase

param(
    [string]$ProjectRef = "",
    [switch]$SkipLogin = $false,
    [switch]$Help = $false
)

$ErrorActionPreference = "Stop"

# Cores
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-ErrorMsg { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }

# Ajuda
if ($Help) {
    Write-Host @"
🚀 Deploy Edge Function create-user

USO:
    .\deploy-create-user.ps1 [-ProjectRef <ref>] [-SkipLogin] [-Help]

PARÂMETROS:
    -ProjectRef <ref>    Reference ID do projeto Supabase
    -SkipLogin          Pular etapa de login (se já estiver logado)
    -Help               Mostrar esta ajuda

EXEMPLOS:
    .\deploy-create-user.ps1
    .\deploy-create-user.ps1 -ProjectRef abcdefghijklmnop
    .\deploy-create-user.ps1 -SkipLogin

ENCONTRAR PROJECT REF:
    1. Acesse: https://supabase.com/dashboard
    2. Selecione seu projeto
    3. Settings → General → Reference ID
"@
    exit 0
}

Write-Info "🚀 Deploy da Edge Function create-user"
Write-Host ""

# Verificar se Supabase CLI está instalado
Write-Info "Verificando Supabase CLI..."
try {
    $version = supabase --version 2>&1
    Write-Success "Supabase CLI instalado: $version"
} catch {
    Write-ErrorMsg "Supabase CLI não encontrado!"
    Write-Host ""
    Write-Warning "Instale usando um dos métodos:"
    Write-Host "  1. Via Scoop:"
    Write-Host "     scoop bucket add supabase https://github.com/supabase/scoop-bucket.git"
    Write-Host "     scoop install supabase"
    Write-Host ""
    Write-Host "  2. Via NPM:"
    Write-Host "     npm install -g supabase"
    Write-Host ""
    exit 1
}

Write-Host ""

# Login no Supabase
if (-not $SkipLogin) {
    Write-Info "Fazendo login no Supabase..."
    Write-Warning "Uma janela do navegador será aberta. Faça login e autorize."
    Write-Host ""
    
    try {
        supabase login
        Write-Success "Login realizado com sucesso!"
    } catch {
        Write-ErrorMsg "Erro ao fazer login"
        exit 1
    }
    Write-Host ""
}

# Link com o projeto
if ($ProjectRef -eq "") {
    Write-Info "Project Reference ID não foi fornecido."
    Write-Warning "Para encontrar seu Project Ref:"
    Write-Host "  1. Acesse: https://supabase.com/dashboard"
    Write-Host "  2. Selecione seu projeto"
    Write-Host "  3. Settings → General → Reference ID"
    Write-Host ""
    $ProjectRef = Read-Host "Digite o Project Reference ID"
    Write-Host ""
}

if ($ProjectRef -eq "") {
    Write-ErrorMsg "Project Reference ID é obrigatório!"
    exit 1
}

Write-Info "Linkando com o projeto: $ProjectRef"
try {
    supabase link --project-ref $ProjectRef
    Write-Success "Projeto linkado com sucesso!"
} catch {
    Write-ErrorMsg "Erro ao linkar projeto. Verifique se o Project Ref está correto."
    exit 1
}

Write-Host ""

# Deploy da função
Write-Info "Fazendo deploy da Edge Function create-user..."
Write-Warning "Isso pode levar alguns segundos..."
Write-Host ""

try {
    supabase functions deploy create-user
    Write-Success "Edge Function deployada com sucesso!"
} catch {
    Write-ErrorMsg "Erro ao fazer deploy da função"
    exit 1
}

Write-Host ""

# Listar funções
Write-Info "Verificando funções deployadas..."
try {
    supabase functions list
} catch {
    Write-Warning "Não foi possível listar as funções"
}

Write-Host ""
Write-Success "✨ Deploy concluído com sucesso!"
Write-Host ""

# Obter URL do Supabase
Write-Info "📝 Próximos passos:"
Write-Host ""
Write-Host "1. Teste a função no dashboard:"
Write-Host "   https://supabase.com/dashboard/project/$ProjectRef/functions"
Write-Host ""
Write-Host "2. Ou teste via cURL:"
Write-Host '   $url = "https://SEU_PROJECT.supabase.co/functions/v1/create-user"'
Write-Host '   $body = @{'
Write-Host '       email = "teste@example.com"'
Write-Host '       password = "senha123"'
Write-Host '       full_name = "Usuario Teste"'
Write-Host '   } | ConvertTo-Json'
Write-Host '   Invoke-RestMethod -Uri $url -Method POST -Body $body -ContentType "application/json"'
Write-Host ""
Write-Host "3. Ver logs em tempo real:"
Write-Host "   supabase functions serve create-user"
Write-Host ""

Write-Success "🎉 Tudo pronto! A função create-user está disponível."

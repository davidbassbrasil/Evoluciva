# Script de Teste Local da Edge Function create-user
# Testa a função localmente antes do deploy

param(
    [switch]$Help = $false
)

$ErrorActionPreference = "Stop"

# Cores
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-ErrorMsg { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }

if ($Help) {
    Write-Host @"
🧪 Teste Local da Edge Function create-user

USO:
    .\test-create-user-local.ps1

DESCRIÇÃO:
    Executa a Edge Function localmente usando Supabase CLI
    para testar antes do deploy em produção.

PRÉ-REQUISITOS:
    - Supabase CLI instalado
    - Docker Desktop rodando
    - Arquivo .env.local com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
"@
    exit 0
}

Write-Info "🧪 Teste Local da Edge Function create-user"
Write-Host ""

# Verificar Supabase CLI
Write-Info "Verificando Supabase CLI..."
try {
    $version = supabase --version 2>&1
    Write-Success "Supabase CLI instalado: $version"
} catch {
    Write-ErrorMsg "Supabase CLI não encontrado!"
    exit 1
}

Write-Host ""

# Verificar Docker
Write-Info "Verificando Docker..."
try {
    $dockerVersion = docker --version 2>&1
    Write-Success "Docker instalado: $dockerVersion"
} catch {
    Write-ErrorMsg "Docker não encontrado!"
    Write-Warning "O Supabase CLI precisa do Docker para rodar funções localmente."
    Write-Host "Instale em: https://www.docker.com/products/docker-desktop/"
    exit 1
}

Write-Host ""

# Verificar se Docker está rodando
Write-Info "Verificando se Docker está rodando..."
try {
    docker ps | Out-Null
    Write-Success "Docker está rodando"
} catch {
    Write-ErrorMsg "Docker não está rodando!"
    Write-Warning "Inicie o Docker Desktop e tente novamente."
    exit 1
}

Write-Host ""

# Verificar arquivo .env.local
Write-Info "Verificando variáveis de ambiente..."
if (Test-Path ".env.local") {
    Write-Success "Arquivo .env.local encontrado"
    
    $envContent = Get-Content ".env.local" -Raw
    $hasUrl = $envContent -match "VITE_SUPABASE_URL"
    $hasKey = $envContent -match "VITE_SUPABASE_ANON_KEY"
    
    if ($hasUrl -and $hasKey) {
        Write-Success "Variáveis necessárias configuradas"
    } else {
        Write-Warning "Variáveis faltando em .env.local"
        if (-not $hasUrl) { Write-Warning "  - VITE_SUPABASE_URL" }
        if (-not $hasKey) { Write-Warning "  - VITE_SUPABASE_ANON_KEY" }
    }
} else {
    Write-Warning "Arquivo .env.local não encontrado"
    Write-Host "Crie com:"
    Write-Host "  VITE_SUPABASE_URL=https://seu-projeto.supabase.co"
    Write-Host "  VITE_SUPABASE_ANON_KEY=sua-anon-key"
}

Write-Host ""

# Iniciar Supabase local
Write-Info "Iniciando Supabase local..."
Write-Warning "Isso pode levar alguns minutos na primeira vez..."
Write-Host ""

try {
    # Iniciar (se não estiver rodando)
    supabase start
    Write-Success "Supabase local iniciado!"
} catch {
    Write-ErrorMsg "Erro ao iniciar Supabase local"
    exit 1
}

Write-Host ""

# Servir a função
Write-Info "Iniciando Edge Function create-user..."
Write-Warning "A função ficará disponível em: http://localhost:54321/functions/v1/create-user"
Write-Host ""
Write-Info "Pressione Ctrl+C para parar"
Write-Host ""

try {
    supabase functions serve create-user --env-file .env.local --no-verify-jwt
} catch {
    Write-ErrorMsg "Erro ao servir a função"
    exit 1
}

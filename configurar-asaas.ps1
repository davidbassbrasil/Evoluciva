# ====================================================================
# Script para Configurar Asaas - PowerShell
# ====================================================================

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "       CONFIGURACAO ASAAS - EVOLUCIVA" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se Supabase CLI está instalado
$supabaseInstalled = Get-Command supabase -ErrorAction SilentlyContinue
if (-not $supabaseInstalled) {
    Write-Host "[ERRO] Supabase CLI não encontrado!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Instale com: npm install -g supabase" -ForegroundColor Yellow
    Write-Host "Ou: brew install supabase/tap/supabase" -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Pressione ENTER para sair"
    exit 1
}

Write-Host "[OK] Supabase CLI encontrado" -ForegroundColor Green
Write-Host ""

# Sua chave da Asaas (já pré-configurada do seu .env.local)
$ASAAS_KEY = '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg0ZTI1Y2JlLWFjMmEtNDAzNS1hOTAzLWRkZTM3MWVmOWRlMTo6JGFhY2hfZWYxNzNjNzQtYmM3Yy00N2FkLWJlNWEtODQ3YzFkMjIzODli'
$PROJECT_REF = 'jvfjvzotrqhlfwzcnixj'

try {
    Write-Host "[1/4] Fazendo login no Supabase..." -ForegroundColor Cyan
    supabase login
    if ($LASTEXITCODE -ne 0) { throw "Erro no login" }

    Write-Host ""
    Write-Host "[2/4] Linkando projeto..." -ForegroundColor Cyan
    supabase link --project-ref $PROJECT_REF
    if ($LASTEXITCODE -ne 0) { throw "Erro ao linkar projeto" }

    Write-Host ""
    Write-Host "[3/4] Configurando secrets da Asaas..." -ForegroundColor Cyan
    
    Write-Host "  → Configurando ASAAS_API_KEY..." -ForegroundColor Gray
    supabase secrets set ASAAS_API_KEY=$ASAAS_KEY
    if ($LASTEXITCODE -ne 0) { throw "Erro ao configurar ASAAS_API_KEY" }
    
    Write-Host "  → Configurando ASAAS_ENV..." -ForegroundColor Gray
    supabase secrets set ASAAS_ENV=sandbox
    if ($LASTEXITCODE -ne 0) { throw "Erro ao configurar ASAAS_ENV" }

    Write-Host ""
    Write-Host "[4/4] Fazendo deploy da Edge Function..." -ForegroundColor Cyan
    supabase functions deploy process-payment --no-verify-jwt
    if ($LASTEXITCODE -ne 0) { throw "Erro no deploy" }

    Write-Host ""
    Write-Host "====================================================================" -ForegroundColor Green
    Write-Host "[SUCESSO] Configuração concluída!" -ForegroundColor Green
    Write-Host "====================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Próximos passos:" -ForegroundColor Yellow
    Write-Host "1. Reinicie o servidor dev (npm run dev)" -ForegroundColor White
    Write-Host "2. Teste o checkout em qualquer turma" -ForegroundColor White
    Write-Host "3. Use os dados de teste de: VERIFICAR_ASAAS.md" -ForegroundColor White
    Write-Host ""
    Write-Host "Comandos úteis:" -ForegroundColor Yellow
    Write-Host "  → Ver logs: supabase functions logs process-payment --tail" -ForegroundColor Gray
    Write-Host "  → Listar secrets: supabase secrets list" -ForegroundColor Gray
    Write-Host "  → Listar funções: supabase functions list" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "====================================================================" -ForegroundColor Red
    Write-Host "[ERRO] Falha na configuração!" -ForegroundColor Red
    Write-Host "====================================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Erro: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Tente executar os comandos manualmente:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. supabase login" -ForegroundColor Gray
    Write-Host "2. supabase link --project-ref $PROJECT_REF" -ForegroundColor Gray
    Write-Host "3. supabase secrets set ASAAS_API_KEY=$ASAAS_KEY" -ForegroundColor Gray
    Write-Host "4. supabase secrets set ASAAS_ENV=sandbox" -ForegroundColor Gray
    Write-Host "5. supabase functions deploy process-payment --no-verify-jwt" -ForegroundColor Gray
    Write-Host ""
}

Write-Host ""
Read-Host "Pressione ENTER para sair"

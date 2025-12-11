@echo off
REM ====================================================================
REM Script para Configurar Asaas - Windows
REM ====================================================================

echo.
echo ====================================================================
echo       CONFIGURACAO ASAAS - EVOLUCIVA
echo ====================================================================
echo.

REM Verificar se Supabase CLI está instalado
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Supabase CLI nao encontrado!
    echo.
    echo Instale com: npm install -g supabase
    echo Ou: brew install supabase/tap/supabase
    echo.
    pause
    exit /b 1
)

echo [OK] Supabase CLI encontrado
echo.

REM Sua chave da Asaas (substitua pela sua)
set ASAAS_KEY=$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6Ojg0ZTI1Y2JlLWFjMmEtNDAzNS1hOTAzLWRkZTM3MWVmOWRlMTo6JGFhY2hfZWYxNzNjNzQtYmM3Yy00N2FkLWJlNWEtODQ3YzFkMjIzODli

echo [1/4] Fazendo login no Supabase...
supabase login

echo.
echo [2/4] Linkando projeto...
supabase link --project-ref jvfjvzotrqhlfwzcnixj

echo.
echo [3/4] Configurando secrets da Asaas...
supabase secrets set ASAAS_API_KEY=%ASAAS_KEY%
supabase secrets set ASAAS_ENV=sandbox

echo.
echo [4/4] Fazendo deploy da Edge Function...
supabase functions deploy process-payment --no-verify-jwt

echo.
echo ====================================================================
echo [SUCESSO] Configuracao concluida!
echo ====================================================================
echo.
echo Proximos passos:
echo 1. Reinicie o servidor dev (npm run dev)
echo 2. Teste o checkout em qualquer turma
echo 3. Use os dados de teste de: VERIFICAR_ASAAS.md
echo.
echo Para ver logs: supabase functions logs process-payment --tail
echo.
pause

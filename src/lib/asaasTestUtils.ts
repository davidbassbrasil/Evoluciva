/**
 * Utilitários para testar a integração com Asaas
 * Use este arquivo para validar se o checkout está funcionando corretamente
 */

import { AsaasService } from './asaasService';
import { supabase } from './supabaseClient';

/**
 * Testa a conexão com a Edge Function
 */
export async function testEdgeFunction(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    // Verifica se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        success: false,
        message: 'Usuário não autenticado. Faça login antes de testar.'
      };
    }

    console.log('✓ Usuário autenticado');

    // Testa a Edge Function com uma requisição simples
    const asaas = AsaasService.getInstance();
    
    // Tenta listar pagamentos (endpoint que não cria nada)
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-payment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          method: 'GET',
          endpoint: '/payments?limit=1'
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        message: `Erro na Edge Function (${response.status})`,
        details: error
      };
    }

    console.log('✓ Edge Function respondendo');

    return {
      success: true,
      message: 'Conexão com Asaas OK! Edge Function está funcionando.',
      details: await response.json()
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro ao testar conexão',
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Testa a criação de um cliente de teste
 */
export async function testCreateCustomer(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    const asaas = AsaasService.getInstance();
    
    const testCustomer = {
      name: 'Cliente Teste',
      email: `teste${Date.now()}@exemplo.com`,
      cpfCnpj: '12345678901',
      mobilePhone: '11999999999'
    };

    const customer = await asaas.createCustomer(testCustomer);
    
    return {
      success: true,
      message: 'Cliente de teste criado com sucesso!',
      details: customer
    };
  } catch (error) {
    return {
      success: false,
      message: 'Erro ao criar cliente de teste',
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Dados de teste para ambiente sandbox
 */
export const SANDBOX_TEST_DATA = {
  creditCard: {
    number: '5162306219378829',
    expiryMonth: '05',
    expiryYear: '2025',
    ccv: '318',
    holderName: 'JOHN DOE'
  },
  customer: {
    name: 'Cliente Teste',
    email: 'teste@exemplo.com',
    cpfCnpj: '12345678901',
    mobilePhone: '11999999999'
  }
};

/**
 * Checklista de configuração
 */
export function getConfigurationChecklist() {
  const items = [
    {
      name: 'VITE_SUPABASE_URL',
      value: import.meta.env.VITE_SUPABASE_URL,
      status: !!import.meta.env.VITE_SUPABASE_URL
    },
    {
      name: 'VITE_SUPABASE_ANON_KEY',
      value: import.meta.env.VITE_SUPABASE_ANON_KEY ? '***configurado***' : undefined,
      status: !!import.meta.env.VITE_SUPABASE_ANON_KEY
    }
  ];

  console.log('\n📋 CHECKLIST DE CONFIGURAÇÃO FRONTEND:\n');
  items.forEach(item => {
    const icon = item.status ? '✓' : '✗';
    console.log(`${icon} ${item.name}: ${item.value || 'NÃO CONFIGURADO'}`);
  });

  console.log('\n⚠️  VARIÁVEIS DO SUPABASE (configurar no dashboard):');
  console.log('   - ASAAS_API_KEY (Project Settings → Edge Functions → Manage secrets)');
  console.log('   - ASAAS_ENV (sandbox ou production)');

  console.log('\n📦 EDGE FUNCTION:');
  console.log('   Rodar: supabase functions deploy process-payment');
  
  return items.every(item => item.status);
}

/**
 * Função helper para executar todos os testes
 */
export async function runAllTests() {
  console.log('\n🧪 INICIANDO TESTES DA INTEGRAÇÃO ASAAS\n');
  console.log('='.repeat(50));
  
  // 1. Checklist de configuração
  console.log('\n1️⃣ VERIFICANDO CONFIGURAÇÕES...\n');
  const configOk = getConfigurationChecklist();
  
  if (!configOk) {
    console.error('\n❌ Configurações incompletas. Verifique o arquivo CONFIGURACAO_ASAAS.md');
    return;
  }

  // 2. Teste de Edge Function
  console.log('\n2️⃣ TESTANDO EDGE FUNCTION...\n');
  const edgeFunctionTest = await testEdgeFunction();
  console.log(edgeFunctionTest.success ? '✓' : '✗', edgeFunctionTest.message);
  if (edgeFunctionTest.details) {
    console.log('Detalhes:', edgeFunctionTest.details);
  }

  if (!edgeFunctionTest.success) {
    console.error('\n❌ Edge Function não está funcionando. Verifique:');
    console.error('   1. Se fez deploy: supabase functions deploy process-payment');
    console.error('   2. Se configurou ASAAS_API_KEY no Supabase');
    console.error('   3. Se configurou ASAAS_ENV no Supabase');
    return;
  }

  // 3. Teste de criação de cliente
  console.log('\n3️⃣ TESTANDO CRIAÇÃO DE CLIENTE...\n');
  const customerTest = await testCreateCustomer();
  console.log(customerTest.success ? '✓' : '✗', customerTest.message);
  if (customerTest.details) {
    console.log('Detalhes:', customerTest.details);
  }

  console.log('\n='.repeat(50));
  console.log(customerTest.success ? '\n✅ TODOS OS TESTES PASSARAM!' : '\n❌ ALGUNS TESTES FALHARAM');
  console.log('\nPróximos passos:');
  console.log('1. Verifique o arquivo CONFIGURACAO_ASAAS.md');
  console.log('2. Configure as variáveis de ambiente no Supabase');
  console.log('3. Faça deploy da Edge Function');
  console.log('4. Teste o checkout completo no frontend\n');
}

/**
 * Testa o endpoint de validação de transferências (mecanismo Asaas)
 */
export async function testTransferValidation(transferId = `test-${Date.now()}`, value = 100, token = '') {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/asaas-webhook`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'asaas-access-token': token } : {})
      },
      body: JSON.stringify({ type: 'TRANSFER', transfer: { id: transferId, value } })
    });

    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch (e) { json = { text }; }

    return {
      ok: res.ok,
      status: res.status,
      body: json
    };
  } catch (error) {
    return { ok: false, status: 0, body: error instanceof Error ? error.message : String(error) };
  }
}


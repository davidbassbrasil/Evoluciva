// Edge Function: Proxy Asaas API (com autenticação Supabase)
// Faz chamadas diretas à API do Asaas sem expor a chave
// Suporta Sandbox e Produção

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// Tipos
interface AsaasRequestBody {
  method?: string;
  endpoint: string;
  body?: Record<string, unknown>;
}

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
  'Access-Control-Max-Age': '86400',
};

// Configuração - usar secrets do Supabase
const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY') || '';
const ASAAS_ENV = Deno.env.get('ASAAS_ENV') || 'sandbox';

// URLs oficiais: https://docs.asaas.com/docs/autenticação-1
const BASE_URL = ASAAS_ENV === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://api-sandbox.asaas.com/v3';

// Validação
if (!ASAAS_API_KEY) {
  console.error('[asaas-proxy] ⚠️ ASAAS_API_KEY não configurado!');
} else {
  console.log(`[asaas-proxy] ✅ Ambiente: ${ASAAS_ENV} | URL: ${BASE_URL}`);
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers: corsHeaders 
    })
  }

  try {
    // Validar autenticação do Supabase
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      console.error('[asaas-proxy] Missing authorization header');
      return new Response(
        JSON.stringify({ code: 401, message: 'Missing authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Criar cliente Supabase para validar token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Extrair token
    const token = authHeader.replace('Bearer ', '');
    
    // Validar usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[asaas-proxy] Invalid token:', authError);
      return new Response(
        JSON.stringify({ code: 401, message: 'Invalid or expired token' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[asaas-proxy] Authenticated user: ${user.email}`);

    // Parse request
    const { method, endpoint, body } = await req.json();
    
    console.log(`[asaas-proxy] ${method || 'GET'} ${endpoint}`);
    
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'endpoint é obrigatório' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Build URL
    const url = `${BASE_URL}${endpoint}`;
    
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY
    };
    
    // Build fetch options
    const options: RequestInit = {
      method: method || 'GET',
      headers: headers
    };
    
    // Add body if POST/PUT/PATCH
    if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }
    
    console.log(`[asaas-proxy] Calling: ${url}`);
    
    // Call Asaas API
    const response = await fetch(url, options);
    const data = await response.json();
    
    console.log(`[asaas-proxy] Status: ${response.status}`);
    
    // Return response
    return new Response(
      JSON.stringify(data),
      { 
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
    
  } catch (error: any) {
    console.error('[asaas-proxy] Error:', error.message);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        code: 500 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})

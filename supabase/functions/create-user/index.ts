// Edge Function: Criar usuário via Supabase Auth Admin API
// Permite criar usuários sem afetar a sessão atual (Admin ou Signup público)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
  'Access-Control-Max-Age': '86400',
};

interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  role?: 'student' | 'moderator' | 'admin';
  whatsapp?: string;
  cpf?: string;
  address?: string;
  number?: string;
  complement?: string;
  state?: string;
  city?: string;
  cep?: string;
  requirePasswordChange?: boolean;
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
    // Criar cliente Supabase Admin (com SERVICE_ROLE_KEY)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[create-user] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Server configuration error' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Parse request body
    const body: CreateUserRequest = await req.json();
    const { 
      email, 
      password, 
      full_name, 
      role = 'student',
      whatsapp,
      cpf,
      address,
      number,
      complement,
      state,
      city,
      cep,
      requirePasswordChange = false
    } = body;

    // Validações básicas
    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email, senha e nome completo são obrigatórios' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Email inválido' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validar senha (mínimo 6 caracteres)
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'A senha deve ter no mínimo 6 caracteres' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[create-user] Creating user: ${email} (${role})`);

    // 1. Criar usuário no Supabase Auth usando Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        name: full_name,
        full_name: full_name
      }
    });

    if (authError) {
      console.error('[create-user] Auth error:', authError);
      
      // Verificar se é erro de email duplicado
      if (authError.message?.includes('already registered') || 
          authError.message?.includes('already exists')) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Este email já está cadastrado' 
          }),
          { 
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: authError.message || 'Erro ao criar usuário' 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!authData.user) {
      console.error('[create-user] No user returned from auth.admin.createUser');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao criar usuário' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[create-user] Auth user created: ${authData.user.id}`);

    // 2. Criar perfil completo na tabela profiles
    const profileData = {
      id: authData.user.id,
      email,
      full_name,
      role,
      whatsapp: whatsapp || null,
      cpf: cpf || null,
      address: address || null,
      number: number || null,
      complement: complement || null,
      state: state || null,
      city: city || null,
      cep: cep || null,
      purchased_courses: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profileData, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      });

    if (profileError) {
      console.error('[create-user] Profile error:', profileError);
      
      // Tentar deletar o usuário auth que foi criado
      try {
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        console.log('[create-user] Rolled back auth user due to profile error');
      } catch (rollbackError) {
        console.error('[create-user] Failed to rollback auth user:', rollbackError);
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao criar perfil do usuário' 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[create-user] Profile created successfully for ${email}`);

    // 3. Se requer mudança de senha, enviar email de recuperação
    if (requirePasswordChange) {
      try {
        await supabaseAdmin.auth.resetPasswordForEmail(email, {
          redirectTo: `${supabaseUrl}/reset-password`
        });
        console.log('[create-user] Password reset email sent');
      } catch (resetError) {
        console.warn('[create-user] Failed to send password reset email:', resetError);
        // Não bloquear a criação do usuário por isso
      }
    }

    // Retornar sucesso
    return new Response(
      JSON.stringify({ 
        success: true,
        user: {
          id: authData.user.id,
          email: authData.user.email,
          full_name: full_name,
          role: role
        },
        message: 'Usuário criado com sucesso'
      }),
      { 
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('[create-user] Unexpected error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Erro interno do servidor'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper para criar usuários via Edge Function
// Evita conflito com sessão atual (ideal para admin criar usuários)

import supabase from './supabaseClient';

export interface CreateUserData {
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

export interface CreateUserResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
  error?: string;
  message?: string;
}

/**
 * Cria um novo usuário usando a Edge Function create-user
 * Esta função usa o Admin SDK do Supabase sem afetar a sessão atual
 * 
 * @param userData - Dados do usuário a ser criado
 * @returns Response com sucesso/erro e dados do usuário criado
 */
export async function createUserViaEdgeFunction(
  userData: CreateUserData
): Promise<CreateUserResponse> {
  
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase não está configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY'
    };
  }

  try {
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    
    if (!SUPABASE_URL) {
      return {
        success: false,
        error: 'VITE_SUPABASE_URL não está configurada'
      };
    }

    // Obter token da sessão atual (se houver)
    const { data: { session } } = await supabase.auth.getSession();
    const authToken = session?.access_token;

    // URL da Edge Function
    const edgeFunctionUrl = `${SUPABASE_URL}/functions/v1/create-user`;

    // Headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Se houver token (usuário logado), adiciona ao header
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Fazer requisição
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[createUserViaEdgeFunction] Error:', data);
      return {
        success: false,
        error: data.error || `HTTP ${response.status}: ${response.statusText}`
      };
    }

    return data;

  } catch (error: any) {
    console.error('[createUserViaEdgeFunction] Exception:', error);
    return {
      success: false,
      error: error.message || 'Erro ao criar usuário'
    };
  }
}

/**
 * Cria um usuário público (signup) via Edge Function
 * Não requer autenticação
 */
export async function signUpViaEdgeFunction(
  full_name: string,
  email: string,
  password: string,
  profileFields?: Partial<CreateUserData>
): Promise<CreateUserResponse> {
  return createUserViaEdgeFunction({
    email,
    password,
    full_name,
    role: 'student',
    ...profileFields
  });
}

/**
 * Admin cria um usuário manualmente via Edge Function
 * Requer autenticação de admin/moderator
 */
export async function adminCreateUserViaEdgeFunction(
  userData: CreateUserData
): Promise<CreateUserResponse> {
  return createUserViaEdgeFunction(userData);
}

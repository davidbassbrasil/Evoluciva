import { useState, useEffect } from 'react';
import supabase from './supabaseClient';
import { Module, ModuleDelivery, ModuleWithDeliveries } from '@/types';

// ========================================
// HOOKS PARA MÓDULOS
// ========================================

/**
 * Hook para buscar todos os módulos com estatísticas
 */
export function useModules(turmaId?: string) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchModules();
  }, [turmaId]);

  const fetchModules = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('modules_with_stats')
        .select('*')
        .order('created_at', { ascending: false });

      if (turmaId) {
        query = query.eq('turma_id', turmaId);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setModules(data || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar módulos:', err);
    } finally {
      setLoading(false);
    }
  };

  return { modules, loading, error, refetch: fetchModules };
}

/**
 * Hook para buscar um módulo específico com suas entregas
 */
export function useModule(moduleId: string) {
  const [module, setModule] = useState<ModuleWithDeliveries | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (moduleId) {
      fetchModule();
    }
  }, [moduleId]);

  const fetchModule = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar módulo
      const { data: moduleData, error: moduleError } = await supabase
        .from('modules')
        .select(`
          *,
          turma:turmas(*)
        `)
        .eq('id', moduleId)
        .single();

      if (moduleError) throw moduleError;

      // Buscar entregas
      const { data: deliveriesData, error: deliveriesError } = await supabase
        .from('module_deliveries')
        .select(`
          *,
          student:profiles!module_deliveries_student_id_fkey(id, full_name, email),
          delivered_by_user:profiles!module_deliveries_delivered_by_fkey(id, full_name)
        `)
        .eq('module_id', moduleId);

      if (deliveriesError) throw deliveriesError;

      setModule({
        ...moduleData,
        deliveries: deliveriesData || [],
      });
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar módulo:', err);
    } finally {
      setLoading(false);
    }
  };

  return { module, loading, error, refetch: fetchModule };
}

/**
 * Hook para buscar alunos de uma turma com status de entrega de um módulo
 */
export function useStudentsWithModuleStatus(turmaId: string, moduleId?: string) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (turmaId) {
      fetchStudents();
    }
  }, [turmaId, moduleId]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar alunos matriculados na turma
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          profile_id,
          profiles:profile_id (
            id,
            full_name,
            email
          )
        `)
        .eq('turma_id', turmaId)
        .eq('payment_status', 'paid');

      if (enrollError) throw enrollError;

      if (!moduleId) {
        setStudents(enrollments?.map((e: any) => ({
          student_id: e.profiles.id,
          student_name: e.profiles.full_name,
          student_email: e.profiles.email,
          delivered: false,
        })) || []);
        setLoading(false);
        return;
      }

      // Buscar entregas do módulo
      const { data: deliveries, error: deliveryError } = await supabase
        .from('module_deliveries')
        .select('*')
        .eq('module_id', moduleId);

      if (deliveryError) throw deliveryError;

      // Mapear entregas
      const deliveryMap = new Map(
        deliveries?.map(d => [d.student_id, d]) || []
      );

      // Combinar dados
      const studentsWithStatus = enrollments?.map((e: any) => {
        const delivery = deliveryMap.get(e.profiles.id);
        return {
          student_id: e.profiles.id,
          student_name: e.profiles.full_name,
          student_email: e.profiles.email,
          delivered: !!delivery,
          delivered_at: delivery?.delivered_at,
          delivery_id: delivery?.id,
          student_confirmed: delivery?.student_confirmed || false,
          confirmed_at: delivery?.confirmed_at,
        };
      }) || [];

      setStudents(studentsWithStatus);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar alunos:', err);
    } finally {
      setLoading(false);
    }
  };

  return { students, loading, error, refetch: fetchStudents };
}

// ========================================
// FUNÇÕES CRUD PARA MÓDULOS
// ========================================

export async function createModule(module: Omit<Module, 'id' | 'created_at' | 'updated_at'>) {
  const { data: userData } = await supabase.auth.getUser();
  
  const { data, error } = await supabase
    .from('modules')
    .insert({
      ...module,
      created_by: userData?.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateModule(id: string, updates: Partial<Module>) {
  const { data, error } = await supabase
    .from('modules')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteModule(id: string) {
  const { error } = await supabase
    .from('modules')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ========================================
// FUNÇÕES CRUD PARA ENTREGAS
// ========================================

export async function createDelivery(delivery: {
  module_id: string;
  student_id: string;
  notes?: string;
}) {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from('module_deliveries')
    .insert({
      ...delivery,
      delivered_by: userData?.user?.id,
      delivered_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDelivery(id: string) {
  const { error } = await supabase
    .from('module_deliveries')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export async function toggleDelivery(moduleId: string, studentId: string, notes?: string) {
  console.log('🔄 Toggle delivery:', { moduleId, studentId });
  
  // Verificar se já existe entrega
  const { data: existing } = await supabase
    .from('module_deliveries')
    .select('id')
    .eq('module_id', moduleId)
    .eq('student_id', studentId)
    .maybeSingle();

  console.log('📋 Entrega existente:', existing);

  if (existing) {
    // Remover entrega
    console.log('🗑️ Removendo entrega:', existing.id);
    await deleteDelivery(existing.id);
    return { delivered: false };
  } else {
    // Criar entrega
    console.log('✅ Criando nova entrega');
    const created = await createDelivery({ module_id: moduleId, student_id: studentId, notes });
    console.log('📦 Entrega criada:', created);
    return { delivered: true };
  }
}

// ========================================
// ESTATÍSTICAS
// ========================================

export async function getModuleStats(turmaId?: string) {
  try {
    // Query base para módulos
    let modulesQuery = supabase.from('modules').select('id, stock_quantity');
    if (turmaId) {
      modulesQuery = modulesQuery.eq('turma_id', turmaId);
    }
    const { data: modules } = await modulesQuery;

    // Se não há módulos para a turma filtrada, retorna tudo zerado
    if (!modules || modules.length === 0) {
      return { totalStock: 0, delivered: 0, available: 0 };
    }

    const totalStock = modules.reduce((sum, m) => sum + m.stock_quantity, 0);
    const moduleIds = modules.map(m => m.id);

    // Query para entregas - sempre filtra pelos módulos encontrados
    const { count: deliveredCount } = await supabase
      .from('module_deliveries')
      .select('*', { count: 'exact', head: true })
      .in('module_id', moduleIds);

    return {
      totalStock,
      delivered: deliveredCount || 0,
      available: totalStock - (deliveredCount || 0),
    };
  } catch (err) {
    console.error('Erro ao buscar estatísticas:', err);
    return { totalStock: 0, delivered: 0, available: 0 };
  }
}

// ========================================
// BUSCAR TURMAS PARA FILTRO
// ========================================

export async function getTurmasForFilter() {
  const { data, error } = await supabase
    .from('turmas')
    .select(`
      id,
      name,
      course:courses(title)
    `)
    .order('name');

  if (error) throw error;
  return data || [];
}

// ========================================
// FUNÇÕES PARA ALUNOS
// ========================================

/**
 * Hook para buscar módulos entregues para o aluno logado
 */
export function useStudentModules() {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentModules();
  }, []);

  const fetchStudentModules = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error('Usuário não autenticado');

      console.log('🔍 Buscando módulos para aluno:', userData.user.id);

      // Teste 1: Buscar todas as entregas sem filtro (para ver se há problema de RLS)
      const { data: testAll, error: testError } = await supabase
        .from('module_deliveries')
        .select('*')
        .eq('student_id', userData.user.id);
      
      console.log('🧪 Teste sem filtros:', JSON.stringify(testAll, null, 2), 'Erro:', testError);

      // Buscar entregas de módulos para o aluno (somente os já entregues)
      const { data: deliveries, error: deliveriesError } = await supabase
        .from('module_deliveries')
        .select(`
          *,
          module:modules!inner(
            id,
            name,
            stock_quantity,
            turma:turmas(
              id,
              name,
              course:courses(title)
            )
          )
        `)
        .eq('student_id', userData.user.id)
        .not('delivered_at', 'is', null)
        .order('delivered_at', { ascending: false });

      console.log('📦 Módulos encontrados:', deliveries);
      console.log('❌ Erro na query:', deliveriesError);
      
      if (deliveriesError) {
        console.error('Erro detalhado:', JSON.stringify(deliveriesError, null, 2));
        throw deliveriesError;
      }

      setModules(deliveries || []);
    } catch (err: any) {
      setError(err.message);
      console.error('Erro ao buscar módulos do aluno:', err);
    } finally {
      setLoading(false);
    }
  };

  return { modules, loading, error, refetch: fetchStudentModules };
}

/**
 * Confirmar recebimento de módulo pelo aluno
 */
export async function confirmModuleReceipt(deliveryId: string) {
  const { data, error } = await supabase
    .from('module_deliveries')
    .update({
      student_confirmed: true,
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', deliveryId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

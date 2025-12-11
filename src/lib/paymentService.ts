/**
 * Helper para registrar pagamentos e matrículas no Supabase
 */

import { supabase } from './supabaseClient';

interface CreatePaymentParams {
  userId: string;
  turmaId: string;
  modality: 'presential' | 'online';
  asaasPaymentId: string;
  billingType: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'BOLETO';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  pixQrCode?: string;
  pixCopyPaste?: string;
  bankSlipUrl?: string;
  invoiceUrl?: string;
}

/**
 * Cria matrícula e registro de pagamento no Supabase
 */
export async function createEnrollmentWithPayment(params: CreatePaymentParams) {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }

  try {
    // Verificar se já existe uma matrícula ativa
    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id, status')
      .eq('user_id', params.userId)
      .eq('turma_id', params.turmaId)
      .single();

    // Se já existe e está ativa, não criar duplicata
    if (existingEnrollment && existingEnrollment.status === 'active') {
      console.log('Enrollment already exists and is active');
      return {
        enrollmentId: existingEnrollment.id,
        paymentId: null,
        alreadyEnrolled: true
      };
    }

    // Chamar função do Supabase que cria enrollment + payment atomicamente
    const { data, error } = await supabase.rpc('create_enrollment_with_payment', {
      p_user_id: params.userId,
      p_turma_id: params.turmaId,
      p_modality: params.modality,
      p_asaas_payment_id: params.asaasPaymentId,
      p_billing_type: params.billingType,
      p_value: params.value,
      p_due_date: params.dueDate,
      p_description: params.description || null,
      p_external_reference: params.externalReference || null,
    });

    if (error) {
      console.error('Error creating enrollment with payment:', error);
      throw error;
    }

    const enrollmentId = data[0].enrollment_id;
    const paymentId = data[0].payment_id;

    // Atualizar dados extras do pagamento (PIX QR Code, Boleto URL, etc)
    if (params.pixQrCode || params.pixCopyPaste || params.bankSlipUrl || params.invoiceUrl) {
      const { error: updateError } = await supabase
        .from('payments')
        .update({
          pix_qr_code: params.pixQrCode || null,
          pix_copy_paste: params.pixCopyPaste || null,
          bank_slip_url: params.bankSlipUrl || null,
          invoice_url: params.invoiceUrl || null,
          installment_count: params.installmentCount || 1,
        })
        .eq('id', paymentId);

      if (updateError) {
        console.error('Error updating payment extras:', updateError);
      }
    }

    console.log('Enrollment and payment created:', { enrollmentId, paymentId });

    return {
      enrollmentId,
      paymentId,
      alreadyEnrolled: false
    };

  } catch (error) {
    console.error('createEnrollmentWithPayment error:', error);
    throw error;
  }
}

/**
 * Atualizar status do pagamento
 */
export async function updatePaymentStatus(
  asaasPaymentId: string,
  status: string,
  paymentDate?: string
) {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }

  const { error } = await supabase
    .from('payments')
    .update({
      status,
      payment_date: paymentDate || null,
      confirmed_date: ['CONFIRMED', 'RECEIVED'].includes(status) ? new Date().toISOString() : null,
    })
    .eq('asaas_payment_id', asaasPaymentId);

  if (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
}

/**
 * Buscar pagamento por ID do Asaas
 */
export async function getPaymentByAsaasId(asaasPaymentId: string) {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }

  const { data, error } = await supabase
    .from('payments')
    .select('*, enrollments(*), turmas(*)')
    .eq('asaas_payment_id', asaasPaymentId)
    .single();

  if (error) {
    console.error('Error fetching payment:', error);
    return null;
  }

  return data;
}

/**
 * Listar pagamentos do usuário
 */
export async function getUserPayments(userId: string) {
  if (!supabase) {
    throw new Error('Supabase not initialized');
  }

  const { data, error } = await supabase
    .from('payments')
    .select('*, turmas(*, course:courses(*))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user payments:', error);
    return [];
  }

  return data || [];
}

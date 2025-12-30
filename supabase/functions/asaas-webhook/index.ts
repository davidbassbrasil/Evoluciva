// Edge Function: Webhook Asaas
// Recebe notificações do Asaas e atualiza status de pagamentos
// Libera matrículas automaticamente quando pagamento confirmado

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Criar cliente Supabase uma vez (reutilizado em warm starts)
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, asaas-access-token',
};

interface WebhookPayload {
  event: string;
  payment: {
    id: string;
    customer: string;
    billingType: string;
    value: number;
    netValue?: number;
    status: string;
    dueDate: string;
    paymentDate?: string;
    confirmedDate?: string;
    description?: string;
    externalReference?: string;
    invoiceUrl?: string;
    bankSlipUrl?: string;
    installment?: number;
    installmentCount?: number;
    installmentValue?: number;
    discount?: { value: number };
    interest?: { value: number };
    fine?: { value: number };
  };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }
  
  // Só aceitar POST
  if (req.method !== 'POST') {
    return new Response('Método não permitido', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    // Parse payload
    const payload: WebhookPayload = await req.json();
    
    const eventType = payload?.event ?? 'UNKNOWN';
    const paymentId = payload?.payment?.id ?? null;
    
    // IP real do cliente
    const ip = req.headers.get('x-real-ip') || 
                req.headers.get('x-forwarded-for') || 
                'unknown';
    
    console.log(`📩 Webhook recebido: ${eventType} - Payment: ${paymentId} - IP: ${ip}`);
    console.log('📦 Payload completo:', JSON.stringify(payload));

    // Registrar webhook log
    const logEntry = {
      event_type: eventType,
      asaas_payment_id: paymentId,
      payload: payload,
      headers: Object.fromEntries(req.headers.entries()),
      source_ip: ip,
      user_agent: req.headers.get('user-agent'),
    };
    
    console.log('💾 Tentando inserir log:', JSON.stringify(logEntry));
    
    const { data: logData, error: logError } = await supabase
      .from('webhook_logs')
      .insert(logEntry)
      .select()
      .single();

    if (logError) {
      console.error('❌ Erro ao salvar log:', JSON.stringify(logError));
      console.error('❌ Detalhes do erro:', logError.message, logError.details, logError.hint);
    } else {
      console.log('✅ Log salvo com ID:', logData?.id);
    }

    // Processar evento
    try {
      await processWebhookEvent(supabase, payload, logData?.id);
      
      // Marcar log como processado
      if (logData?.id) {
        await supabase
          .from('webhook_logs')
          .update({ 
            processed: true, 
            processed_at: new Date().toISOString() 
          })
          .eq('id', logData.id);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Webhook processed' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (processingError: any) {
      console.error('[webhook] Processing error:', processingError);
      
      // Registrar erro no log
      if (logData?.id) {
        await supabase
          .from('webhook_logs')
          .update({ 
            processed: false,
            error_message: processingError.message,
            retry_count: (logData.retry_count || 0) + 1
          })
          .eq('id', logData.id);
      }

      throw processingError;
    }

  } catch (error: any) {
    console.error('[webhook] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Processar eventos do webhook
async function processWebhookEvent(
  supabase: any, 
  payload: WebhookPayload,
  logId?: string
) {
  const { event, payment } = payload;

  // Buscar pagamento existente
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('*, enrollments(*)')
    .eq('asaas_payment_id', payment.id)
    .single();

  // Mapear status do Asaas para nosso ENUM
  const statusMap: Record<string, string> = {
    'PENDING': 'PENDING',
    'RECEIVED': 'RECEIVED',
    'CONFIRMED': 'CONFIRMED',
    'OVERDUE': 'OVERDUE',
    'REFUNDED': 'REFUNDED',
    'RECEIVED_IN_CASH': 'RECEIVED_IN_CASH',
    'REFUND_REQUESTED': 'REFUND_REQUESTED',
    'CHARGEBACK_REQUESTED': 'CHARGEBACK_REQUESTED',
    'CHARGEBACK_DISPUTE': 'CHARGEBACK_DISPUTE',
    'AWAITING_CHARGEBACK_REVERSAL': 'AWAITING_CHARGEBACK_REVERSAL',
    'DUNNING_REQUESTED': 'DUNNING_REQUESTED',
    'DUNNING_RECEIVED': 'DUNNING_RECEIVED',
    'AWAITING_RISK_ANALYSIS': 'AWAITING_RISK_ANALYSIS',
  };

  const mappedStatus = statusMap[payment.status] || 'PENDING';

  // Preparar dados para atualização
  // IMPORTANTE: não sobrescrever metadata.items (itens do carrinho) quando atualizarmos com payload do Asaas
  let mergedMetadata: any = payment;
  try {
    const existingMeta = existingPayment?.metadata;
    if (existingMeta) {
      const parsed = typeof existingMeta === 'string' ? JSON.parse(existingMeta) : existingMeta;
      mergedMetadata = { ...parsed, ...payment };
      // preservar items se existirem no metadata antigo
      if (parsed.items && !mergedMetadata.items) mergedMetadata.items = parsed.items;
    }
  } catch (e) {
    // parsing failed - fallback to payment payload
    mergedMetadata = payment;
  }

  const paymentData = {
    status: mappedStatus,
    payment_date: payment.paymentDate || null,
    confirmed_date: payment.confirmedDate || null,
    net_value: payment.netValue || null,
    discount_value: payment.discount?.value || 0,
    interest_value: payment.interest?.value || 0,
    fine_value: payment.fine?.value || 0,
    metadata: mergedMetadata,
  };

  if (existingPayment) {
    // Atualizar pagamento existente
    console.log(`[webhook] Updating payment ${payment.id} to status ${mappedStatus}`);
    
    const { error } = await supabase
      .from('payments')
      .update(paymentData)
      .eq('id', existingPayment.id);

    if (error) {
      throw new Error(`Failed to update payment: ${error.message}`);
    }

    // Se pagamento confirmado/recebido, garantir criação de matrículas com base em metadata (fallback se trigger não cobrir todos os itens)
    if (['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'].includes(mappedStatus)) {
      console.log(`[webhook] Payment confirmed - verifying enrollments`);

      // Recarregar pagamento atualizado com metadata e enrollments
      const { data: updatedPayment, error: reloadError } = await supabase
        .from('payments')
        .select('*, enrollments(*)')
        .eq('id', existingPayment.id)
        .single();

      if (reloadError) {
        console.error('[webhook] Error reloading payment:', reloadError);
      } else {
        try {
          const items = (updatedPayment.metadata && updatedPayment.metadata.items) || [];
          const userId = updatedPayment.user_id;
          const paymentId = updatedPayment.id;
          const billingType = updatedPayment.billing_type;
          const paymentNet = updatedPayment.net_value ?? updatedPayment.value ?? null;
          const paymentDate = payment.paymentDate || payment.confirmedDate || new Date().toISOString();

          if (Array.isArray(items) && items.length > 0) {
            console.log(`[webhook] Found ${items.length} item(s) in payment metadata - ensuring enrollments`);
            for (const it of items) {
              const turmaId = it.turma_id;
              const modality = it.modality || 'presential';

              // Verificar se já existe matrícula para este usuário/turma
              const { data: existingEnroll, error: existingErr } = await supabase
                .from('enrollments')
                .select('id, payment_status')
                .eq('profile_id', userId)
                .eq('turma_id', turmaId)
                .limit(1)
                .maybeSingle();

              if (existingErr) {
                console.error('[webhook] Error querying existing enrollment:', existingErr);
              }

              const amount = paymentNet && typeof paymentNet === 'number' ? (paymentNet / items.length) : null;

              if (!existingEnroll) {
                console.log(`[webhook] Creating enrollment for user ${userId} turma ${turmaId}`);

                const { data: insData, error: insertErr } = await supabase
                  .from('enrollments')
                  .insert({
                    profile_id: userId,
                    turma_id: turmaId,
                    modality,
                    payment_status: 'paid',
                    payment_method: billingType || 'unknown',
                    payment_id: paymentId,
                    amount_paid: amount,
                    paid_at: paymentDate,
                    enrolled_at: new Date().toISOString(),
                  }).select().single();

                if (insertErr) {
                  console.error('[webhook] Error creating enrollment:', insertErr);
                } else {
                  console.log(`[webhook] Enrollment created for turma ${turmaId} id=${insData?.id}`);
                }
              } else {
                // If enrollment exists but is not marked as paid, update it to avoid duplicates and make it active
                try {
                  if (existingEnroll.payment_status !== 'paid') {
                    const { error: updErr } = await supabase
                      .from('enrollments')
                      .update({ payment_status: 'paid', paid_at: paymentDate, payment_id: paymentId, amount_paid: amount })
                      .eq('id', existingEnroll.id);

                    if (updErr) {
                      console.error('[webhook] Error updating existing enrollment to paid:', updErr);
                    } else {
                      console.log(`[webhook] Updated enrollment ${existingEnroll.id} to paid for turma ${turmaId}`);
                    }
                  } else {
                    console.log(`[webhook] Enrollment already paid for user ${userId} turma ${turmaId} id=${existingEnroll.id}`);
                  }
                } catch (e) {
                  console.error('[webhook] Error handling existing enrollment:', e);
                }
              }
            }
          } else {
            // Fallback: se nenhuma metadata de items, mas existe turma_id no pagamento e não há matrícula, criar uma matrícula única
            const turmaId = updatedPayment.turma_id;
            if (turmaId && (!updatedPayment.enrollments || updatedPayment.enrollments.length === 0)) {
              console.log('[webhook] No items metadata - creating single enrollment based on payment.turma_id');

              const { data: existingEnroll, error: existingErr } = await supabase
                .from('enrollments')
                .select('id, payment_status')
                .eq('profile_id', updatedPayment.user_id)
                .eq('turma_id', turmaId)
                .limit(1)
                .maybeSingle();

              if (existingErr) {
                console.error('[webhook] Error querying existing fallback enrollment:', existingErr);
              }

              if (!existingEnroll) {
                const { data: insData, error: insertErr } = await supabase
                  .from('enrollments')
                  .insert({
                    profile_id: updatedPayment.user_id,
                    turma_id: turmaId,
                    modality: 'presential',
                    payment_status: 'paid',
                    payment_method: updatedPayment.billing_type || 'unknown',
                    payment_id: updatedPayment.id,
                    amount_paid: updatedPayment.net_value ?? updatedPayment.value ?? null,
                    paid_at: payment.paymentDate || payment.confirmedDate || new Date().toISOString(),
                    enrolled_at: new Date().toISOString(),
                  }).select().single();

                if (insertErr) {
                  console.error('[webhook] Error creating fallback enrollment:', insertErr);
                } else {
                  console.log(`[webhook] Fallback enrollment created id=${insData?.id}`);
                }
              } else {
                if (existingEnroll.payment_status !== 'paid') {
                  const { error: updErr } = await supabase
                    .from('enrollments')
                    .update({ payment_status: 'paid', paid_at: payment.paymentDate || payment.confirmedDate || new Date().toISOString(), payment_id: updatedPayment.id, amount_paid: updatedPayment.net_value ?? updatedPayment.value ?? null })
                    .eq('id', existingEnroll.id);

                  if (updErr) {
                    console.error('[webhook] Error updating fallback enrollment to paid:', updErr);
                  } else {
                    console.log(`[webhook] Updated fallback enrollment ${existingEnroll.id} to paid`);
                  }
                } else {
                  console.log(`[webhook] Fallback enrollment already paid id=${existingEnroll.id}`);
                }
              }
            }
          }
        } catch (err) {
          console.error('[webhook] Error ensuring enrollments:', err);
        }
      }
    }

  } else {
    console.warn(`[webhook] Payment ${payment.id} not found in database`);
    // Opcionalmente, você pode criar o registro aqui se não existir
  }
}

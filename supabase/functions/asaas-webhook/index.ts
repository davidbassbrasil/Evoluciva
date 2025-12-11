// Edge Function: Webhook Asaas
// Recebe notificações do Asaas e atualiza status de pagamentos
// Libera matrículas automaticamente quando pagamento confirmado

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Criar cliente Supabase com service role (bypass RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

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
  const paymentData = {
    status: mappedStatus,
    payment_date: payment.paymentDate || null,
    confirmed_date: payment.confirmedDate || null,
    net_value: payment.netValue || null,
    discount_value: payment.discount?.value || 0,
    interest_value: payment.interest?.value || 0,
    fine_value: payment.fine?.value || 0,
    metadata: payment,
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

    // Se pagamento confirmado/recebido, trigger automático já ativa a matrícula
    if (['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'].includes(mappedStatus)) {
      console.log(`[webhook] Payment confirmed - enrollment auto-activated by trigger`);
    }

  } else {
    console.warn(`[webhook] Payment ${payment.id} not found in database`);
    // Opcionalmente, você pode criar o registro aqui se não existir
  }
}

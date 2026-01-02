import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DollarSign, TrendingUp, Calendar, CreditCard, Receipt, Download, Loader2, Search, Filter, Eye, RefreshCw, Users, CalendarIcon, Undo2, Webhook, Activity, Trash2, UserRound } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  formatBRDateTime, 
  formatBRDate, 
  formatBRWithAt,
  dateKeyBR,
  brStartOfDay,
  brEndOfDay,
  brStartOfMonth,
  brEndOfMonth,
  brStartOfYear,
  nowInBrazil,
  todayKeyBR
} from '@/lib/dates';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface WebhookLog {
  id: string;
  event_type: string;
  asaas_payment_id?: string;
  payment_id?: string;
  payload: any;
  processed: boolean;
  processed_at?: string;
  error_message?: string;
  retry_count: number;
  source_ip?: string;
  created_at: string;
}

interface Payment {
  id: string;
  asaas_payment_id: string;
  value: number;
  net_value?: number;
  status: string;
  billing_type: string;
  modality?: string;
  installment_count?: number;
  installment_number?: number;
  due_date: string;
  payment_date?: string;
  confirmed_date?: string;
  description: string;
  user_id: string;
  turma_id?: string;
  discount_value?: number;
  interest_value?: number;
  fine_value?: number;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
    whatsapp?: string;
  };
  turmas?: {
    name: string;
    course?: {
      title: string;
    };
  };
  refunds?: Array<{
    id: string;
    refund_value: number;
    status: string;
    reason: string;
    description?: string;
    created_at: string;
  }>;
  total_refunded?: number;
  // optional: mark synthetic local payments
  source?: 'local' | 'asaas';
  enrollment_id?: string;
}

export default function Financeiro() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [turmaFilter, setTurmaFilter] = useState<string>('all');
  const [turmasList, setTurmasList] = useState<Array<{ id: string; name: string; course_title?: string }>>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [paymentToCancel, setPaymentToCancel] = useState<string | null>(null);
  const [showCancelPaymentDialog, setShowCancelPaymentDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [refundValue, setRefundValue] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundDescription, setRefundDescription] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);
  
  // Webhook logs
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [filteredWebhookLogs, setFilteredWebhookLogs] = useState<WebhookLog[]>([]);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookSearchTerm, setWebhookSearchTerm] = useState('');
  const [webhookStatusFilter, setWebhookStatusFilter] = useState<string>('all');
  const [selectedWebhookLog, setSelectedWebhookLog] = useState<WebhookLog | null>(null);
  const [showWebhookDetails, setShowWebhookDetails] = useState(false);
  const [lastWebhookFetch, setLastWebhookFetch] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<string>('payments');
  const [deletingRefundId, setDeletingRefundId] = useState<string | null>(null);
  const [showDeleteRefundDialog, setShowDeleteRefundDialog] = useState(false);
  const [selectedRefundToDelete, setSelectedRefundToDelete] = useState<any | null>(null);
  // Filtros de data
  const [dateFrom, setDateFrom] = useState<Date>(brStartOfDay(subDays(new Date(), 6)));
  const [dateTo, setDateTo] = useState<Date>(brEndOfDay(new Date()));
  const [datePreset, setDatePreset] = useState<string>('7days');
  const [isSelectingRange, setIsSelectingRange] = useState(false);
  const [tempRangeStart, setTempRangeStart] = useState<Date | null>(null);
  const [calendarMode, setCalendarMode] = useState<'single' | 'range'>('single');

  // Reset all filters to their defaults
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setTurmaFilter('all');
    setDatePreset('7days');
    setDateFrom(brStartOfDay(subDays(new Date(), 6)));
    setDateTo(brEndOfDay(new Date()));
  };
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [stats, setStats] = useState({
    periodRevenue: 0,
    periodSales: 0,
    monthRevenue: 0,
    yearRevenue: 0,
    totalSales: 0,
    monthSales: 0,
    pendingAmount: 0,
    pendingCount: 0,
    refundedAmount: 0,
    avgTicket: 0,
    uniqueCustomers: 0,
  });

  // helpers imported from lib/dates (formatBRDateTime, formatBRDate, formatBRWithAt, brStartOfDay, brEndOfDay, brStartOfMonth, brEndOfMonth, brStartOfYear, nowInBrazil, dateKeyBR, todayKeyBR)

  // Verifica se o intervalo selecionado é exatamente hoje (BR timezone)
  const isRangeToday = (from: Date, to: Date) => {
    const fromKey = dateKeyBR(from);
    const toKey = dateKeyBR(to);
    const todayKey = todayKeyBR();
    return fromKey === todayKey && toKey === todayKey;
  };

  // Extrai modalidade(s) de um pagamento (procura em metadata.items)
  const getPaymentModalities = (p?: any) => {
    if (!p) return '-';
    try {
      // metadata pode ser objeto ou string JSON - tentar suportar ambos
      let metadata: any = p?.metadata;
      if (typeof metadata === 'string' && metadata) {
        try {
          metadata = JSON.parse(metadata);
        } catch (e) {
          // parsing falhou - ignorar
          metadata = null;
        }
      }

      const items = metadata?.items || p?.metadata?.items;
      if (Array.isArray(items) && items.length > 0) {
        const modalities = Array.from(new Set(items.map((it: any) => (it?.modality || '').toString())));
        const human = modalities.map((m: string) => (m === 'online' ? 'Online' : m === 'presential' ? 'Presencial' : m || '-'));
        return human.join(', ');
      }

      // fallback: se existir campo direto
      if (p.modality) return p.modality === 'online' ? 'Online' : p.modality === 'presential' ? 'Presencial' : p.modality;

      return '-';
    } catch (e) {
      return '-';
    }
  };

  useEffect(() => {
    loadPayments();
    loadWebhookLogs();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, statusFilter, typeFilter, turmaFilter, dateFrom, dateTo]);

  useEffect(() => {
    if (payments.length > 0) {
      calculateStats(payments);
    }
  }, [dateFrom, dateTo, payments]);

  useEffect(() => {
    loadTurmas();
  }, []);

  useEffect(() => {
    filterWebhookLogs();
  }, [webhookLogs, webhookSearchTerm, webhookStatusFilter]);

  const loadTurmas = async () => {
    try {
      const { data: turmasData, error } = await supabase
        .from('turmas')
        .select('id, name, course:courses(title)')
        .order('name');

      if (error) throw error;

      const formattedTurmas = turmasData?.map((t: any) => ({
        id: t.id,
        name: t.name,
        course_title: t.course?.title,
      })) || [];

      setTurmasList(formattedTurmas);
    } catch (error: any) {
      console.error('Erro ao carregar turmas:', JSON.stringify(error, null, 2));
      toast({ title: 'Erro ao carregar turmas', description: error?.message || 'Verifique sua conexão ou a configuração do Supabase.', variant: 'destructive' });
    }
  };

  const loadWebhookLogs = async () => {
    setWebhookLoading(true);
    try {
      const resp = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      // store raw response for debugging
      // @ts-ignore
      setLastWebhookFetch(resp);

      // supabase-js returns { data, error }
      // @ts-ignore
      if (resp.error) throw resp.error;
      // @ts-ignore
      setWebhookLogs(resp.data || []);
    } catch (error: any) {
      console.error('Erro ao carregar webhook logs:', error);
      toast({
        title: 'Erro ao carregar logs',
        description: error.message || 'Verifique permissões e a existência da tabela webhook_logs',
        variant: 'destructive',
      });
    } finally {
      setWebhookLoading(false);
    }
  };

  const filterWebhookLogs = () => {
    let filtered = [...webhookLogs];

    // Filtrar por busca
    if (webhookSearchTerm) {
      filtered = filtered.filter(log => 
        log.event_type.toLowerCase().includes(webhookSearchTerm.toLowerCase()) ||
        log.asaas_payment_id?.toLowerCase().includes(webhookSearchTerm.toLowerCase()) ||
        log.id.toLowerCase().includes(webhookSearchTerm.toLowerCase())
      );
    }

    // Filtrar por status
    if (webhookStatusFilter !== 'all') {
      if (webhookStatusFilter === 'processed') {
        filtered = filtered.filter(log => log.processed);
      } else if (webhookStatusFilter === 'error') {
        filtered = filtered.filter(log => !log.processed && log.error_message);
      } else if (webhookStatusFilter === 'pending') {
        filtered = filtered.filter(log => !log.processed && !log.error_message);
      }
    }

    setFilteredWebhookLogs(filtered);
  };

  // Aplicar preset de data
  const applyDatePreset = (preset: string) => {
    setDatePreset(preset);
    const today = new Date();
    
    switch (preset) {
      case 'today':
        setDateFrom(brStartOfDay(today));
        setDateTo(brEndOfDay(today));
        break;
      case '7days':
        setDateFrom(brStartOfDay(subDays(today, 6)));
        setDateTo(brEndOfDay(today));
        break;
      case '30days':
        setDateFrom(brStartOfDay(subDays(today, 29)));
        setDateTo(brEndOfDay(today));
        break;
      case '90days':
        setDateFrom(brStartOfDay(subDays(today, 89)));
        setDateTo(brEndOfDay(today));
        break;
      case 'month':
        setDateFrom(brStartOfMonth(today));
        setDateTo(brEndOfMonth(today));
        break;
      case 'year':
        setDateFrom(brStartOfYear(today));
        setDateTo(brEndOfDay(today));
        break;
      default:
        break;
    }
  };

  const loadPayments = async () => {
    setLoading(true);
    try {
      // Buscar pagamentos
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;

      // Buscar profiles para cada pagamento
      const paymentsWithProfiles = await Promise.all(
        (paymentsData || []).map(async (payment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email, whatsapp')
            .eq('id', payment.user_id)
            .single();

          const { data: turma } = payment.turma_id
            ? await supabase
                .from('turmas')
                .select('name, course:courses(title)')
                .eq('id', payment.turma_id)
                .single()
            : { data: null };

          // Buscar estornos deste pagamento (todos os status)
          const { data: refunds } = await supabase
            .from('refunds')
            .select('id, refund_value, status, reason, description, created_at')
            .eq('payment_id', payment.id)
            .order('created_at', { ascending: false });

          // Somar apenas estornos confirmados para cálculos financeiros
          const total_refunded = refunds?.filter(r => ['COMPLETED', 'PROCESSING', 'APPROVED'].includes(r.status))
            .reduce((sum, r) => sum + Number(r.refund_value), 0) || 0;

          // Tentar extrair modalidade dos metadata.items (pagamentos do checkout) ou, se não disponível, buscar pela enrollment_id
          let modality: string | undefined = getPaymentModalities(payment);
          if (modality === '-' || !modality) {
            modality = undefined;
          }

          // Se não encontrou via metadata, tentar buscar pela matrícula referenciada (enrollment_id)
          if (!modality && payment.enrollment_id) {
            try {
              const { data: enroll } = await supabase
                .from('enrollments')
                .select('modality')
                .eq('id', payment.enrollment_id)
                .single();
              if (enroll?.modality) {
                modality = enroll.modality === 'online' ? 'Online' : enroll.modality === 'presential' ? 'Presencial' : enroll.modality;
              }
            } catch (e) {
              // ignore errors, modality remains undefined
            }
          }

          // Se ainda não encontrou, tentar buscar a matrícula mais recente do usuário para a turma (caso exista user_id + turma_id)
          if (!modality && payment.user_id && payment.turma_id) {
            try {
              const { data: enrolls } = await supabase
                .from('enrollments')
                .select('modality')
                .eq('profile_id', payment.user_id)
                .eq('turma_id', payment.turma_id)
                .order('enrolled_at', { ascending: false })
                .limit(1);
              const e = Array.isArray(enrolls) && enrolls[0];
              if (e?.modality) {
                modality = e.modality === 'online' ? 'Online' : e.modality === 'presential' ? 'Presencial' : e.modality;
              }
            } catch (e) {
              // ignore
            }
          }

          return {
            ...payment,
            profiles: profile,
            turmas: turma,
            refunds: refunds || [],
            total_refunded,
            modality,
          };
        })
      );

      // DEBUG: contar quantos pagamentos têm modalidade definida
      setPayments(paymentsWithProfiles);
      calculateStats(paymentsWithProfiles);
      
      // Também carregar enrollments com colunas de caixa local e transformar em pagamentos sintéticos
      try {
        const { data: enrollmentsData, error: enrollErr } = await supabase
          .from('enrollments')
          .select('id, profile_id, turma_id, enrolled_at, paid_at, modality, amount_paid_local_pix, amount_paid_local_cash, amount_paid_local_credit_card, amount_paid_local_debit, payment_method_local_pix, payment_method_local_cash, payment_method_local_credit_card, payment_method_local_debit, profile:profiles(full_name,email), turma:turmas(name, course:courses(title))')
          .order('created_at', { ascending: false });

        if (!enrollErr && Array.isArray(enrollmentsData)) {
          // Load enrollment_refunds for these enrollments in one query
          const enrollmentIds = enrollmentsData.map((x: any) => x.id).filter(Boolean);
          let refundsData: any[] = [];
          try {
            if (enrollmentIds.length > 0) {
              const { data: rdata, error: rerr } = await supabase
                .from('enrollment_refunds')
                .select('id, refund_value, status, reason, description, created_at, enrollment_id')
                .in('enrollment_id', enrollmentIds);
              if (rerr) throw rerr;
              refundsData = rdata || [];
            }
          } catch (rloadErr) {
            console.error('Erro ao carregar enrollment_refunds:', rloadErr);
          }

          const refundsByEnrollment: Record<string, any[]> = {};
          refundsData.forEach((rf: any) => {
            if (!refundsByEnrollment[rf.enrollment_id]) refundsByEnrollment[rf.enrollment_id] = [];
            refundsByEnrollment[rf.enrollment_id].push(rf);
          });

          const synthetic = enrollmentsData.map((e: any) => {
            const pix = Number(e.amount_paid_local_pix || 0);
            const cash = Number(e.amount_paid_local_cash || 0);
            const credit = Number(e.amount_paid_local_credit_card || 0);
            const debit = Number(e.amount_paid_local_debit || 0);
            const total = pix + cash + credit + debit;
            if (!(total > 0)) return null;

            const refundsForEnrollment = refundsByEnrollment[e.id] || [];
            const total_refunded = refundsForEnrollment
              .filter((r: any) => ['COMPLETED', 'PROCESSING', 'APPROVED'].includes(r.status))
              .reduce((sum: number, r: any) => sum + Number(r.refund_value || 0), 0);

            // normalize refund shape similar to payments.refunds
            const normalizedRefunds = refundsForEnrollment.map((r: any) => ({
              id: r.id,
              refund_value: Number(r.refund_value),
              status: r.status,
              reason: r.reason,
              description: r.description,
              created_at: r.created_at,
              enrollment_id: r.enrollment_id,
            }));

            // Datas: preferir enrolled_at, depois created_at, igual ao modal do cifrão do Admin Alunos
            const mainDate = e.enrolled_at || e.created_at || new Date().toISOString();
            return {
              id: `local_${e.id}`,
              asaas_payment_id: `local_${e.id}`,
              value: total,
              net_value: total,
              status: 'CONFIRMED',
              billing_type: 'LOCAL',
              due_date: mainDate,
              payment_date: mainDate,
              confirmed_date: mainDate,
              description: `Caixa Local - ${e.turma?.name || ''}`,
              user_id: e.profile_id,
              turma_id: e.turma_id,
              modality: e.modality ? (e.modality === 'online' ? 'Online' : e.modality === 'presential' ? 'Presencial' : e.modality) : undefined,
              created_at: mainDate,
              profiles: e.profile || null,
              turmas: e.turma || null,
              refunds: normalizedRefunds,
              total_refunded: total_refunded,
              source: 'local',
              enrollment_id: e.id,
            } as Payment;
          }).filter(Boolean) as Payment[];

          if (synthetic.length > 0) {
            const all = [...paymentsWithProfiles, ...synthetic];
            setPayments(all);
            calculateStats(all);
          }
        }
      } catch (err: any) {
        console.error('Erro ao carregar enrollments para caixa local:', JSON.stringify(err, null, 2));
      }
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', JSON.stringify(error, null, 2));
      toast({
        title: 'Erro ao carregar pagamentos',
        description: error?.message || 'Verifique sua conexão ou a configuração do Supabase.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Payment[]) => {
    const confirmed = data.filter(p => ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'].includes(p.status));
    const pending = data.filter(p => ['PENDING', 'AWAITING_RISK_ANALYSIS'].includes(p.status));
    const refunded = data.filter(p => p.status === 'REFUNDED');
    
    const now = new Date();

    // Filtrar por período selecionado (comparar por dia no fuso BR usando chaves YYYY-MM-DD)
    const startKey = dateKeyBR(dateFrom) || '';
    const endKey = dateKeyBR(dateTo) || ''; 
    const periodPayments = confirmed.filter(p => {
      // Use the same date precedence as the table: enrolled_at > created_at > confirmed_date > payment_date
      const key = dateKeyBR(p.enrolled_at || p.created_at || p.confirmed_date || p.payment_date) || '';
      const match = key >= startKey && key <= endKey;
      if (key === todayKeyBR()) {
        // payment is for today (BR timezone) - suppressed debug log in production
      }
      return match;
    });

    // Para mês/ano, calcular diretamente a chave BR do 'now' e comparar prefixos
    const brNowKey = dateKeyBR(now) || '';
    const monthPrefix = brNowKey.slice(0, 7); // YYYY-MM
    const yearPrefix = brNowKey.slice(0, 4); // YYYY

    const monthPayments = confirmed.filter(p => {
      const key = (dateKeyBR(p.enrolled_at || p.created_at || p.confirmed_date || p.payment_date) || '').slice(0, 7);
      return key === monthPrefix;
    });

    const yearPayments = confirmed.filter(p => {
      const key = (dateKeyBR(p.enrolled_at || p.created_at || p.confirmed_date || p.payment_date) || '').slice(0, 4);
      return key === yearPrefix;
    });
    
    // Calcular receitas descontando estornos
    const periodRevenue = periodPayments.reduce((sum, p) => sum + Number(p.value) - (p.total_refunded || 0), 0);
    const monthRevenue = monthPayments.reduce((sum, p) => sum + Number(p.value) - (p.total_refunded || 0), 0);
    const yearRevenue = yearPayments.reduce((sum, p) => sum + Number(p.value) - (p.total_refunded || 0), 0);
    const totalRevenue = confirmed.reduce((sum, p) => sum + Number(p.value) - (p.total_refunded || 0), 0);
    
    const uniqueCustomers = new Set(confirmed.map(p => p.user_id)).size;
    
    setStats({
      periodRevenue,
      periodSales: periodPayments.length,
      monthRevenue,
      yearRevenue,
      totalSales: confirmed.length,
      monthSales: monthPayments.length,
      pendingAmount: pending.reduce((sum, p) => sum + Number(p.value), 0),
      pendingCount: pending.length,
      refundedAmount: refunded.reduce((sum, p) => sum + Number(p.value), 0),
      avgTicket: periodPayments.length > 0 ? periodRevenue / periodPayments.length : 0,
      uniqueCustomers,
    });
  };

  // Persistir os valores do caixa local (enrollment) na tabela payments
  const registerEnrollmentPayments = async (enrollmentId: string) => {
    // Load enrollment with local fields
    const { data: e, error: eErr } = await supabase
      .from('enrollments')
      .select('id, profile_id, turma_id, amount_paid_local_pix, amount_paid_local_cash, amount_paid_local_credit_card, amount_paid_local_debit, payment_method_local_pix, payment_method_local_cash, payment_method_local_credit_card, payment_method_local_debit')
      .eq('id', enrollmentId)
      .single();

    if (eErr) throw eErr;

    const parts: Array<{ method: string; value: number }> = [];
    if (Number(e.amount_paid_local_pix || 0) > 0) parts.push({ method: 'PIX', value: Number(e.amount_paid_local_pix) });
    if (Number(e.amount_paid_local_cash || 0) > 0) parts.push({ method: 'CASH', value: Number(e.amount_paid_local_cash) });
    if (Number(e.amount_paid_local_credit_card || 0) > 0) parts.push({ method: 'CREDIT_CARD', value: Number(e.amount_paid_local_credit_card) });
    if (Number(e.amount_paid_local_debit || 0) > 0) parts.push({ method: 'DEBIT_CARD', value: Number(e.amount_paid_local_debit) });

    if (parts.length === 0) return;

    const now = nowInBrazil();
    const inserts: any[] = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const billingType = part.method === 'CASH' ? 'UNDEFINED' : part.method;
      inserts.push({
        user_id: e.profile_id,
        turma_id: e.turma_id,
        enrollment_id: e.id,
        value: part.value,
        status: 'CONFIRMED',
        billing_type: billingType,
        asaas_payment_id: `admin_local_${e.id}_${i + 1}`,
        asaas_customer_id: e.profile_id,
        due_date: dateKeyBR(now) || now.toISOString().split('T')[0],
        payment_date: now.toISOString(),
        confirmed_date: now.toISOString(),
        description: `Pagamento Caixa Local (${part.method}) - matrícula ${e.id}`,
        metadata: { source: 'admin_cash_local', payment_part: `${i + 1}/${parts.length}` },
      });
    }

    const { error: insertErr } = await supabase.from('payments').insert(inserts);
    if (insertErr) {
      // Surface a clear error for callers so they can react (likely RLS blocks frontend inserts).
      const err = new Error(insertErr.message || 'Erro ao inserir pagamentos');
      // attach supabase error for debugging
      // @ts-ignore
      err.details = insertErr;
      // mark as permission error when status 403
      // @ts-ignore
      if (insertErr.status === 403 || insertErr.code === '42501') {
        // @ts-ignore
        err.name = 'RLS_FORBIDDEN';
      }
      throw err;
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];
    
    // Filtrar pagamentos cancelados por padrão (exceto se filtro de status for CANCELLED)
    if (statusFilter !== 'CANCELLED') {
      filtered = filtered.filter(p => p.status !== 'CANCELLED');
    }
    
    // Filtro por data (comparar por dia no fuso BR usando chaves YYYY-MM-DD)
    const startKey = dateKeyBR(dateFrom) || '';
    const endKey = dateKeyBR(dateTo) || '';
    filtered = filtered.filter(p => {
      // Use the same date precedence as the table: enrolled_at > created_at > confirmed_date > payment_date
      const key = dateKeyBR(p.enrolled_at || p.created_at || p.confirmed_date || p.payment_date) || '';
      return key >= startKey && key <= endKey;
    });
    
    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.asaas_payment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    // Filtro de tipo
    if (typeFilter !== 'all') {
      // include synthetic LOCAL entries
      filtered = filtered.filter(p => p.billing_type === typeFilter || (typeFilter === 'LOCAL' && p.source === 'local'));
    }
    
    // Filtro de turma
    if (turmaFilter !== 'all') {
      filtered = filtered.filter(p => p.turma_id === turmaFilter);
    }
    
    setFilteredPayments(filtered);
  };

  const handleRefund = async () => {
    if (!selectedPayment) return;
    
    const value = parseFloat(refundValue);
    if (isNaN(value) || value <= 0) {
      toast({
        title: 'Erro',
        description: 'Informe um valor válido para o estorno',
        variant: 'destructive',
      });
      return;
    }

    if (!refundReason.trim()) {
      toast({
        title: 'Erro',
        description: 'Informe o motivo do estorno',
        variant: 'destructive',
      });
      return;
    }

    setProcessingRefund(true);

    try {
      // If this is a Caixa Local (synthetic) entry we must handle refund differently
      // because Caixa Local values live on `enrollments` (not `payments`).
      const idStr = String(selectedPayment.id || '');
      if (idStr.startsWith('local_') || (selectedPayment as any).source === 'local') {
        // Extract enrollment id
        const enrollmentId = (selectedPayment as any).enrollment_id || idStr.replace(/^local_/, '');

        // Insert into enrollment_refunds table (separate from payments.refunds)
        try {
          const { data: { user } } = await supabase.auth.getUser();
          const { error: insertErr } = await supabase.from('enrollment_refunds').insert({
            enrollment_id: enrollmentId,
            refund_value: value,
            reason: refundReason,
            description: refundDescription || null,
            status: 'COMPLETED',
            approved_by: user?.id,
            approved_at: new Date().toISOString(),
            refund_date: new Date().toISOString(),
          });

          if (insertErr) {
            // If table doesn't exist or permission denied, surface a helpful error
            console.error('Erro ao inserir enrollment_refund:', insertErr);
            if (insertErr.status === 403) {
              toast({ title: 'Permissão negada', description: 'Não foi possível gravar o estorno do Caixa Local. Configure um endpoint servidor com SUPABASE_SERVICE_ROLE_KEY ou ajuste as políticas RLS.', variant: 'destructive' });
            } else {
              toast({ title: 'Erro', description: insertErr.message || 'Não foi possível registrar o estorno do Caixa Local', variant: 'destructive' });
            }
            setProcessingRefund(false);
            return;
          }

          toast({ title: 'Estorno registrado', description: 'Estorno do Caixa Local registrado com sucesso.' });
          setShowRefundDialog(false);
          setRefundValue('');
          setRefundReason('');
          setRefundDescription('');
          loadPayments();
          setProcessingRefund(false);
          return;
        } catch (error: any) {
          console.error('Erro ao carregar webhook logs:', JSON.stringify(error, null, 2));
          toast({ title: 'Erro ao carregar webhook logs', description: error?.message || 'Verifique sua conexão ou a configuração do Supabase.', variant: 'destructive' });
        } finally {
          setProcessingRefund(false);
          return;
        }
      }

      // default flow: refunds against payments
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('refunds').insert({
        payment_id: selectedPayment.id,
        refund_value: value,
        reason: refundReason,
        description: refundDescription || null,
        status: 'COMPLETED',
        approved_by: user?.id,
        approved_at: new Date().toISOString(),
        refund_date: new Date().toISOString(),
      });

      if (error) throw error;

      toast({
        title: 'Estorno registrado',
        description: 'O estorno foi registrado no sistema com sucesso',
      });

      setShowRefundDialog(false);
      setRefundValue('');
      setRefundReason('');
      setRefundDescription('');
      loadPayments(); // Recarregar para ver atualizações
    } catch (error: any) {
      console.error('Erro ao criar estorno:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível registrar o estorno',
        variant: 'destructive',
      });
    } finally {
      setProcessingRefund(false);
    }
  };

  const handleDeleteRefund = (refund: any) => {
    // open confirmation modal
    setSelectedRefundToDelete(refund);
    setShowDeleteRefundDialog(true);
  };

  const performDeleteRefund = async () => {
    const refund = selectedRefundToDelete;
    if (!refund || !refund.id) return;
    setDeletingRefundId(refund.id);
    try {
      if (refund.enrollment_id) {
        const { error } = await supabase.from('enrollment_refunds').delete().eq('id', refund.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('refunds').delete().eq('id', refund.id);
        if (error) throw error;
      }

      toast({ title: 'Estorno removido', description: 'O estorno foi excluído com sucesso.' });

      // Update the in-memory selectedPayment to remove this refund so UI updates immediately
      if (selectedPayment) {
        const newRefunds = (selectedPayment.refunds || []).filter((r: any) => r.id !== refund.id);
        const newTotalRefunded = newRefunds.reduce((sum: number, r: any) => sum + Number(r.refund_value || 0), 0);
        setSelectedPayment({ ...selectedPayment, refunds: newRefunds, total_refunded: newTotalRefunded });
      }

      // refresh global payments/enrollments list as well
      await loadPayments();
    } catch (err: any) {
      console.error('Erro ao deletar estorno:', err);
      if (err?.status === 403) {
        toast({ title: 'Permissão negada', description: 'Seu usuário não tem permissão para excluir estornos. Use um endpoint servidor com SUPABASE_SERVICE_ROLE_KEY ou ajuste RLS.', variant: 'destructive' });
      } else {
        toast({ title: 'Erro', description: err.message || 'Não foi possível excluir o estorno', variant: 'destructive' });
      }
    } finally {
      setDeletingRefundId(null);
      setShowDeleteRefundDialog(false);
      setSelectedRefundToDelete(null);
    }
  };

  const handleCancelPayment = async (paymentId: string) => {
    try {
      // Buscar o pagamento atual (sem logs)
      const { data: currentPayment, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      // confirmation is handled by the app modal; proceed directly

      // Atualizar status e solicitar retorno
      const res = await supabase
        .from('payments')
        .update({ status: 'CANCELLED' })
        .eq('id', paymentId)
        .select();

      // @ts-ignore
      if (res.error) {
        // @ts-ignore
        if (res.error.code === '42501' || res.error.message?.includes('permission')) {
          toast({ 
            title: 'Permissão negada', 
            description: 'Você não tem permissão para cancelar pagamentos. Verifique as políticas RLS no Supabase.',
            variant: 'destructive' 
          });
          return;
        }
        // @ts-ignore
        throw res.error;
      }

      const returned = (res as any).data;
      if (!returned || (Array.isArray(returned) && returned.length === 0)) {
        toast({ 
          title: 'Aviso', 
          description: 'Nenhum registro foi atualizado. Verifique as permissões RLS.',
          variant: 'destructive' 
        });
        return;
      }

      // Optimistic UI update
      setPayments((prev) => prev.map((p) => (p.id === paymentId ? { ...p, status: 'CANCELLED' } : p)));

      toast({ 
        title: 'Pagamento cancelado', 
        description: 'Status atualizado para CANCELLED. O pagamento não aparecerá mais na lista de pendentes.', 
      });

      // Refresh
      setTimeout(() => {
        loadPayments().catch(() => {});
      }, 500);
    } catch (err: any) {
      toast({ 
        title: 'Erro ao cancelar', 
        description: err?.message || 'Falha ao cancelar o pagamento',
        variant: 'destructive' 
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
      CONFIRMED: { label: 'Confirmado', variant: 'default', className: 'bg-green-500' },
      RECEIVED: { label: 'Recebido', variant: 'default', className: 'bg-green-500' },
      RECEIVED_IN_CASH: { label: 'Recebido em Dinheiro', variant: 'default', className: 'bg-green-600' },
      PENDING: { label: 'Pendente', variant: 'secondary', className: 'bg-yellow-500' },
      OVERDUE: { label: 'Vencido', variant: 'destructive' },
      REFUNDED: { label: 'Reembolsado', variant: 'outline' },
      CANCELLED: { label: 'Cancelado', variant: 'outline', className: 'bg-gray-500 text-white' },
      AWAITING_RISK_ANALYSIS: { label: 'Em Análise', variant: 'secondary', className: 'bg-blue-500' },
      REFUND_REQUESTED: { label: 'Reembolso Solicitado', variant: 'outline' },
    };
    const config = variants[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const getPaymentTypeName = (type: string) => {
    const types: Record<string, string> = {
      CREDIT_CARD: 'Cartão de Crédito',
      CREDIT_CARD_INSTALLMENT: 'Cartão Parcelado',
      DEBIT_CARD: 'Cartão de Débito',
      PIX: 'PIX',
      BOLETO: 'Boleto',
      CASH: 'Dinheiro',
      UNDEFINED: 'Não Definido',
      LOCAL: 'Caixa Local',
    };
    return types[type] || type;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const exportToCSV = () => {
    const headers = ['Data', 'Cliente', 'Email', 'Curso', 'Método', 'Status', 'Valor'];
    const rows = filteredPayments.map(p => [
      p.enrolled_at ? formatBRDateTime(p.enrolled_at) : p.created_at ? formatBRDateTime(p.created_at) : p.confirmed_date ? formatBRDateTime(p.confirmed_date) : p.payment_date ? formatBRDateTime(p.payment_date) : '-',
      p.profiles?.full_name || 'N/A',
      p.profiles?.email || 'N/A',
      p.turmas?.course?.title || p.description || '-',
      getPaymentTypeName(p.billing_type),
      p.status,
      p.value,
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pagamentos_${format(new Date(), 'dd-MM-yyyy')}.csv`;
    a.click();
    
    toast({
      title: 'Exportado!',
      description: 'Relatório de pagamentos exportado com sucesso',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-3xl font-bold">Financeiro</h1>
            <p className="text-muted-foreground">Acompanhe pagamentos, receitas e transações</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              onClick={() => {
                loadPayments();
                if (activeTab === 'webhooks') {
                  loadWebhookLogs();
                }
              }} 
              disabled={loading || webhookLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${(loading || webhookLoading) ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button onClick={exportToCSV} disabled={loading || filteredPayments.length === 0} className="whitespace-nowrap">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-1 sm:grid-cols-2">
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Pagamentos
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2">
              <Webhook className="w-4 h-4" />
              Logs Webhook Asaas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-6">
            {/* Filtros de Data */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtrar por Período</CardTitle>
              </CardHeader>
              <CardContent>
            <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
              <Button 
                variant={datePreset === '7days' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDatePreset('7days');
                  applyDatePreset('7days');
                }}
              >
                7 dias
              </Button>
              <Button 
                variant={datePreset === '30days' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDatePreset('30days');
                  applyDatePreset('30days');
                }}
              >
                30 dias
              </Button>

              <Button 
                variant={datePreset === '90days' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDatePreset('90days');
                  applyDatePreset('90days');
                }}
              >
                90 dias
              </Button>

              <Button 
                variant={datePreset === 'year' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setDatePreset('year');
                  applyDatePreset('year');
                }}
              >
                Este Ano
              </Button>

              {datePreset === 'custom' && (
                <Button 
                  variant="default"
                  size="sm"
                  className="col-span-3 sm:col-span-1"
                >
                  Período Customizado
                </Button>
              )}

              <Popover open={showDatePicker} onOpenChange={(open) => {
                setShowDatePicker(open);
                if (!open) {
                  setIsSelectingRange(false);
                  setTempRangeStart(null);
                }
              }}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="col-span-3 row-start-3 sm:col-span-1 sm:row-auto sm:ml-auto">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {format(dateFrom, 'dd/MM/yyyy')} - {format(dateTo, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 max-h-[500px] overflow-y-auto" align="end" side="bottom">
                  <div className="p-3 space-y-3">
                    {/* Seletor de modo */}
                    <div className="flex gap-2 border-b pb-3">
                      <Button
                        variant={calendarMode === 'single' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setCalendarMode('single');
                          setIsSelectingRange(false);
                          setTempRangeStart(null);
                        }}
                        className="flex-1"
                      >
                        Data Única
                      </Button>
                      <Button
                        variant={calendarMode === 'range' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setCalendarMode('range');
                          setIsSelectingRange(false);
                          setTempRangeStart(null);
                        }}
                        className="flex-1"
                      >
                        Período
                      </Button>
                    </div>

                    <div className="text-sm text-muted-foreground mb-2">
                      {calendarMode === 'single' 
                        ? 'Clique em uma data para filtrar apenas esse dia' 
                        : !isSelectingRange 
                          ? 'Clique em uma data para iniciar a seleção de período' 
                          : 'Clique novamente na mesma data ou escolha uma data final'}
                    </div>
                    <div>
                      <CalendarComponent
                        mode="single"
                        selected={tempRangeStart || dateFrom}
                        onSelect={(date) => {
                          if (!date) return;

                          // Modo Data Única: 1 clique seleciona o dia e fecha
                          if (calendarMode === 'single') {
                            setDateFrom(startOfDay(date));
                            setDateTo(endOfDay(date));
                            setDatePreset('custom');
                            setShowDatePicker(false);
                            return;
                          }

                          // Modo Período: lógica de 2 cliques
                          // Primeiro clique: define data inicial
                          if (!isSelectingRange) {
                            setTempRangeStart(startOfDay(date));
                            setIsSelectingRange(true);
                            return;
                          }

                          // Segundo clique na mesma data: define apenas essa data (hoje)
                          if (tempRangeStart && format(date, 'yyyy-MM-dd') === format(tempRangeStart, 'yyyy-MM-dd')) {
                            setDateFrom(startOfDay(date));
                            setDateTo(endOfDay(date));
                            setDatePreset('custom');
                            setIsSelectingRange(false);
                            setTempRangeStart(null);
                            setShowDatePicker(false);
                            return;
                          }

                          // Segundo clique em data diferente: define range
                          if (tempRangeStart) {
                            const start = date < tempRangeStart ? date : tempRangeStart;
                            const end = date < tempRangeStart ? tempRangeStart : date;
                            
                            setDateFrom(startOfDay(start));
                            setDateTo(endOfDay(end));
                            setDatePreset('custom');
                            setIsSelectingRange(false);
                            setTempRangeStart(null);
                            setShowDatePicker(false);
                          }
                        }}
                        className="scale-90"
                        initialFocus
                      />
                    </div>
                    {isSelectingRange && tempRangeStart && calendarMode === 'range' && (
                      <div className="border-t pt-3">
                        <div className="text-sm font-medium text-center text-green-600 mb-2">
                          📅 Início: {format(tempRangeStart, 'dd/MM/yyyy')}
                        </div>
                        <div className="text-xs text-center text-muted-foreground">
                          Clique novamente na mesma data para filtrar apenas esse dia,<br/>
                          ou clique em outra data para definir o período final
                        </div>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isRangeToday(dateFrom, dateTo) ? 'Receita de Hoje' : 
                 datePreset === '7days' ? 'Receita (7 dias)' :
                 datePreset === '30days' ? 'Receita (30 dias)' :
                 datePreset === '90days' ? 'Receita (90 dias)' :
                 datePreset === 'month' ? 'Receita do Mês' :
                 datePreset === 'year' ? 'Receita do Ano' :
                 'Receita do Período'}
              </CardTitle>
              <DollarSign className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loading ? '...' : formatCurrency(stats.periodRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.periodSales} vendas no período
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Receita do Mês</CardTitle>
              <Calendar className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {loading ? '...' : formatCurrency(stats.monthRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.monthSales} vendas este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
              <CreditCard className="w-4 h-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {loading ? '...' : formatCurrency(stats.pendingAmount)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pendingCount} pagamentos aguardando
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Médio</CardTitle>
              <Receipt className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {loading ? '...' : formatCurrency(stats.avgTicket)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Por venda
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Clientes</CardTitle>
              <Users className="w-4 h-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {loading ? '...' : stats.uniqueCustomers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Únicos que pagaram
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, email, ID do pagamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                  <SelectItem value="RECEIVED">Recebido</SelectItem>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="REFUNDED">Reembolsado</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <CreditCard className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                  <SelectItem value="CREDIT_CARD_INSTALLMENT">Parcelado</SelectItem>
                  <SelectItem value="DEBIT_CARD">Cartão de Débito</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="BOLETO">Boleto</SelectItem>
                 {/*   <SelectItem value="CASH">Dinheiro</SelectItem> */}
                    <SelectItem value="LOCAL">Caixa Local</SelectItem>
                </SelectContent>
              </Select>
              <Select value={turmaFilter} onValueChange={setTurmaFilter}>
                <SelectTrigger className="w-full md:w-[250px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Turma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Turmas</SelectItem>
                  {turmasList.map(turma => (
                    <SelectItem key={turma.id} value={turma.id}>
                      {turma.name} {turma.course_title ? `- ${turma.course_title}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setStatusFilter('PENDING')}>
                  Pendentes
                </Button>
                <Button variant="ghost" onClick={resetFilters}>
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Pagamentos */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pagamentos ({filteredPayments.length})</CardTitle>
              {filteredPayments.length !== payments.length && (
                <Badge variant="secondary">
                  {filteredPayments.length} de {payments.length} registros
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Mobile cards list for payments (inside Pagamentos card on mobile) */}
            <div className="md:hidden space-y-3">
              {filteredPayments.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">{payments.length === 0 ? 'Os pagamentos aparecerão aqui quando houver vendas' : 'Tente ajustar os filtros de busca'}</div>
              ) : (
                filteredPayments.map((p) => (
                  <div key={p.id} className="bg-card p-4 rounded-lg border">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{p.profiles?.full_name || 'N/A'}</span>
                          {p.user_id && (
                            <Link 
                              to={`/admin/alunos/impersonate/${p.user_id}`}
                              className="text-primary hover:text-primary/80 transition-colors flex-shrink-0"
                              title="Impersonar aluno"
                            >
                              <UserRound className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{p.profiles?.email || ''}</div>
                        <div className="text-xs text-muted-foreground mt-2">{p.confirmed_date ? formatBRDate(p.confirmed_date) : p.payment_date ? formatBRDate(p.payment_date) : formatBRDate(p.created_at)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-primary">{formatCurrency(Number(p.value))}</div>
                        <div className="text-xs text-muted-foreground">{getPaymentTypeName(p.billing_type)}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button className="flex-1" size="sm" onClick={() => { setSelectedPayment(p); setShowDetails(true); }}>
                        <Eye className="w-4 h-4 mr-2" />Detalhes
                      </Button>
                      <Button className="flex-1" size="sm" variant="outline" onClick={() => { setSelectedPayment(p); setRefundValue(String(Number(p.value) - (p.total_refunded || 0))); setShowRefundDialog(true); }}>
                        <Undo2 className="w-4 h-4 mr-2" />Estorno
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Nenhum pagamento encontrado</p>
                <p className="text-sm">
                  {payments.length === 0 
                    ? 'Os pagamentos aparecerão aqui quando houver vendas' 
                    : 'Tente ajustar os filtros de busca'}
                </p>
              </div>
            ) : (
              /* Desktop/tablet table - hidden on small screens */
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Curso/Turma</TableHead>
                      <TableHead>Modalidade</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((payment) => (
                      <TableRow key={payment.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium whitespace-nowrap">
                          {/* Prioriza enrolled_at, depois created_at, para todos os pagamentos */}
                          {payment.enrolled_at
                            ? formatBRDateTime(payment.enrolled_at)
                            : payment.created_at
                              ? formatBRDateTime(payment.created_at)
                              : payment.confirmed_date
                                ? formatBRDateTime(payment.confirmed_date)
                                : payment.payment_date
                                  ? formatBRDateTime(payment.payment_date)
                                  : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="min-w-[150px]">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{payment.profiles?.full_name || 'N/A'}</span>
                              {payment.user_id && (
                                <Link 
                                  to={`/admin/alunos/impersonate/${payment.user_id}`}
                                  className="text-primary hover:text-primary/80 transition-colors"
                                  title="Impersonar aluno"
                                >
                                  <UserRound className="w-4 h-4" />
                                </Link>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {payment.profiles?.email || ''}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[250px]">
                            <div className="font-medium truncate">
                              {payment.turmas?.course?.title || 'N/A'}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {payment.turmas?.name || payment.description || '-'}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="whitespace-nowrap text-sm">
                          {payment.modality || (getPaymentModalities(payment) !== '-' ? getPaymentModalities(payment) : '-')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span>{getPaymentTypeName(payment.billing_type)}</span>
                            {payment.source === 'local' && (
                              <span className="text-xs text-muted-foreground"></span>
                            )}
                            {payment.installment_count && payment.installment_count > 1 && (
                              <Badge variant="outline" className="text-xs">
                                {payment.installment_count}x
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell className="text-right font-bold whitespace-nowrap">
                          <div>
                            {payment.total_refunded && payment.total_refunded > 0 ? (
                              <>
                                <div className="text-muted-foreground line-through text-xs">
                                  {formatCurrency(Number(payment.value))}
                                </div>
                                <div className="text-green-600">
                                  {formatCurrency(Number(payment.value) - payment.total_refunded)}
                                </div>
                                <div className="text-xs text-orange-600">
                                  -{formatCurrency(payment.total_refunded)}
                                </div>
                              </>
                            ) : (
                              formatCurrency(Number(payment.value))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-1 justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setShowDetails(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {payment.status === 'PENDING' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => { setPaymentToCancel(payment.id); setShowCancelPaymentDialog(true); }}
                                className="text-white"
                                title="Cancelar pagamento pendente"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                            {['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'].includes(payment.status) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setRefundValue(String(Number(payment.value) - (payment.total_refunded || 0)));
                                  setShowRefundDialog(true);
                                }}
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                title="Solicitar Estorno"
                              >
                                <Undo2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalhes */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="w-full max-w-full sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Pagamento</DialogTitle>
              <DialogDescription>Detalhes completos do pagamento selecionado.</DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">ID Asaas</p>
                    <p className="font-mono text-sm">{selectedPayment.asaas_payment_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{selectedPayment.profiles?.full_name}</p>
                    <p className="text-sm text-muted-foreground">{selectedPayment.profiles?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Método de Pagamento</p>
                    <p className="font-medium">{getPaymentTypeName(selectedPayment.billing_type)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Valor</p>
                    <p className="font-bold text-lg">{formatCurrency(Number(selectedPayment.value))}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Pagamento</p>
                      <p className="font-medium">
                        {/* Prioriza enrolled_at, depois created_at, igual à tabela */}
                        {selectedPayment.enrolled_at
                          ? formatBRWithAt(selectedPayment.enrolled_at)
                          : selectedPayment.created_at
                            ? formatBRWithAt(selectedPayment.created_at)
                            : selectedPayment.confirmed_date
                              ? formatBRWithAt(selectedPayment.confirmed_date)
                              : selectedPayment.payment_date
                                ? formatBRWithAt(selectedPayment.payment_date)
                                : '-'}
                      </p>
                  </div>
                  {selectedPayment.total_refunded && selectedPayment.total_refunded > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Total Estornado</p>
                      <p className="font-bold text-orange-600">
                        {formatCurrency(selectedPayment.total_refunded)}
                      </p>
                    </div>
                  )}
                  {selectedPayment.installment_count && selectedPayment.installment_count > 1 && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Parcelas</p>
                        <p className="font-medium">{selectedPayment.installment_count}x</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Valor da Parcela</p>
                        <p className="font-medium">
                          {formatCurrency(Number(selectedPayment.value) / selectedPayment.installment_count)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
                {selectedPayment.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Descrição</p>
                    <p className="text-sm">{selectedPayment.description}{selectedPayment.modality ? ` — ${selectedPayment.modality}` : (getPaymentModalities(selectedPayment) !== '-' ? ` — ${getPaymentModalities(selectedPayment)}` : '')}</p>
                  </div>
                )}
                {selectedPayment.turmas && (
                  <div>
                    <p className="text-sm text-muted-foreground">Curso/Turma</p>
                    <p className="font-medium">{selectedPayment.turmas.course?.title}{selectedPayment.modality && (
                      <Badge variant="outline" className="text-xs ml-2">{selectedPayment.modality}</Badge>
                    )}</p>
                    <p className="text-sm text-muted-foreground">{selectedPayment.turmas.name}{selectedPayment.modality && (
                      <div className="text-xs text-muted-foreground mt-1">{selectedPayment.modality}</div>
                    )}</p>
                  </div>
                )}

                {/* Mostrar modalidade (Online / Presencial) extraída do metadata.items ou fallback */}
                <div>
                  <p className="text-sm text-muted-foreground">Modalidade</p>
                  <p className="font-medium">{selectedPayment.modality || (getPaymentModalities(selectedPayment) !== '-' ? getPaymentModalities(selectedPayment) : '-')}</p>
                </div>
                
                {selectedPayment.refunds && selectedPayment.refunds.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-3">Histórico de Estornos</p>
                    <div className="space-y-2">
                      {selectedPayment.refunds.map((refund) => (
                        <div key={refund.id} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                            <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-orange-900">
                                {formatCurrency(Number(refund.refund_value))}
                              </p>
                              <p className="text-sm font-medium text-orange-700">{refund.reason}</p>
                              {refund.description && (
                                <p className="text-sm text-orange-600 mt-1 italic">
                                  {refund.description}
                                </p>
                              )}
                              <p className="text-xs text-orange-600 mt-1">
                                {format(new Date(refund.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            <div className="flex items-start gap-2">
                              <Badge 
                                variant={refund.status === 'COMPLETED' ? 'default' : 'secondary'}
                                className={refund.status === 'COMPLETED' ? 'bg-green-500' : 'bg-yellow-500'}
                              >
                                {refund.status}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteRefund(refund)}
                                title="Deletar estorno"
                                disabled={deletingRefundId === refund.id}
                              >
                                {deletingRefundId === refund.id ? (
                                  <Loader2 className="w-4 h-4 text-destructive animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-2 border-t border-orange-200">
                        <span className="font-medium text-sm">Total Estornado:</span>
                        <span className="font-bold text-orange-600">
                          {formatCurrency(selectedPayment.total_refunded || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">Valor Líquido:</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(Number(selectedPayment.value) - (selectedPayment.total_refunded || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Cancel Payment Confirmation Modal */}
        <Dialog open={showCancelPaymentDialog} onOpenChange={setShowCancelPaymentDialog}>
          <DialogContent className="w-full max-w-md">
            <DialogHeader>
              <DialogTitle>Cancelar Pagamento</DialogTitle>
              <DialogDescription>Confirme o cancelamento deste pagamento selecionado.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p>Tem certeza que deseja cancelar este pagamento? Esta ação não pode ser desfeita.</p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowCancelPaymentDialog(false); setPaymentToCancel(null); }}>Cancelar</Button>
                <Button
                  onClick={async () => {
                    if (!paymentToCancel) return;
                    setShowCancelPaymentDialog(false);
                    const id = paymentToCancel;
                    setPaymentToCancel(null);
                    await handleCancelPayment(id);
                  }}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Cancelar pagamento
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {/* Delete Refund Confirmation Modal */}
        <Dialog open={showDeleteRefundDialog} onOpenChange={setShowDeleteRefundDialog}>
          <DialogContent className="w-full max-w-md">
            <DialogHeader>
                <DialogTitle>Confirmar exclusão de estorno</DialogTitle>
                <DialogDescription>Confirme a exclusão do estorno selecionado.</DialogDescription>
              </DialogHeader>
            <div className="space-y-4">
              <p>Tem certeza que deseja excluir este estorno? Esta ação não pode ser desfeita.</p>
              {selectedRefundToDelete && (
                <div className="p-3 bg-orange-50 rounded border border-orange-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{formatCurrency(Number(selectedRefundToDelete.refund_value))}</div>
                      <div className="text-xs text-muted-foreground">{selectedRefundToDelete.reason}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{format(new Date(selectedRefundToDelete.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteRefundDialog(false)}>Cancelar</Button>
                <Button onClick={performDeleteRefund} disabled={deletingRefundId !== null} className="bg-destructive hover:bg-destructive/90">{deletingRefundId ? 'Excluindo...' : 'Excluir estorno'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Estorno */}
        <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
          <DialogContent className="w-full max-w-full sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Solicitar Estorno</DialogTitle>
              <DialogDescription>Solicite um estorno para o pagamento selecionado.</DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Pagamento</p>
                  <p className="font-medium">{selectedPayment.profiles?.full_name}</p>
                  <p className="text-sm">{selectedPayment.turmas?.name || selectedPayment.description}</p>
                  <p className="text-lg font-bold text-green-600 mt-2">
                    Total: {formatCurrency(Number(selectedPayment.value) - (selectedPayment.total_refunded || 0))}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor do Estorno (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={Number(selectedPayment.value) - (selectedPayment.total_refunded || 0)}
                    value={refundValue}
                    onChange={(e) => setRefundValue(e.target.value)}
                    placeholder="0,00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Máximo: {formatCurrency(Number(selectedPayment.value) - (selectedPayment.total_refunded || 0))}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Motivo do Estorno *</label>
                  <Input
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Ex: Solicitação do cliente, erro no pagamento..."
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Descrição Detalhada (opcional)</label>
                  <Input
                    value={refundDescription}
                    onChange={(e) => setRefundDescription(e.target.value)}
                    placeholder="Informações adicionais sobre o estorno..."
                    maxLength={500}
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRefundDialog(false);
                      setRefundValue('');
                      setRefundReason('');
                      setRefundDescription('');
                    }}
                    disabled={processingRefund}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleRefund}
                    disabled={processingRefund}
                    className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
                  >
                    {processingRefund ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      'Solicitar Estorno'
                    )}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Este é um registro interno. O estorno na Asaas deve ser processado diretamente no painel da Asaas.
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
          </TabsContent>

          {/* Tab de Webhook Logs */}
          <TabsContent value="webhooks" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Logs de Webhook Asaas</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Últimos 100 webhooks recebidos do gateway Asaas
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadWebhookLogs}
                      disabled={webhookLoading}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${webhookLoading ? 'animate-spin' : ''}`} />
                      Atualizar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filtros Webhook */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por evento, ID de pagamento, ID do log..."
                      value={webhookSearchTerm}
                      onChange={(e) => setWebhookSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={webhookStatusFilter} onValueChange={setWebhookStatusFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <Activity className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="processed">Processados</SelectItem>
                      <SelectItem value="error">Com Erro</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tabela Webhook Logs */}
                  {webhookLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredWebhookLogs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Webhook className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">Nenhum log encontrado</p>
                    <p className="text-sm">
                      {webhookLogs.length === 0
                        ? 'Os webhooks do Asaas aparecerão aqui'
                        : 'Tente ajustar os filtros de busca'}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile cards */}
                    <div className="md:hidden space-y-3">
                      {filteredWebhookLogs.map(log => (
                        <div key={log.id} className="bg-card p-3 rounded-lg border">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-mono text-xs">{format(new Date(log.created_at), "dd/MM/yy HH:mm:ss", { locale: ptBR })}</div>
                              <div className="mt-1">
                                <Badge variant="outline" className="font-mono text-xs">{log.event_type}</Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm">{log.asaas_payment_id || '-'}</div>
                              <div className="text-xs text-muted-foreground mt-1">{log.source_ip || '-'}</div>
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button className="flex-1" size="sm" onClick={() => { setSelectedWebhookLog(log); setShowWebhookDetails(true); }}>
                              <Eye className="w-4 h-4 mr-2" />Ver
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data/Hora</TableHead>
                          <TableHead>Evento</TableHead>
                          <TableHead>Payment ID</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Tentativas</TableHead>
                          <TableHead>IP Origem</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredWebhookLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono text-xs">
                              {format(new Date(log.created_at), "dd/MM/yy HH:mm:ss", { locale: ptBR })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-mono text-xs">
                                {log.event_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {log.asaas_payment_id || '-'}
                            </TableCell>
                            <TableCell>
                              {log.processed ? (
                                <Badge className="bg-green-500">
                                  Processado
                                </Badge>
                              ) : log.error_message ? (
                                <Badge variant="destructive">
                                  Erro
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  Pendente
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant={log.retry_count > 0 ? 'destructive' : 'secondary'}>
                                {log.retry_count}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {log.source_ip || '-'}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedWebhookLog(log);
                                  setShowWebhookDetails(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                    </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Detalhes do Webhook */}
        <Dialog open={showWebhookDetails} onOpenChange={setShowWebhookDetails}>
          <DialogContent className="w-full max-w-full sm:max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Webhook</DialogTitle>
              <DialogDescription>Detalhes completos do webhook recebido.</DialogDescription>
            </DialogHeader>
            {selectedWebhookLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Log ID</p>
                    <p className="font-mono text-sm">{selectedWebhookLog.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Evento</p>
                    <Badge variant="outline">{selectedWebhookLog.event_type}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Payment ID (Asaas)</p>
                    <p className="font-mono text-sm">{selectedWebhookLog.asaas_payment_id || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Payment ID (Interno)</p>
                    <p className="font-mono text-sm">{selectedWebhookLog.payment_id || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Recebido em</p>
                    <p className="text-sm">
                      {format(new Date(selectedWebhookLog.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    {selectedWebhookLog.processed ? (
                      <Badge className="bg-green-500">Processado</Badge>
                    ) : selectedWebhookLog.error_message ? (
                      <Badge variant="destructive">Erro</Badge>
                    ) : (
                      <Badge variant="secondary">Pendente</Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">IP de Origem</p>
                    <p className="font-mono text-sm">{selectedWebhookLog.source_ip || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tentativas</p>
                    <Badge variant={selectedWebhookLog.retry_count > 0 ? 'destructive' : 'secondary'}>
                      {selectedWebhookLog.retry_count}
                    </Badge>
                  </div>
                </div>

                {selectedWebhookLog.processed_at && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Processado em</p>
                    <p className="text-sm">
                      {format(new Date(selectedWebhookLog.processed_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                    </p>
                  </div>
                )}

                {selectedWebhookLog.error_message && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm font-medium text-destructive mb-1">Mensagem de Erro</p>
                    <p className="text-sm text-destructive/80">{selectedWebhookLog.error_message}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Payload (JSON)</p>
                  <pre className="p-3 bg-muted rounded-lg text-xs overflow-x-auto max-h-96">
                    {JSON.stringify(selectedWebhookLog.payload, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

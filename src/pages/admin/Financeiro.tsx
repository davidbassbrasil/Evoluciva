import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DollarSign, TrendingUp, Calendar, CreditCard, Receipt, Download, Loader2, Search, Filter, Eye, RefreshCw, Users, CalendarIcon, Undo2, Webhook, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { format, startOfMonth, endOfMonth, startOfYear, startOfDay, endOfDay, subDays, startOfToday, endOfToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  const [activeTab, setActiveTab] = useState<string>('payments');
  
  // Filtros de data
  const [dateFrom, setDateFrom] = useState<Date>(startOfToday());
  const [dateTo, setDateTo] = useState<Date>(endOfToday());
  const [datePreset, setDatePreset] = useState<string>('today');
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
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    }
  };

  const loadWebhookLogs = async () => {
    setWebhookLoading(true);
    try {
      const { data, error } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setWebhookLogs(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar webhook logs:', error);
      toast({
        title: 'Erro ao carregar logs',
        description: error.message,
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
        setDateFrom(startOfToday());
        setDateTo(endOfToday());
        break;
      case '7days':
        setDateFrom(startOfDay(subDays(today, 6)));
        setDateTo(endOfToday());
        break;
      case '30days':
        setDateFrom(startOfDay(subDays(today, 29)));
        setDateTo(endOfToday());
        break;
      case '90days':
        setDateFrom(startOfDay(subDays(today, 89)));
        setDateTo(endOfToday());
        break;
      case 'month':
        setDateFrom(startOfMonth(today));
        setDateTo(endOfMonth(today));
        break;
      case 'year':
        setDateFrom(startOfYear(today));
        setDateTo(endOfToday());
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

          return {
            ...payment,
            profiles: profile,
            turmas: turma,
            refunds: refunds || [],
            total_refunded,
          };
        })
      );

      setPayments(paymentsWithProfiles);
      calculateStats(paymentsWithProfiles);
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os pagamentos',
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
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const yearStart = startOfYear(now);
    
    // Filtrar por período selecionado
    const periodPayments = confirmed.filter(p => {
      const date = new Date(p.payment_date || p.created_at);
      return date >= dateFrom && date <= dateTo;
    });
    
    const monthPayments = confirmed.filter(p => {
      const date = new Date(p.payment_date || p.created_at);
      return date >= monthStart && date <= monthEnd;
    });
    
    const yearPayments = confirmed.filter(p => {
      const date = new Date(p.payment_date || p.created_at);
      return date >= yearStart;
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

  const filterPayments = () => {
    let filtered = [...payments];
    
    // Filtrar pagamentos cancelados por padrão (exceto se filtro de status for CANCELLED)
    if (statusFilter !== 'CANCELLED') {
      filtered = filtered.filter(p => p.status !== 'CANCELLED');
    }
    
    // Filtro por data
    filtered = filtered.filter(p => {
      const date = new Date(p.payment_date || p.created_at);
      return date >= dateFrom && date <= dateTo;
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
      filtered = filtered.filter(p => p.billing_type === typeFilter);
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
      p.payment_date ? format(new Date(p.payment_date), 'dd/MM/yyyy HH:mm') : '-',
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Financeiro</h1>
            <p className="text-muted-foreground">Acompanhe pagamentos, receitas e transações</p>
          </div>
          <div className="flex gap-2">
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
            <Button onClick={exportToCSV} disabled={loading || filteredPayments.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
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
            <div className="flex flex-wrap gap-2 items-center">
              <div className="flex gap-2">
                <Button 
                  variant={datePreset === 'today' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setDatePreset('today');
                    applyDatePreset('today');
                  }}
                >
                  Hoje
                </Button>
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
                  variant={datePreset === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setDatePreset('month');
                    applyDatePreset('month');
                  }}
                >
                  Este Mês
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
              </div>
              
              <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-auto">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {format(dateFrom, 'dd/MM/yyyy')} - {format(dateTo, 'dd/MM/yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 max-h-[500px] overflow-y-auto" align="end" side="bottom">
                  <div className="p-3 space-y-3">
                    <div>
                      <label className="text-sm font-medium block mb-2">Data Inicial</label>
                      <CalendarComponent
                        mode="single"
                        selected={dateFrom}
                        onSelect={(date) => {
                          if (date) {
                            setDateFrom(startOfDay(date));
                            setDatePreset('custom');
                            setShowDatePicker(false);
                          }
                        }}
                        className="scale-90"
                        initialFocus
                      />
                    </div>
                    <div className="border-t pt-3">
                      <label className="text-sm font-medium block mb-2">Data Final</label>
                      <CalendarComponent
                        mode="single"
                        selected={dateTo}
                        onSelect={(date) => {
                          if (date) {
                            setDateTo(endOfDay(date));
                            setDatePreset('custom');
                            setShowDatePicker(false);
                          }
                        }}
                        disabled={(date) => date < dateFrom}
                        className="scale-90"
                      />
                    </div>
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
                {datePreset === 'today' ? 'Receita de Hoje' : 
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
                  <SelectItem value="OVERDUE">Vencido</SelectItem>
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
                  <SelectItem value="CASH">Dinheiro</SelectItem>
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Curso/Turma</TableHead>
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
                          {payment.payment_date 
                            ? format(new Date(payment.payment_date), 'dd/MM/yyyy HH:mm', { locale: ptBR }) 
                            : format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="min-w-[150px]">
                            <div className="font-medium">{payment.profiles?.full_name || 'N/A'}</div>
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
                        <TableCell>
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <span>{getPaymentTypeName(payment.billing_type)}</span>
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
                            {['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'].includes(payment.status) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setRefundValue(payment.value.toString());
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
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Pagamento</DialogTitle>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                      {selectedPayment.payment_date || selectedPayment.confirmed_date
                        ? format(new Date(selectedPayment.payment_date || selectedPayment.confirmed_date!), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                        : format(new Date(selectedPayment.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
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
                    <p className="text-sm">{selectedPayment.description}</p>
                  </div>
                )}
                {selectedPayment.turmas && (
                  <div>
                    <p className="text-sm text-muted-foreground">Curso/Turma</p>
                    <p className="font-medium">{selectedPayment.turmas.course?.title}</p>
                    <p className="text-sm text-muted-foreground">{selectedPayment.turmas.name}</p>
                  </div>
                )}
                
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
                            <Badge 
                              variant={refund.status === 'COMPLETED' ? 'default' : 'secondary'}
                              className={refund.status === 'COMPLETED' ? 'bg-green-500' : 'bg-yellow-500'}
                            >
                              {refund.status}
                            </Badge>
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

        {/* Modal de Estorno */}
        <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Solicitar Estorno</DialogTitle>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Pagamento</p>
                  <p className="font-medium">{selectedPayment.profiles?.full_name}</p>
                  <p className="text-sm">{selectedPayment.turmas?.name || selectedPayment.description}</p>
                  <p className="text-lg font-bold text-green-600 mt-2">
                    Valor: {formatCurrency(Number(selectedPayment.value))}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Valor do Estorno (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedPayment.value}
                    value={refundValue}
                    onChange={(e) => setRefundValue(e.target.value)}
                    placeholder="0,00"
                  />
                  <p className="text-xs text-muted-foreground">
                    Máximo: {formatCurrency(Number(selectedPayment.value))}
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

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRefundDialog(false);
                      setRefundValue('');
                      setRefundReason('');
                      setRefundDescription('');
                    }}
                    disabled={processingRefund}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleRefund}
                    disabled={processingRefund}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
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
                  <div className="overflow-x-auto">
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
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Detalhes do Webhook */}
        <Dialog open={showWebhookDetails} onOpenChange={setShowWebhookDetails}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Webhook</DialogTitle>
            </DialogHeader>
            {selectedWebhookLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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

import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, Pencil, Trash2, Search, Users, GraduationCap, 
  Download, FileText, Filter, Eye, UserPlus, Loader2,
  Mail, Phone, MapPin, Calendar, CreditCard, X, MessageCircle, DollarSign, Undo2, Minus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { adminCreateUserViaEdgeFunction } from '@/lib/createUserEdgeFunction';

// Types
interface Profile {
  id: string;
  email: string;
  full_name: string;
  whatsapp?: string;
  cpf?: string;
  address?: string;
  number?: string;
  complement?: string;
  state?: string;
  city?: string;
  cep?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

interface Turma {
  id: string;
  name: string;
  course_id: string;
  status: string;
  course?: {
    id: string;
    title: string;
    image?: string;
  };
}

interface Enrollment {
  id: string;
  profile_id: string;
  turma_id: string;
  modality: 'presential' | 'online';
  payment_status: string;
  payment_method?: string;
  amount_paid?: number;
  coupon_used?: string;
  enrolled_at: string;
  paid_at?: string;
  access_expires_at?: string;
  notes?: string;
  turma?: Turma;
  profile?: Profile;
}

interface ProfileForm {
  full_name: string;
  email: string;
  password: string;
  whatsapp: string;
  cpf: string;
  address: string;
  number: string;
  complement: string;
  state: string;
  city: string;
  cep: string;
}

const initialProfileForm: ProfileForm = {
  full_name: '',
  email: '',
  password: '',
  whatsapp: '',
  cpf: '',
  address: '',
  number: '',
  complement: '',
  state: '',
  city: '',
  cep: '',
};

export default function AdminAlunos() {
  // State
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [rawProfiles, setRawProfiles] = useState<any[]>([]);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [profilesError, setProfilesError] = useState<string | null>(null);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTurma, setFilterTurma] = useState<string>('all');
  
  // Dialogs
  const [openAddStudent, setOpenAddStudent] = useState(false);
  const [openEditStudent, setOpenEditStudent] = useState(false);
  const [openDeleteStudent, setOpenDeleteStudent] = useState(false);
  const [openEnrollStudent, setOpenEnrollStudent] = useState(false);
  const [openViewEnrollments, setOpenViewEnrollments] = useState(false);
  const [openDeleteEnrollment, setOpenDeleteEnrollment] = useState(false);
  const [openFinanceiro, setOpenFinanceiro] = useState(false);
  const [studentPayments, setStudentPayments] = useState<any[]>([]);
  const [studentEnrollments, setStudentEnrollments] = useState<Enrollment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [refundValue, setRefundValue] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundDescription, setRefundDescription] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);
  
  // Selected items
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedEnrollments, setSelectedEnrollments] = useState<Enrollment[]>([]);
  const [selectedEnrollmentToDelete, setSelectedEnrollmentToDelete] = useState<Enrollment | null>(null);
  
  // Forms
  const [profileForm, setProfileForm] = useState<ProfileForm>(initialProfileForm);
  const [enrollForm, setEnrollForm] = useState({
    turma_id: '',
    modality: 'presential',
    payment_status: 'paid',
    notes: '',
    paymentParts: [{ method: 'PIX', value: '' }], // Array de pagamentos
  });
  
  const { toast } = useToast();

  // Load data
  useEffect(() => {
    loadProfiles(); // Agora carrega tudo em paralelo (profiles + turmas + enrollments)
  }, []);

  const loadProfiles = async () => {
    if (!supabase) return;
    try {
      // ✨ OTIMIZAÇÃO: Executar auth check + queries em paralelo
      const [authRes, profilesResult, turmasResult, enrollmentsResult] = await Promise.all([
        // Auth user check
        supabase.auth.getUser().catch(e => {
          console.warn('Could not call supabase.auth.getUser():', e);
          return { data: { user: null }, error: e };
        }),
        
        // Profiles (apenas alunos)
        supabase
          .from('profiles')
          .select('id, full_name, email, whatsapp, cpf, address, number, complement, state, city, cep, role, created_at, updated_at', { count: 'exact' })
          .eq('role', 'student')
          .order('full_name'),
        
        // Turmas
        supabase
          .from('turmas')
          .select('id, name, course_id, status, course:courses (id, title, image)')
          .order('name'),
        
        // Enrollments
        supabase
          .from('enrollments')
          .select(`
            *,
            turma:turmas (
              id, name, course_id, status,
              course:courses (id, title, image)
            )
          `)
          .order('enrolled_at', { ascending: false })
      ]);

      // Auth user ID
      const uid = authRes?.data?.user?.id || null;
      setAuthUserId(uid);
      
      // Processar profiles
      if (profilesResult.error) {
        console.error('Erro na query profiles:', profilesResult.error);
        setProfilesError(profilesResult.error.message || String(profilesResult.error));
        setRawProfiles([]);
        setProfiles([]);
      } else {
        console.log('Profiles carregados (count):', profilesResult.count, profilesResult.data);
        setProfilesError(null);
        setRawProfiles(profilesResult.data || []);
        setProfiles(profilesResult.data || []);
      }
      
      // Processar turmas
      if (!turmasResult.error && turmasResult.data) {
        const mapped = turmasResult.data.map((t: any) => ({
          ...t,
          course: Array.isArray(t.course) ? t.course[0] : t.course
        })) as Turma[];
        setTurmas(mapped);
      }
      
      // Processar enrollments
      if (!enrollmentsResult.error && enrollmentsResult.data) {
        setEnrollments(enrollmentsResult.data || []);
      }
      
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      toast({ title: 'Erro ao carregar dados', description: error.message, variant: 'destructive' });
    }
  };
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={async () => {
                                        await openRefundForEnrollment(e.id);
                                      }}
                                      title="Solicitar Estorno"
                                    >
                                      <Undo2 className="w-4 h-4" />
                                    </Button>

  // Funções antigas removidas - agora tudo carrega em paralelo no loadProfiles
  const loadTurmas = async () => { /* deprecated - agora no loadProfiles */ };
  const loadEnrollments = async () => { /* deprecated - agora no loadProfiles */ };

  // Computed values
  const filteredProfiles = useMemo(() => {
    let result = profiles;
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        (p.full_name?.toLowerCase() || '').includes(term) ||
        (p.email?.toLowerCase() || '').includes(term) ||
        (p.whatsapp || '').includes(term) ||
        (p.cpf || '').includes(term)
      );
    }
    
    // Turma filter
    if (filterTurma && filterTurma !== 'all') {
      const enrolledProfileIds = enrollments
        .filter(e => e.turma_id === filterTurma)
        .map(e => e.profile_id);
      result = result.filter(p => enrolledProfileIds.includes(p.id));
    }
    
    return result;
  }, [profiles, searchTerm, filterTurma, enrollments]);

  const studentsCountByTurma = useMemo(() => {
    const counts: Record<string, number> = {};
    enrollments.forEach(e => {
      counts[e.turma_id] = (counts[e.turma_id] || 0) + 1;
    });
    return counts;
  }, [enrollments]);

  const selectedTurmaCounts = useMemo(() => {
    if (!filterTurma || filterTurma === 'all') return null;
    const turmaEnrolls = enrollments.filter(e => e.turma_id === filterTurma);
    const presencial = turmaEnrolls.filter(e => e.modality === 'presential').length;
    const online = turmaEnrolls.filter(e => e.modality === 'online').length;
    const total = turmaEnrolls.length;
    return { presencial, online, total };
  }, [enrollments, filterTurma]);

  const getEnrollmentsForProfile = (profileId: string) => {
    return enrollments.filter(e => e.profile_id === profileId);
  };

  // Format helpers
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 10) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 8);
    return numbers.replace(/(\d{5})(\d)/, '$1-$2');
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getWhatsAppHref = (phone?: string) => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    if (!digits) return null;
    // If there is no country code (<=11 digits), assume Brazil '55'
    const withCountry = digits.length <= 11 ? `55${digits}` : digits;
    return `https://wa.me/${withCountry}`;
  };

  // CRUD Operations
  const handleAddStudent = async () => {
    if (!supabase) return;
    if (!profileForm.full_name || !profileForm.email || !profileForm.password) {
      toast({ title: 'Erro', description: 'Nome, email e senha são obrigatórios', variant: 'destructive' });
      return;
    }

    if (profileForm.password.length < 6) {
      toast({ title: 'Erro', description: 'A senha deve ter no mínimo 6 caracteres', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // ✨ NOVO: Criar usuário via Edge Function usando Admin SDK
      // Isso cria o usuário no Auth e no profiles sem afetar a sessão do admin
      const response = await adminCreateUserViaEdgeFunction({
        email: profileForm.email,
        password: profileForm.password,
        full_name: profileForm.full_name,
        role: 'student',
        whatsapp: profileForm.whatsapp,
        cpf: profileForm.cpf,
        address: profileForm.address,
        number: profileForm.number,
        complement: profileForm.complement,
        state: profileForm.state,
        city: profileForm.city,
        cep: profileForm.cep,
      });

      if (!response.success) {
        toast({ 
          title: 'Erro ao cadastrar aluno', 
          description: response.error || 'Não foi possível criar a conta.', 
          variant: 'destructive' 
        });
        return;
      }

      toast({ 
        title: 'Sucesso', 
        description: 'Aluno cadastrado com sucesso no Auth e no banco de dados!' 
      });
      
      setOpenAddStudent(false);
      setProfileForm(initialProfileForm);
      loadProfiles();
    } catch (error: any) {
      toast({ 
        title: 'Erro ao cadastrar aluno', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = async () => {
    if (!supabase || !selectedProfile) return;
    if (!profileForm.full_name || !profileForm.email) {
      toast({ title: 'Erro', description: 'Nome e email são obrigatórios', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Perform update without requesting returned row to avoid 406 when RLS blocks returning
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileForm.full_name,
          email: profileForm.email,
          whatsapp: profileForm.whatsapp || null,
          cpf: profileForm.cpf || null,
          address: profileForm.address || null,
          number: profileForm.number || null,
          complement: profileForm.complement || null,
          state: profileForm.state || null,
          city: profileForm.city || null,
          cep: profileForm.cep || null,
        })
        .eq('id', selectedProfile.id);

      if (error) {
        if ((error as any)?.status === 406) {
          throw new Error('Falha ao atualizar: resposta do servidor inválida (406). Verifique RLS/policies (SELECT/UPDATE) no Supabase.');
        }
        throw error;
      }

      // Verify the update actually persisted by fetching the row back.
      try {
        const { data: fresh, error: freshErr } = await supabase
          .from('profiles')
          .select('id, full_name, email, whatsapp, cpf, address, number, complement, state, city, cep')
          .eq('id', selectedProfile.id)
          .single();

        if (freshErr) {
          if ((freshErr as any)?.status === 406) {
            throw new Error('Atualização enviada, mas não foi possível ler o perfil atualizado (406). Verifique RLS/policies de SELECT.');
          }
          throw freshErr;
        }

        if (!fresh) {
          throw new Error('Atualização enviada, mas o perfil não foi encontrado ao verificar. Verifique se o id do perfil existe.');
        }

        // Compare a few key fields to ensure persistence
        const mismatch = (
          (fresh.full_name || '') !== (profileForm.full_name || '') ||
          (fresh.email || '') !== (profileForm.email || '') ||
          ( (fresh.whatsapp || '') !== (profileForm.whatsapp || '') ) ||
          ( (fresh.cpf || '') !== (profileForm.cpf || '') )
        );

        if (mismatch) {
          throw new Error('Os dados parecem não ter sido persistidos. Isso pode ser causado por políticas RLS que bloqueiam UPDATE/SELECT.');
        }
      } catch (verifyErr: any) {
        throw verifyErr;
      }

      toast({ title: 'Sucesso', description: 'Dados atualizados com sucesso' });
      setOpenEditStudent(false);
      setSelectedProfile(null);
      setProfileForm(initialProfileForm);
      loadProfiles();
    } catch (error: any) {
      toast({ title: 'Erro ao atualizar aluno', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!supabase || !selectedProfile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedProfile.id);

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Aluno excluído com sucesso' });
      setOpenDeleteStudent(false);
      setSelectedProfile(null);
      await loadProfiles();
    } catch (error: any) {
      toast({ title: 'Erro ao excluir aluno', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Funções para gerenciar múltiplas formas de pagamento
  const addPaymentPart = () => {
    setEnrollForm(prev => ({
      ...prev,
      paymentParts: [...prev.paymentParts, { method: 'PIX', value: '' }]
    }));
  };

  const removePaymentPart = (index: number) => {
    setEnrollForm(prev => ({
      ...prev,
      paymentParts: prev.paymentParts.filter((_, i) => i !== index)
    }));
  };

  const updatePaymentPart = (index: number, field: 'method' | 'value', value: string) => {
    setEnrollForm(prev => ({
      ...prev,
      paymentParts: prev.paymentParts.map((part, i) => 
        i === index ? { ...part, [field]: value } : part
      )
    }));
  };

  const getTotalPaymentValue = () => {
    return enrollForm.paymentParts.reduce((sum, part) => {
      const value = parseFloat(part.value) || 0;
      return sum + value;
    }, 0);
  };

  const handleEnrollStudent = async () => {
    if (!supabase || !selectedProfile) return;
    if (!enrollForm.turma_id) {
      toast({ title: 'Erro', description: 'Selecione uma turma', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Validar pagamentos múltiplos
      if (enrollForm.payment_status === 'paid') {
        // Validar cada parte do pagamento
        for (let i = 0; i < enrollForm.paymentParts.length; i++) {
          const part = enrollForm.paymentParts[i];
          const value = parseFloat(part.value);
          
          if (!part.value || isNaN(value) || value <= 0) {
            toast({ 
              title: 'Erro', 
              description: `Informe um valor válido para o pagamento ${i + 1}`,
              variant: 'destructive' 
            });
            setLoading(false);
            return;
          }
        }
      }

      // Check if already enrolled
      const { data: existing } = await supabase
        .from('enrollments')
        .select('id')
        .eq('profile_id', selectedProfile.id)
        .eq('turma_id', enrollForm.turma_id)
        .eq('modality', enrollForm.modality)
        .single();
      
      if (existing) {
        toast({ title: 'Erro', description: 'Aluno já matriculado nesta turma/modalidade', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // Get turma to copy access_end_date and price
      const { data: turma } = await supabase
        .from('turmas')
        .select('access_end_date, name, course:courses(title)')
        .eq('id', enrollForm.turma_id)
        .single();

      const now = new Date();

      // Criar matrícula
      const totalPaid = enrollForm.payment_status === 'paid' ? getTotalPaymentValue() : 0;

      // Somar valores por tipo para popular as colunas locais (pix, cash, credit, debit)
      let amount_paid_local_pix = 0;
      let amount_paid_local_cash = 0;
      let amount_paid_local_credit_card = 0;
      let amount_paid_local_debit = 0;

      for (let i = 0; i < enrollForm.paymentParts.length; i++) {
        const part = enrollForm.paymentParts[i];
        const partValue = parseFloat(part.value) || 0;
        switch ((part.method || '').toString()) {
          case 'PIX':
            amount_paid_local_pix += partValue;
            break;
          case 'CASH':
            amount_paid_local_cash += partValue;
            break;
          case 'CREDIT_CARD':
            amount_paid_local_credit_card += partValue;
            break;
          case 'DEBIT_CARD':
            amount_paid_local_debit += partValue;
            break;
          default:
            break;
        }
      }

      const payment_method_local_pix = amount_paid_local_pix > 0 ? 'PIX' : null;
      const payment_method_local_cash = amount_paid_local_cash > 0 ? 'CASH' : null;
      const payment_method_local_credit_card = amount_paid_local_credit_card > 0 ? 'CREDIT_CARD' : null;
      const payment_method_local_debit = amount_paid_local_debit > 0 ? 'DEBIT_CARD' : null;

      const { data: enrollment, error: enrollError } = await supabase
        .from('enrollments')
        .insert({
          profile_id: selectedProfile.id,
          turma_id: enrollForm.turma_id,
          modality: enrollForm.modality,
          payment_status: enrollForm.payment_status,
          payment_method: enrollForm.payment_status === 'free' ? 'free' : 'cash_local',
          amount_paid: totalPaid,
          // Local payment breakdown
          payment_method_local_pix,
          payment_method_local_cash,
          payment_method_local_credit_card,
          payment_method_local_debit,
          amount_paid_local_pix: amount_paid_local_pix || null,
          amount_paid_local_cash: amount_paid_local_cash || null,
          amount_paid_local_credit_card: amount_paid_local_credit_card || null,
          amount_paid_local_debit: amount_paid_local_debit || null,
          enrolled_at: now.toISOString(),
          paid_at: enrollForm.payment_status === 'paid' || enrollForm.payment_status === 'free' ? now.toISOString() : null,
          access_expires_at: turma?.access_end_date || null,
          notes: enrollForm.notes || null,
        })
        .select()
        .single();

      if (enrollError) throw enrollError;

      // Se for caixa local, criar registro de pagamento para cada forma
      if (enrollForm.payment_status === 'paid') {
        let paymentErrors = [];
        
        for (let i = 0; i < enrollForm.paymentParts.length; i++) {
          const part = enrollForm.paymentParts[i];
          const partValue = parseFloat(part.value);

          try {
            // Map payment method to DB enum and create a unique asaas_payment_id for admin-created payments
            const billingType = part.method === 'CASH' ? 'UNDEFINED' : part.method;
            const asaasId = `admin_local_${enrollment.id}_${i + 1}`;

            const { data: paymentData, error: paymentError } = await supabase
              .from('payments')
              .insert({
                user_id: selectedProfile.id,
                turma_id: enrollForm.turma_id,
                enrollment_id: enrollment.id,
                value: partValue,
                status: 'CONFIRMED',
                billing_type: billingType,
                asaas_payment_id: asaasId,
                asaas_customer_id: selectedProfile.id,
                due_date: now.toISOString().split('T')[0],
                payment_date: now.toISOString(),
                confirmed_date: now.toISOString(),
                description: `Pagamento em Caixa Local (${part.method}) - ${turma?.name || 'Turma'}`,
                metadata: {
                  source: 'admin_cash_local',
                  admin_notes: enrollForm.notes || '',
                  payment_part: `${i + 1}/${enrollForm.paymentParts.length}`,
                },
              })
              .select()
              .single();

            if (paymentError) {
              paymentErrors.push({
                index: i + 1,
                method: part.method,
                error: paymentError.message
              });
            }
          } catch (err) {
            paymentErrors.push({
              index: i + 1,
              method: part.method,
              error: String(err)
            });
          }
        }
        
        // Exibir erros se houver
        if (paymentErrors.length > 0) {
          toast({ 
            title: '⚠️ Matrícula criada com avisos', 
            description: `${paymentErrors.length} pagamento(s) não foram registrados. Verifique o console.`,
            variant: 'destructive' 
          });
        }
      }

      toast({ 
        title: 'Sucesso', 
        description: enrollForm.payment_status === 'paid' 
          ? `Aluno matriculado! ${enrollForm.paymentParts.length} pagamento(s) registrado(s).`
          : 'Aluno matriculado com sucesso'
      });
      setOpenEnrollStudent(false);
      setEnrollForm({ 
        turma_id: '', 
        modality: 'presential', 
        payment_status: 'paid', 
        notes: '',
        paymentParts: [{ method: 'PIX', value: '' }],
      });
      await loadProfiles();
    } catch (error: any) {
      toast({ title: 'Erro ao matricular aluno', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEnrollment = async () => {
    if (!supabase || !selectedEnrollmentToDelete) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', selectedEnrollmentToDelete.id);

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Matrícula removida com sucesso' });
      setOpenDeleteEnrollment(false);
      setSelectedEnrollmentToDelete(null);
      await loadProfiles();
      // Update selected enrollments view
      if (selectedProfile) {
        setSelectedEnrollments(prev => prev.filter(e => e.id !== selectedEnrollmentToDelete.id));
      }
    } catch (error: any) {
      toast({ title: 'Erro ao remover matrícula', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Export functions
  const exportToCSV = () => {
    const dataToExport = filterTurma && filterTurma !== 'all'
      ? filteredProfiles
      : profiles;
    
    const turmaName = filterTurma && filterTurma !== 'all'
      ? turmas.find(t => t.id === filterTurma)?.name || 'turma'
      : 'todos';
    
    const headers = ['Nome', 'Email', 'WhatsApp', 'CPF', 'Cidade', 'Estado', 'Data Cadastro'];
    const rows = dataToExport.map(p => [
      p.full_name || '',
      p.email || '',
      p.whatsapp || '',
      p.cpf || '',
      p.city || '',
      p.state || '',
      formatDate(p.created_at),
    ]);
    
    const csvContent = [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `alunos_${turmaName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    const dataToExport = filterTurma && filterTurma !== 'all'
      ? filteredProfiles
      : profiles;
    
    const turmaInfo = filterTurma && filterTurma !== 'all'
      ? turmas.find(t => t.id === filterTurma)
      : null;
    
    const turmaName = turmaInfo?.name || 'Todos os Alunos';
    const courseName = turmaInfo?.course?.title || '';
    
    // Create printable HTML
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Lista de Alunos - ${turmaName}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
          h2 { color: #666; font-size: 14px; margin-bottom: 20px; }
          .info { margin-bottom: 20px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #6366f1; color: white; padding: 10px; text-align: left; font-size: 12px; }
          td { padding: 8px 10px; border-bottom: 1px solid #ddd; font-size: 11px; }
          tr:nth-child(even) { background: #f9f9f9; }
          .footer { margin-top: 30px; text-align: center; color: #999; font-size: 10px; }
          .total { margin-top: 20px; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Lista de Alunos</h1>
        ${turmaInfo ? `<h2>Turma: ${turmaName}${courseName ? ` - ${courseName}` : ''}</h2>` : ''}
        <div class="info">
          Gerado em: ${new Date().toLocaleString('pt-BR')}
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Nome</th>
              <th>Email</th>
              <th>WhatsApp</th>
              <th>CPF</th>
              <th>Cidade/UF</th>
            </tr>
          </thead>
          <tbody>
            ${dataToExport.map((p, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${p.full_name || '-'}</td>
                <td>${p.email || '-'}</td>
                <td>${p.whatsapp || '-'}</td>
                <td>${p.cpf || '-'}</td>
                <td>${p.city ? `${p.city}/${p.state}` : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">Total de Alunos: ${dataToExport.length}</div>
        <div class="footer">Evoluciva - Sistema de Gestão de Cursos</div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  // Open dialogs with data
  const openEdit = (profile: Profile) => {
    setSelectedProfile(profile);
    setProfileForm({
      full_name: profile.full_name || '',
      email: profile.email || '',
      password: '', // Não editável
      whatsapp: profile.whatsapp || '',
      cpf: profile.cpf || '',
      address: profile.address || '',
      number: profile.number || '',
      complement: profile.complement || '',
      state: profile.state || '',
      city: profile.city || '',
      cep: profile.cep || '',
    });
    setOpenEditStudent(true);
  };

  const openDelete = (profile: Profile) => {
    setSelectedProfile(profile);
    setOpenDeleteStudent(true);
  };

  const openEnroll = (profile: Profile) => {
    setSelectedProfile(profile);
    setEnrollForm({ 
      turma_id: '', 
      modality: 'presential', 
      payment_status: 'paid', 
      notes: '', 
      paymentParts: [{ method: 'PIX', value: '' }]
    });
    setOpenEnrollStudent(true);
  };

  const openEnrollmentsView = (profile: Profile) => {
    setSelectedProfile(profile);
    setSelectedEnrollments(getEnrollmentsForProfile(profile.id));
    setOpenViewEnrollments(true);
  };

  const openFinanceiroView = async (profile: Profile) => {
    setSelectedProfile(profile);
    setOpenFinanceiro(true);
    setLoadingPayments(true);

    try {
      // Load enrollments for this profile (to show local caixa breakdown)
      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select('id, profile_id, turma_id, enrolled_at, created_at, amount_paid_local_pix, amount_paid_local_cash, amount_paid_local_credit_card, amount_paid_local_debit, payment_method_local_pix, payment_method_local_cash, payment_method_local_credit_card, payment_method_local_debit, turma:turmas(name, course:courses(title))')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: false });

      setStudentEnrollments(enrollmentsData || []);

      // Buscar pagamentos do aluno
      const { data: paymentsData, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Buscar estornos para cada pagamento
      const paymentsWithRefunds = await Promise.all(
        (paymentsData || []).map(async (payment) => {
          const { data: refunds } = await supabase
            .from('refunds')
            .select('id, refund_value, status, reason, description, created_at')
            .eq('payment_id', payment.id)
            .order('created_at', { ascending: false });

          const total_refunded = refunds?.filter(r => ['COMPLETED', 'PROCESSING', 'APPROVED'].includes(r.status))
            .reduce((sum, r) => sum + Number(r.refund_value), 0) || 0;

          const { data: turma } = payment.turma_id
            ? await supabase
                .from('turmas')
                .select('name, course:courses(title)')
                .eq('id', payment.turma_id)
                .single()
            : { data: null };

          return {
            ...payment,
            refunds: refunds || [],
            total_refunded,
            turma,
          };
        })
      );

      setStudentPayments(paymentsWithRefunds);
    } catch (error: any) {
      console.error('Erro ao carregar pagamentos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os pagamentos',
        variant: 'destructive',
      });
    } finally {
      setLoadingPayments(false);
    }
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
      // If this is a synthetic/local payment (id like 'local_<enrollmentId>' or source === 'local'),
      // resolve to the actual payment row(s) created in `payments` (asaas_payment_id like 'admin_local_%').
      let paymentToUse: any = selectedPayment;
      const idStr = String(selectedPayment.id || '');
      if (idStr.startsWith('local_') || (selectedPayment.source && selectedPayment.source === 'local')) {
        const enrollmentId = selectedPayment.enrollment_id || idStr.replace(/^local_/, '');
        const { data: realPayments, error: realErr } = await supabase
          .from('payments')
          .select('*')
          .eq('enrollment_id', enrollmentId)
          .ilike('asaas_payment_id', 'admin_local_%')
          .order('created_at', { ascending: false })
          .limit(1);

        if (realErr) throw realErr;
        if (!realPayments || realPayments.length === 0) {
          toast({ title: 'Erro', description: 'Nenhum pagamento registrado para esta matrícula. Registre-os antes de solicitar estorno.', variant: 'destructive' });
          setProcessingRefund(false);
          return;
        }
        paymentToUse = realPayments[0];
        setSelectedPayment(paymentToUse);
        setRefundValue(String(paymentToUse.value));
      }

      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('refunds').insert({
        payment_id: paymentToUse.id,
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
      
      // Recarregar pagamentos
      if (selectedProfile) {
        openFinanceiroView(selectedProfile);
      }
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      CONFIRMED: { label: 'Confirmado', className: 'bg-green-500' },
      RECEIVED: { label: 'Recebido', className: 'bg-green-500' },
      RECEIVED_IN_CASH: { label: 'Recebido em Dinheiro', className: 'bg-green-600' },
      PENDING: { label: 'Pendente', className: 'bg-yellow-500' },
      OVERDUE: { label: 'Vencido', className: 'bg-red-500' },
      REFUNDED: { label: 'Reembolsado', className: 'bg-gray-500' },
    };
    const config = variants[status] || { label: status, className: 'bg-gray-400' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // Registrar pagamentos do enrollment (caixa local) na tabela payments
  const registerEnrollmentPayments = async (enrollmentId: string) => {
    if (!supabase) throw new Error('Supabase não inicializado');
    setLoading(true);
    try {
      const { data: e, error: eErr } = await supabase
        .from('enrollments')
        .select('id, profile_id, turma_id, amount_paid_local_pix, amount_paid_local_cash, amount_paid_local_credit_card, amount_paid_local_debit')
        .eq('id', enrollmentId)
        .single();

      if (eErr) throw eErr;

      const parts: Array<{ method: string; value: number }> = [];
      if (Number(e.amount_paid_local_pix || 0) > 0) parts.push({ method: 'PIX', value: Number(e.amount_paid_local_pix) });
      if (Number(e.amount_paid_local_cash || 0) > 0) parts.push({ method: 'CASH', value: Number(e.amount_paid_local_cash) });
      if (Number(e.amount_paid_local_credit_card || 0) > 0) parts.push({ method: 'CREDIT_CARD', value: Number(e.amount_paid_local_credit_card) });
      if (Number(e.amount_paid_local_debit || 0) > 0) parts.push({ method: 'DEBIT_CARD', value: Number(e.amount_paid_local_debit) });

      if (parts.length === 0) return;

      const now = new Date();
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
          due_date: now.toISOString().split('T')[0],
          payment_date: now.toISOString(),
          confirmed_date: now.toISOString(),
          description: `Pagamento Caixa Local (${part.method}) - matrícula ${e.id}`,
          metadata: { source: 'admin_cash_local', payment_part: `${i + 1}/${parts.length}` },
        });
      }

      const { error: insertErr } = await supabase.from('payments').insert(inserts);
      if (insertErr) throw insertErr;
    } finally {
      setLoading(false);
    }
  };

  // Abrir diálogo de estorno para pagamentos gerados a partir de uma matrícula (se existirem)
  const openRefundForEnrollment = async (enrollmentId: string) => {
    try {
      setLoadingPayments(true);
      const { data: paymentsData, error } = await supabase
        .from('payments')
        .select('*')
        .eq('enrollment_id', enrollmentId)
        .ilike('asaas_payment_id', 'admin_local_%')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (paymentsData && paymentsData.length > 0) {
        const p = paymentsData[0];
        setSelectedPayment(p as any);
        setRefundValue(String(p.value));
        setShowRefundDialog(true);
      } else {
        toast({ title: 'Nenhum pagamento', description: 'Registre os pagamentos do caixa local antes de solicitar estorno.', variant: 'destructive' });
      }
    } catch (err: any) {
      console.error('Erro ao buscar pagamentos da matrícula:', err);
      toast({ title: 'Erro', description: err?.message || 'Falha ao buscar pagamentos', variant: 'destructive' });
    } finally {
      setLoadingPayments(false);
    }
  };

  // Render form fields inline to avoid re-creating component on state change
  const renderStudentFormFields = (isEdit: boolean) => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Nome completo *</Label>
          <Input
            id="full_name"
            value={profileForm.full_name}
            onChange={(e) => setProfileForm(prev => ({ ...prev, full_name: e.target.value }))}
            placeholder="Nome do aluno"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={profileForm.email}
            onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
            placeholder="email@exemplo.com"
          />
        </div>
      </div>

      {!isEdit && (
        <div className="space-y-2">
          <Label htmlFor="password">Senha temporária *</Label>
          <Input
            id="password"
            type="text"
            value={profileForm.password}
            onChange={(e) => setProfileForm(prev => ({ ...prev, password: e.target.value }))}
            placeholder="Senha inicial do aluno"
          />
          <p className="text-xs text-muted-foreground">O aluno poderá alterar a senha após o primeiro login</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            value={profileForm.whatsapp}
            onChange={(e) => setProfileForm(prev => ({ ...prev, whatsapp: formatPhone(e.target.value) }))}
            placeholder="(00) 00000-0000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            value={profileForm.cpf}
            onChange={(e) => setProfileForm(prev => ({ ...prev, cpf: formatCPF(e.target.value) }))}
            placeholder="000.000.000-00"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          value={profileForm.address}
          onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
          placeholder="Rua, Avenida..."
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="number">Número</Label>
          <Input
            id="number"
            value={profileForm.number}
            onChange={(e) => setProfileForm(prev => ({ ...prev, number: e.target.value }))}
            placeholder="123"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            value={profileForm.complement}
            onChange={(e) => setProfileForm(prev => ({ ...prev, complement: e.target.value }))}
            placeholder="Apt, Sala..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={profileForm.city}
            onChange={(e) => setProfileForm(prev => ({ ...prev, city: e.target.value }))}
            placeholder="Cidade"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            value={profileForm.state}
            onChange={(e) => setProfileForm(prev => ({ ...prev, state: e.target.value.toUpperCase().slice(0, 2) }))}
            placeholder="UF"
            maxLength={2}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cep">CEP</Label>
        <Input
          id="cep"
          value={profileForm.cep}
          onChange={(e) => setProfileForm(prev => ({ ...prev, cep: formatCEP(e.target.value) }))}
          placeholder="00000-000"
          className="w-40"
        />
      </div>
    </>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Alunos</h1>
            <p className="text-muted-foreground">Gerencie os alunos e matrículas</p>
          </div>
          {/* debug UI removed */}
          <Dialog
            open={openAddStudent}
            onOpenChange={(open) => {
              setOpenAddStudent(open);
              if (open) setProfileForm(initialProfileForm);
            }}
          >
            <DialogTrigger asChild>
              <Button className="gradient-bg mt-3 sm:mt-0">
                <Plus className="w-4 h-4 mr-2" />
                Novo Aluno
              </Button>
            </DialogTrigger>
            <DialogContent className="w-full max-w-full sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Aluno</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 pb-6">
                {renderStudentFormFields(false)}
              </div>
              <DialogFooter className="pt-4 flex flex-col-reverse sm:flex-row gap-3">
                <Button variant="outline" onClick={() => setOpenAddStudent(false)} className="w-full sm:w-auto">Cancelar</Button>
                <Button onClick={handleAddStudent} disabled={loading} className="w-full sm:w-auto">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Cadastrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Alunos</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{profiles.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Matrículas</CardTitle>
              <GraduationCap className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{enrollments.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Turmas Ativas</CardTitle>
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{turmas.filter(t => t.status === 'active').length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email, telefone ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={filterTurma} onValueChange={setFilterTurma}>
              <SelectTrigger className="w-full md:w-[250px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrar por turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as turmas</SelectItem>
                {turmas.map((turma) => (
                  <SelectItem key={turma.id} value={turma.id}>
                    {turma.name} ({studentsCountByTurma[turma.id] || 0} alunos)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportToCSV} className="whitespace-nowrap">
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" onClick={exportToPDF} className="whitespace-nowrap">
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>

        {/* Filter info */}
        {filterTurma && filterTurma !== 'all' && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="secondary">
              {turmas.find(t => t.id === filterTurma)?.name}
            </Badge>
            <div>
              <div>{filteredProfiles.length} aluno(s) encontrado(s)</div>
              {selectedTurmaCounts && (
                <div className="text-xs text-muted-foreground">
                  Presencial: {selectedTurmaCounts.presencial} • Online: {selectedTurmaCounts.online} • Total: {selectedTurmaCounts.total}
                </div>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setFilterTurma('all')}>
              <X className="w-3 h-3 mr-1" />
              Limpar filtro
            </Button>
          </div>
        )}


        {/* Mobile: Students Cards (hidden on md+) */}
        <div className="md:hidden space-y-3">
          {filteredProfiles.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">{searchTerm || filterTurma !== 'all' ? 'Nenhum aluno encontrado com os filtros aplicados' : 'Nenhum aluno cadastrado'}</div>
          ) : (
            filteredProfiles.map((profile) => {
              const profileEnrollments = getEnrollmentsForProfile(profile.id);
              return (
                <div key={profile.id} className="bg-card p-4 rounded-lg border">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{profile.full_name || '-'}</div>
                      <div className="text-sm text-muted-foreground truncate flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{profile.email}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openFinanceiroView(profile)} title="Financeiro">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEnroll(profile)} title="Matricular">
                        <UserPlus className="w-4 h-4 text-green-600" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3" />
                      <span>{profile.whatsapp || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>CPF:</span>
                      <span>{profile.cpf ? formatCPF(profile.cpf) : '-'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-3 h-3" />
                      <span>{profileEnrollments.length} turma(s)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(profile.created_at)}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button className="flex-1" size="sm" onClick={() => openEdit(profile)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button className="flex-1" size="sm" variant="destructive" onClick={() => openDelete(profile)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Students Table (hidden on small screens) */}
        <div className="hidden md:block border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Matrículas</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProfiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm || filterTurma !== 'all' 
                      ? 'Nenhum aluno encontrado com os filtros aplicados' 
                      : 'Nenhum aluno cadastrado'
                    }
                  </TableCell>
                </TableRow>
              ) : (
                filteredProfiles.map((profile) => {
                  const profileEnrollments = getEnrollmentsForProfile(profile.id);
                  return (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{profile.full_name || '-'}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {profile.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {profile.whatsapp ? (
                          <div className="flex items-center gap-2 text-sm">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              <span>{profile.whatsapp}</span>
                            </div>
                            {getWhatsAppHref(profile.whatsapp) && (
                              <a
                                href={getWhatsAppHref(profile.whatsapp)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={`Abrir WhatsApp de ${profile.full_name}`}
                                className="text-green-600 hover:text-green-700"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{profile.cpf ? formatCPF(profile.cpf) : '-'}</span>
                      </TableCell>
                      <TableCell>
                        {profileEnrollments.length > 0 ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEnrollmentsView(profile)}
                            className="text-primary"
                          >
                            <GraduationCap className="w-4 h-4 mr-1" />
                            {profileEnrollments.length} turma(s)
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sem matrícula</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{formatDate(profile.created_at)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openFinanceiroView(profile)}
                            title="Financeiro"
                          >
                            <DollarSign className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEnroll(profile)}
                            title="Matricular"
                          >
                            <UserPlus className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(profile)}
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDelete(profile)}
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit Student Dialog */}
        <Dialog open={openEditStudent} onOpenChange={setOpenEditStudent}>
          <DialogContent className="w-full max-w-full sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Aluno</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 pb-6">
              {renderStudentFormFields(true)}
            </div>
            <DialogFooter className="pt-4 flex flex-col-reverse sm:flex-row gap-3">
              <Button variant="outline" onClick={() => setOpenEditStudent(false)} className="w-full sm:w-auto">Cancelar</Button>
              <Button onClick={handleEditStudent} disabled={loading} className="w-full sm:w-auto">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Pencil className="w-4 h-4 mr-2" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Student Dialog */}
        <Dialog open={openDeleteStudent} onOpenChange={setOpenDeleteStudent}>
          <DialogContent className="w-full max-w-full sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Excluir Aluno</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o aluno <strong>{selectedProfile?.full_name}</strong>?
                Esta ação não pode ser desfeita e todas as matrículas serão removidas.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDeleteStudent(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handleDeleteStudent} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Enroll Student Dialog */}
        <Dialog open={openEnrollStudent} onOpenChange={setOpenEnrollStudent}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Matricular Aluno</DialogTitle>
              <DialogDescription>
                Matricular <strong>{selectedProfile?.full_name}</strong> em uma turma
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Turma *</Label>
                <Select value={enrollForm.turma_id} onValueChange={(v) => setEnrollForm({ ...enrollForm, turma_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {turmas.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.name} {turma.course?.title ? `- ${turma.course.title}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Modalidade</Label>
                <Select value={enrollForm.modality} onValueChange={(v) => setEnrollForm({ ...enrollForm, modality: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presential">Presencial</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status do Pagamento</Label>
                <Select value={enrollForm.payment_status} onValueChange={(v) => setEnrollForm({ ...enrollForm, payment_status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Caixa Local</SelectItem>
                    <SelectItem value="free">Gratuito (cortesia)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {enrollForm.payment_status === 'paid' && (
                <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Formas de Pagamento</Label>
                    <Button 
                      type="button"
                      size="sm" 
                      variant="outline"
                      onClick={addPaymentPart}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Adicionar
                    </Button>
                  </div>

                  {enrollForm.paymentParts.map((part, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-2">
                        <Label className="text-sm">Forma {index + 1}</Label>
                        <Select 
                          value={part.method} 
                          onValueChange={(v) => updatePaymentPart(index, 'method', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PIX">PIX</SelectItem>
                            <SelectItem value="CASH">Dinheiro</SelectItem>
                            <SelectItem value="DEBIT_CARD">Cartão de Débito</SelectItem>
                            <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex-1 space-y-2">
                        <Label className="text-sm">Valor (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={part.value}
                          onChange={(e) => updatePaymentPart(index, 'value', e.target.value)}
                          placeholder="0,00"
                        />
                      </div>

                      {enrollForm.paymentParts.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="mt-7"
                          onClick={() => removePaymentPart(index)}
                        >
                          <Minus className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}

                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold">Total:</span>
                      <span className="text-lg font-bold text-primary">
                        R$ {getTotalPaymentValue().toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={enrollForm.notes}
                  onChange={(e) => setEnrollForm({ ...enrollForm, notes: e.target.value })}
                  placeholder="Notas internas sobre esta matrícula..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenEnrollStudent(false)}>Cancelar</Button>
              <Button onClick={handleEnrollStudent} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Matricular
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Enrollments Dialog */}
        <Dialog open={openViewEnrollments} onOpenChange={setOpenViewEnrollments}>
          <DialogContent className="w-full max-w-full sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Matrículas de {selectedProfile?.full_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {selectedEnrollments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nenhuma matrícula encontrada</p>
              ) : (
                selectedEnrollments.map((enrollment) => (
                  <div key={enrollment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{enrollment.turma?.name || 'Turma não encontrada'}</div>
                      <div className="text-sm text-muted-foreground">
                        {enrollment.turma?.course?.title || ''}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">
                          {enrollment.modality === 'online' ? 'Online' : 'Presencial'}
                        </Badge>
                        <Badge variant={
                          enrollment.payment_status === 'paid' ? 'default' :
                          enrollment.payment_status === 'free' ? 'secondary' :
                          'destructive'
                        }>
                          {enrollment.payment_status === 'paid' ? 'Pago' :
                           enrollment.payment_status === 'free' ? 'Gratuito' :
                           enrollment.payment_status === 'pending' ? 'Pendente' :
                           enrollment.payment_status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Matriculado em: {formatDate(enrollment.enrolled_at)}
                        {enrollment.access_expires_at && ` | Acesso até: ${formatDate(enrollment.access_expires_at)}`}
                      </div>
                      {enrollment.notes && (
                        <div className="text-xs text-muted-foreground mt-1 italic">
                          Obs: {enrollment.notes}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedEnrollmentToDelete(enrollment);
                        setOpenDeleteEnrollment(true);
                      }}
                      title="Remover matrícula"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenViewEnrollments(false)}>Fechar</Button>
              <Button onClick={() => { setOpenViewEnrollments(false); openEnroll(selectedProfile!); }}>
                <UserPlus className="w-4 h-4 mr-2" />
                Nova Matrícula
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Enrollment Confirmation Dialog */}
        <Dialog open={openDeleteEnrollment} onOpenChange={setOpenDeleteEnrollment}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remover Matrícula</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja remover a matrícula de <strong>{selectedProfile?.full_name}</strong> da turma{' '}
                <strong>{selectedEnrollmentToDelete?.turma?.name}</strong>?
                {selectedEnrollmentToDelete?.turma?.course?.title && (
                  <span> ({selectedEnrollmentToDelete.turma.course.title})</span>
                )}
                <br />
                <br />
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setOpenDeleteEnrollment(false);
                  setSelectedEnrollmentToDelete(null);
                }}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteEnrollment} 
                disabled={loading}
              >
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Remover Matrícula
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Financeiro Dialog */}
        <Dialog open={openFinanceiro} onOpenChange={setOpenFinanceiro}>
          <DialogContent className="w-full max-w-full sm:max-w-3xl md:max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Financeiro - {selectedProfile?.full_name}</DialogTitle>
              <p className="text-sm text-muted-foreground">{selectedProfile?.email}</p>
            </DialogHeader>
            
            {loadingPayments ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (studentPayments.length === 0 && (studentEnrollments?.length || 0) === 0) ? (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Nenhum pagamento encontrado</p>
                <p className="text-sm">Este aluno ainda não realizou pagamentos nem possui registros de caixa local</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">Pago Checkout</div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(studentPayments.reduce((sum, p) => 
                          ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'].includes(p.status) 
                            ? sum + Number(p.value) - (p.total_refunded || 0)
                            : sum, 0))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">Total Estornado</div>
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(studentPayments.reduce((sum, p) => sum + (p.total_refunded || 0), 0))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-sm text-muted-foreground">Pagamentos</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {studentPayments.length}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Caixa Local summary (from enrollments local fields) */}
                {studentEnrollments && studentEnrollments.length > 0 && (
                  <div className="space-y-3">
                    <Card>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">Pago: Caixa Local</div>
                        {/* Totals per local payment type */}
                        {(() => {
                          const totals = studentEnrollments.reduce((acc, e) => {
                            acc.pix += Number(e['amount_paid_local_pix'] || 0);
                            acc.cash += Number(e['amount_paid_local_cash'] || 0);
                            acc.credit += Number(e['amount_paid_local_credit_card'] || 0);
                            acc.debit += Number(e['amount_paid_local_debit'] || 0);
                            return acc;
                          }, { pix: 0, cash: 0, credit: 0, debit: 0 });

                          const localTotal = totals.pix + totals.cash + totals.credit + totals.debit;

                          return (
                            <div className="mt-2">
                              <div className="text-2xl font-bold text-green-600">{formatCurrency(localTotal)}</div>
                              <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                <div>PIX: <span className="font-medium text-foreground">{formatCurrency(totals.pix)}</span></div>
                                <div>Dinheiro: <span className="font-medium text-foreground">{formatCurrency(totals.cash)}</span></div>
                                <div>Cartão Crédito: <span className="font-medium text-foreground">{formatCurrency(totals.credit)}</span></div>
                                <div>Débito: <span className="font-medium text-foreground">{formatCurrency(totals.debit)}</span></div>
                              </div>
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>


                  </div>
                )}
                {
                  // Build synthetic local payment rows from enrollments
                  (() => {
                    const synthetic = (studentEnrollments || []).map((e: any) => {
                      const pix = Number(e.amount_paid_local_pix || 0);
                      const cash = Number(e.amount_paid_local_cash || 0);
                      const credit = Number(e.amount_paid_local_credit_card || 0);
                      const debit = Number(e.amount_paid_local_debit || 0);
                      const total = pix + cash + credit + debit;
                      if (total === 0) return null;
                      return {
                        id: `local_${e.id}`,
                        created_at: e.enrolled_at || e.created_at || new Date().toISOString(),
                        turma: e.turma || null,
                        billing_type: 'LOCAL',
                        status: 'CAIXA_LOCAL',
                        value: total,
                        total_refunded: 0,
                        isLocal: true,
                        breakdown: { pix, cash, credit, debit },
                        enrollment_id: e.id,
                      };
                    }).filter(Boolean);

                    const combined = [ ...(studentPayments || []), ...synthetic ]
                      .slice()
                      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                    return (
                      <div className="overflow-x-auto">
                        <Table className="min-w-full">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead>Curso/Turma</TableHead>
                              <TableHead>Método</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {combined.map((row: any) => (
                              <TableRow key={row.id}>
                                <TableCell className="text-sm">
                                  {new Date(row.created_at).toLocaleDateString('pt-BR')}
                                </TableCell>

                                <TableCell>
                                  <div className="max-w-[200px]">
                                    <div className="font-medium truncate text-sm">
                                      {row.turma?.course?.title || (row.isLocal ? 'Matrícula' : 'N/A')}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate">
                                      {row.turma?.name || row.description || '-'}
                                    </div>
                                  </div>
                                </TableCell>

                                <TableCell className="text-sm">
                                  {row.isLocal ? (
                                    <div className="text-xs text-muted-foreground">
                                      {row.breakdown.pix > 0 && <div>PIX: {formatCurrency(row.breakdown.pix)}</div>}
                                      {row.breakdown.cash > 0 && <div>Dinheiro: {formatCurrency(row.breakdown.cash)}</div>}
                                      {row.breakdown.credit > 0 && <div>Crédito: {formatCurrency(row.breakdown.credit)}</div>}
                                      {row.breakdown.debit > 0 && <div>Débito: {formatCurrency(row.breakdown.debit)}</div>}
                                    </div>
                                  ) : (
                                    getPaymentTypeName(row.billing_type)
                                  )}
                                </TableCell>

                                <TableCell>
                                  {row.isLocal ? <Badge>Caixa Local</Badge> : getStatusBadge(row.status)}
                                </TableCell>

                                <TableCell className="text-right font-bold">
                                  {row.total_refunded && row.total_refunded > 0 ? (
                                    <div>
                                      <div className="text-muted-foreground line-through text-xs">
                                        {formatCurrency(Number(row.value))}
                                      </div>
                                      <div className="text-green-600">
                                        {formatCurrency(Number(row.value) - row.total_refunded)}
                                      </div>
                                      <div className="text-xs text-orange-600">
                                        -{formatCurrency(row.total_refunded)}
                                      </div>
                                    </div>
                                  ) : (
                                    formatCurrency(Number(row.value))
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    );
                  })()
                }

              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenFinanceiro(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Refund Dialog */}
        <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
          <DialogContent className="w-full max-w-full sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Solicitar Estorno</DialogTitle>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Pagamento</p>
                  <p className="font-medium">{selectedProfile?.full_name}</p>
                  <p className="text-sm">{selectedPayment.turma?.name || selectedPayment.description}</p>
                  <p className="text-lg font-bold text-green-600 mt-2">
                    Valor: {formatCurrency(Number(selectedPayment.value))}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refund-value">Valor do Estorno (R$)</Label>
                  <Input
                    id="refund-value"
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
                  <Label htmlFor="refund-reason">Motivo do Estorno *</Label>
                  <Input
                    id="refund-reason"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Ex: Solicitação do cliente, erro no pagamento..."
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refund-description">Descrição Detalhada (opcional)</Label>
                  <Textarea
                    id="refund-description"
                    value={refundDescription}
                    onChange={(e) => setRefundDescription(e.target.value)}
                    placeholder="Informações adicionais sobre o estorno..."
                    maxLength={500}
                    rows={3}
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
      </div>
    </AdminLayout>
  );
}

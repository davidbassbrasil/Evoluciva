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
  Mail, Phone, MapPin, Calendar, CreditCard, X, MessageCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

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
  
  // Selected items
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedEnrollments, setSelectedEnrollments] = useState<Enrollment[]>([]);
  
  // Forms
  const [profileForm, setProfileForm] = useState<ProfileForm>(initialProfileForm);
  const [enrollForm, setEnrollForm] = useState({
    turma_id: '',
    modality: 'presential',
    payment_status: 'paid',
    notes: '',
  });
  
  const { toast } = useToast();

  // Load data
  useEffect(() => {
    loadProfiles();
    loadTurmas();
    loadEnrollments();
  }, []);

  const loadProfiles = async () => {
    if (!supabase) return;
    try {
      // Debug: check current supabase auth user
      try {
        const authRes = await supabase.auth.getUser();
        console.log('supabase.auth.getUser():', authRes);
        const uid = (authRes && authRes.data && authRes.data.user && authRes.data.user.id) || null;
        setAuthUserId(uid);
      } catch (e) {
        console.warn('Could not call supabase.auth.getUser():', e);
        setAuthUserId(null);
      }
      // Buscar todos os profiles que não são admin (role != 'admin' OU role é null)
      const { data, error, count } = await supabase
        .from('profiles')
        .select(
          `id, full_name, email, whatsapp, cpf, address, number, complement, state, city, cep, role, created_at, updated_at`,
          { count: 'exact' }
        )
        .order('full_name');
      
      if (error) {
        console.error('Erro na query profiles:', error);
        setProfilesError(error.message || String(error));
        setRawProfiles([]);
        setProfiles([]);
        return;
      }
      console.log('Profiles carregados (count):', count, data);
      setProfilesError(null);
      setRawProfiles(data || []);
      // Filtrar para mostrar apenas alunos (role student)
      const students = (data || []).filter((p: Profile) => p.role === 'student');
      console.log('Profiles alunos:', students);
      setProfiles(students);
      // If we are admin but we only got ourself back (RLS might be blocking), show message in UI
      // We keep rawProfiles separately; UI will render a helpful message in that case.
    } catch (error: any) {
      console.error('Erro ao carregar profiles:', error);
      toast({ title: 'Erro ao carregar alunos', description: error.message, variant: 'destructive' });
    }
  };

  const loadTurmas = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('turmas')
        .select(`
          id, name, course_id, status,
          course:courses (id, title, image)
        `)
        .order('name');
      
      if (error) throw error;
      // Supabase returns course as array when using select, we need first element
      const mapped = (data || []).map((t: any) => ({
        ...t,
        course: Array.isArray(t.course) ? t.course[0] : t.course
      })) as Turma[];
      setTurmas(mapped);
    } catch (error: any) {
      toast({ title: 'Erro ao carregar turmas', description: error.message, variant: 'destructive' });
    }
  };

  const loadEnrollments = async () => {
    if (!supabase) return;
    try {
      // Avoid embedding `profiles` (there are multiple FKs to profiles: profile_id and created_by)
      // which causes PostgREST error PGRST201. We'll fetch turma embedded and keep profile_id
      // and resolve profile data on the client using `profiles` state.
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          turma:turmas (
            id, name, course_id, status,
            course:courses (id, title, image)
          )
        `)
        .order('enrolled_at', { ascending: false });
      
      if (error) throw error;
      setEnrollments(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar matrículas:', error);
    }
  };

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
      // Check if email already exists in profiles
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', profileForm.email)
        .single();
      
      if (existing) {
        toast({ title: 'Erro', description: 'Email já cadastrado', variant: 'destructive' });
        setLoading(false);
        return;
      }

      // NOTE: using `supabase.auth.signUp()` here would switch the client session
      // to the newly created user (so the admin would be signed out). Instead
      // insert a `profiles` row directly and keep the admin session intact.
      // Creating an Auth user should be done server-side with a service role key
      // or via the Supabase dashboard.
      const newId = (typeof crypto !== 'undefined' && (crypto as any).randomUUID)
        ? (crypto as any).randomUUID()
        : Math.random().toString(36).slice(2, 10);

      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: newId,
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
          role: 'student',
          created_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      toast({ title: 'Sucesso', description: 'Aluno cadastrado com sucesso. Um email de confirmação foi enviado.' });
      setOpenAddStudent(false);
      setProfileForm(initialProfileForm);
      loadProfiles();
    } catch (error: any) {
      toast({ title: 'Erro ao cadastrar aluno', description: error.message, variant: 'destructive' });
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
      loadProfiles();
      loadEnrollments();
    } catch (error: any) {
      toast({ title: 'Erro ao excluir aluno', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollStudent = async () => {
    if (!supabase || !selectedProfile) return;
    if (!enrollForm.turma_id) {
      toast({ title: 'Erro', description: 'Selecione uma turma', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
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

      // Get turma to copy access_end_date
      const { data: turma } = await supabase
        .from('turmas')
        .select('access_end_date')
        .eq('id', enrollForm.turma_id)
        .single();

      const { error } = await supabase
        .from('enrollments')
        .insert({
          profile_id: selectedProfile.id,
          turma_id: enrollForm.turma_id,
          modality: enrollForm.modality,
          payment_status: enrollForm.payment_status,
          payment_method: enrollForm.payment_status === 'free' ? 'free' : 'admin',
          amount_paid: 0,
          enrolled_at: new Date().toISOString(),
          paid_at: enrollForm.payment_status === 'paid' || enrollForm.payment_status === 'free' ? new Date().toISOString() : null,
          access_expires_at: turma?.access_end_date || null,
          notes: enrollForm.notes || null,
        });

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Aluno matriculado com sucesso' });
      setOpenEnrollStudent(false);
      setEnrollForm({ turma_id: '', modality: 'presential', payment_status: 'paid', notes: '' });
      loadEnrollments();
    } catch (error: any) {
      toast({ title: 'Erro ao matricular aluno', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEnrollment = async (enrollmentId: string) => {
    if (!supabase) return;
    
    try {
      const { error } = await supabase
        .from('enrollments')
        .delete()
        .eq('id', enrollmentId);

      if (error) throw error;

      toast({ title: 'Sucesso', description: 'Matrícula removida' });
      loadEnrollments();
      // Update selected enrollments view
      if (selectedProfile) {
        setSelectedEnrollments(prev => prev.filter(e => e.id !== enrollmentId));
      }
    } catch (error: any) {
      toast({ title: 'Erro ao remover matrícula', description: error.message, variant: 'destructive' });
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
    setEnrollForm({ turma_id: '', modality: 'presential', payment_status: 'paid', notes: '' });
    setOpenEnrollStudent(true);
  };

  const openEnrollmentsView = (profile: Profile) => {
    setSelectedProfile(profile);
    setSelectedEnrollments(getEnrollmentsForProfile(profile.id));
    setOpenViewEnrollments(true);
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
              <Button className="gradient-bg">
                <Plus className="w-4 h-4 mr-2" />
                Novo Aluno
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Aluno</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                {renderStudentFormFields(false)}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpenAddStudent(false)}>Cancelar</Button>
                <Button onClick={handleAddStudent} disabled={loading}>
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
          <div className="flex gap-2">
            <Select value={filterTurma} onValueChange={setFilterTurma}>
              <SelectTrigger className="w-[250px]">
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
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" onClick={exportToPDF}>
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


        {/* Students Table */}
        <div className="border rounded-lg overflow-hidden">
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
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="w-3 h-3" />
                            {profile.email || '-'}
                          </div>
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Aluno</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {renderStudentFormFields(true)}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenEditStudent(false)}>Cancelar</Button>
              <Button onClick={handleEditStudent} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Pencil className="w-4 h-4 mr-2" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Student Dialog */}
        <Dialog open={openDeleteStudent} onOpenChange={setOpenDeleteStudent}>
          <DialogContent>
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
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="free">Gratuito (cortesia)</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
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
          <DialogContent className="max-w-2xl">
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
                      onClick={() => handleDeleteEnrollment(enrollment.id)}
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
      </div>
    </AdminLayout>
  );
}

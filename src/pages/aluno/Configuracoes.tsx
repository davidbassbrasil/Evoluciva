import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, User, Mail, Lock, Eye, EyeOff, ChevronLeft, Save, Globe, MessageCircle, UserCircle, Key, Phone, Hash, MapPin, Home, Receipt, Calendar, CreditCard, DollarSign, Package, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser, updateUser, getPreviewStudentId, clearPreviewStudentId } from '@/lib/localStorage';
import { exitPreviewAndCloseWindow } from '@/lib/previewUtils';
import { User as UserType } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import { useStudentModules, confirmModuleReceipt } from '@/lib/moduleService';

const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function AlunoConfiguracoes() {
  const [user, setUser] = useState<UserType | null>(null);
  const previewId = getPreviewStudentId();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('site');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    cpf: '',
    endereco: '',
    numero: '',
    complemento: '',
    estado: '',
    cidade: '',
    cep: '',
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { modules, loading: loadingModules, refetch: refetchModules } = useStudentModules(previewId);

  useEffect(() => {
    const loadUserData = async () => {
      const previewId = getPreviewStudentId();
      const currentUser = getCurrentUser();
      if (!currentUser && !previewId) {
        navigate('/aluno/login');
        return;
      }

      // If there's a preview active, we still keep admin session in localStorage
      if (currentUser) setUser(currentUser);

      const idToFetch = previewId || currentUser?.id;

      // Try to fetch complete profile from Supabase
      if (supabase && idToFetch) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', idToFetch)
            .single();

          if (profile) {
            setProfileData({
              name: profile.full_name || currentUser?.name || '',
              email: profile.email || currentUser?.email || '',
              whatsapp: profile.whatsapp || '',
              cpf: profile.cpf || '',
              endereco: profile.address || '',
              numero: profile.number || '',
              complemento: profile.complement || '',
              estado: profile.state || '',
              cidade: profile.city || '',
              cep: profile.cep || '',
            });
            return;
          }
        } catch (e) {
          console.error('Error loading profile:', e);
        }
      }

      // Fallback to localStorage data (admin user)
      setProfileData({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        whatsapp: '',
        cpf: '',
        endereco: '',
        numero: '',
        complemento: '',
        estado: '',
        cidade: '',
        cep: '',
      });
    };

    loadUserData();
  }, [navigate]);

  useEffect(() => {
    const previewId = getPreviewStudentId();

    if (activeTab === 'modulos') {
      refetchModules();
    }

    if (activeTab === 'financeiro') {
      const idToFetch = previewId || user?.id;
      if (idToFetch) loadPayments();
    }
  }, [activeTab, user?.id, refetchModules]);

  const loadPayments = async () => {
    const previewId = getPreviewStudentId();
    const idToFetch = previewId || user?.id;
    if (!idToFetch) return;
    
    setLoadingPayments(true);
    try {
      // Buscar enrollments (matrículas) do usuário que estão pagas com informações da turma
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          *,
          turma:turma_id (
            id,
            name,
            price,
            access_end_date,
            course:course_id (
              title
            )
          )
        `)
        .eq('profile_id', idToFetch)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false });

      if (enrollmentsError) {
        console.error('Erro ao buscar enrollments:', enrollmentsError);
        throw enrollmentsError;
      }

      // Buscar informações dos pagamentos (quando existir payment_id)
      const paymentIds = enrollmentsData?.map(e => e.payment_id).filter(Boolean) || [];
      let paymentsMap: Record<string, any> = {};
      
      if (paymentIds.length > 0) {
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('*')
          .in('id', paymentIds)
          .in('status', ['CONFIRMED', 'RECEIVED', 'REFUNDED']);
        
        if (paymentsData) {
          paymentsMap = paymentsData.reduce((acc, payment) => {
            acc[payment.id] = payment;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Combinar enrollments com informações dos pagamentos
      const enrichedEnrollments = enrollmentsData?.map(enrollment => {
        const payment = enrollment.payment_id ? paymentsMap[enrollment.payment_id] : null;
        
        return {
          id: enrollment.id,
          created_at: enrollment.created_at,
          paid_at: enrollment.paid_at,
          amount_paid: enrollment.amount_paid,
          payment_method: enrollment.payment_method,
          payment_status: enrollment.payment_status,
          modality: enrollment.modality,
          turma: enrollment.turma, // Já vem com os dados da relação
          payment: payment,
          // Se não tiver payment, pode ser cortesia ou caixa local
          is_courtesy: enrollment.amount_paid === 0 || enrollment.amount_paid === null,
        };
      }) || [];

      setPayments(enrichedEnrollments);
    } catch (error) {
      console.error('Erro ao carregar pagamentos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o histórico de pagamentos.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPayments(false);
    }
  };

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

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const previewId = getPreviewStudentId();
    const idToUpdate = previewId || user.id;

    try {
      // Update in Supabase if available
      if (supabase && idToUpdate) {
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: profileData.name,
            email: profileData.email,
            whatsapp: profileData.whatsapp,
            cpf: profileData.cpf,
            address: profileData.endereco,
            number: profileData.numero,
            complement: profileData.complemento,
            state: profileData.estado,
            city: profileData.cidade,
            cep: profileData.cep,
          })
          .eq('id', idToUpdate);

        if (error) throw error;
      }

      // Update localStorage only if not in preview
      const updatedUser: UserType = {
        ...user,
        name: profileData.name,
        email: profileData.email,
      };

      if (!previewId) {
        updateUser(updatedUser);
      }
      setUser(updatedUser);
      
      toast({
        title: 'Sucesso!',
        description: previewId ? 'Dados do aluno atualizados (admin).' : 'Seus dados foram atualizados.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar os dados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!passwordData.newPassword) {
      toast({
        title: 'Erro',
        description: 'Digite a nova senha.',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Update password in Supabase Auth if available
      if (supabase) {
        const { error } = await supabase.auth.updateUser({
          password: passwordData.newPassword
        });

        if (error) throw error;
      }

      // Update localStorage
      const updatedUser: UserType = {
        ...user,
        password: passwordData.newPassword,
      };

      updateUser(updatedUser);
      
      toast({
        title: 'Sucesso!',
        description: 'Sua senha foi alterada.',
      });

      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar a senha.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmModule = async (deliveryId: string) => {
    try {
      setConfirmingId(deliveryId);
      await confirmModuleReceipt(deliveryId);
      toast({
        title: "Confirmação registrada",
        description: "Você confirmou o recebimento do módulo com sucesso",
      });
      refetchModules();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao confirmar recebimento",
        variant: "destructive",
      });
    } finally {
      setConfirmingId(null);
    }
  };

  const [financeFeatureEnabled, setFinanceFeatureEnabled] = useState<boolean | null>(null);
  const [modulesFeatureEnabled, setModulesFeatureEnabled] = useState<boolean | null>(null);
  const [featuresLoaded, setFeaturesLoaded] = useState<boolean>(false);

  useEffect(() => {
    const loadFlags = async () => {
      if (!supabase) {
        setFinanceFeatureEnabled(true);
        setModulesFeatureEnabled(true);
        setFeaturesLoaded(true);
        return;
      }

      try {
        const [fRes, mRes] = await Promise.all([
          supabase.from('app_settings').select('value').eq('key', 'active_aluno_financeiro').single(),
          supabase.from('app_settings').select('value').eq('key', 'active_aluno_modulos').single(),
        ]);

        if (!fRes.error && fRes.data && fRes.data.value !== undefined) {
          const v = fRes.data.value;
          setFinanceFeatureEnabled(Boolean(v === true || v === 'true' || v === '\"true\"' || v === '1' || v === 1));
        } else {
          setFinanceFeatureEnabled(true);
        }

        if (!mRes.error && mRes.data && mRes.data.value !== undefined) {
          const v = mRes.data.value;
          setModulesFeatureEnabled(Boolean(v === true || v === 'true' || v === '\"true\"' || v === '1' || v === 1));
        } else {
          setModulesFeatureEnabled(true);
        }
      } catch (err) {
        console.error('Erro ao verificar flags de features:', err);
        setFinanceFeatureEnabled(true);
        setModulesFeatureEnabled(true);
      } finally {
        setFeaturesLoaded(true);
      }
    };

    loadFlags();
  }, []);

  const tabs = [
    { id: 'site', label: 'Site', icon: Globe },
    { id: 'contato', label: 'Suporte', icon: MessageCircle },
    { id: 'dados', label: 'Meus Dados', icon: UserCircle },
    { id: 'senha', label: 'Senha', icon: Key },
  ];

  // Only add feature tabs after we've loaded the feature flags to avoid
  // a flash of content (they briefly appear with default=true then disappear).
  if (featuresLoaded) {
    if (modulesFeatureEnabled) {
      tabs.push({ id: 'modulos', label: 'Módulos', icon: Package });
    }

    if (financeFeatureEnabled) {
      tabs.push({ id: 'financeiro', label: 'Financeiro', icon: Receipt });
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {previewId && (
        <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-900 py-2 px-4 text-sm flex items-center justify-between">
          <div>Visualizando como aluno — <strong>MODO ADMIN</strong></div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { clearPreviewStudentId(); exitPreviewAndCloseWindow(); }}>Sair do modo visualização</Button>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-foreground text-primary-foreground py-4 px-6">
        <div className="w-full md:container md:mx-auto md:max-w-4xl flex items-center justify-between">
          <Link
            to="/aluno/dashboard"
            className="flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Voltar</span>
          </Link>
          <div className="h-6 w-px bg-primary-foreground/20" />
          <h1 className="text-xl font-bold">Configurações</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-card rounded-2xl p-6 md:p-8 border border-border/50 shadow-lg">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full gradient-bg flex items-center justify-center text-primary-foreground text-2xl md:text-3xl font-bold shadow-glow">
              {profileData.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold">{profileData.name}</h2>
              <p className="text-sm md:text-base text-muted-foreground">{profileData.email}</p>
            </div>
          </div>

          {/* Custom Responsive Tabs */}
          <div className="w-full mb-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all
                      ${isActive 
                        ? 'bg-primary text-primary-foreground shadow-md' 
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm md:text-base">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="mt-8">
            {activeTab === 'site' && (
              <div className="text-center py-8">
                <Globe className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">Ir para o Site</h3>
                <p className="text-muted-foreground mb-6">
                  Acesse a página principal e explore nossos cursos
                </p>
                <Link to="/">
                  <Button className="gradient-bg text-primary-foreground">
                    Visitar Site
                  </Button>
                </Link>
              </div>
            )}

            {activeTab === 'contato' && (
              <div className="text-center py-8">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-bold mb-2">Fale com o Suporte</h3>
                <p className="text-muted-foreground mb-6">
                  Entre em contato conosco via WhatsApp
                </p>
                <a
                  href="https://wa.me/5582988163133"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button className="bg-green-500 hover:bg-green-600 text-white">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    Abrir WhatsApp
                  </Button>
                </a>
                <p className="text-sm text-muted-foreground mt-4">
                  (82) 98816-3133
                </p>
              </div>
            )}

            {activeTab === 'dados' && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        className="pl-10 h-11 rounded-xl"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        className="pl-10 h-11 rounded-xl"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="whatsapp"
                        type="tel"
                        placeholder="(00) 00000-0000"
                        className="pl-10 h-11 rounded-xl"
                        value={profileData.whatsapp}
                        onChange={(e) => setProfileData({ ...profileData, whatsapp: formatPhone(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="cpf"
                        type="text"
                        placeholder="000.000.000-00"
                        className="pl-10 h-11 rounded-xl"
                        value={profileData.cpf}
                        onChange={(e) => setProfileData({ ...profileData, cpf: formatCPF(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="endereco"
                        type="text"
                        placeholder="Rua, Avenida..."
                        className="pl-10 h-11 rounded-xl"
                        value={profileData.endereco}
                        onChange={(e) => setProfileData({ ...profileData, endereco: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numero">Número</Label>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="numero"
                        type="text"
                        placeholder="123"
                        className="pl-10 h-11 rounded-xl"
                        value={profileData.numero}
                        onChange={(e) => setProfileData({ ...profileData, numero: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="complemento">Complemento</Label>
                    <Input
                      id="complemento"
                      type="text"
                      placeholder="Apto, Bloco..."
                      className="h-11 rounded-xl"
                      value={profileData.complemento}
                      onChange={(e) => setProfileData({ ...profileData, complemento: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Select
                      value={profileData.estado}
                      onValueChange={(value) => setProfileData({ ...profileData, estado: value })}
                    >
                      <SelectTrigger className="h-11 rounded-xl">
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS.map((estado) => (
                          <SelectItem key={estado} value={estado}>
                            {estado}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      type="text"
                      placeholder="Sua cidade"
                      className="h-11 rounded-xl"
                      value={profileData.cidade}
                      onChange={(e) => setProfileData({ ...profileData, cidade: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="cep"
                        type="text"
                        placeholder="00000-000"
                        className="pl-10 h-11 rounded-xl"
                        value={profileData.cep}
                        onChange={(e) => setProfileData({ ...profileData, cep: formatCEP(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 gradient-bg text-primary-foreground shadow-glow hover:opacity-90 font-semibold text-lg rounded-xl"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </form>
            )}

            {activeTab === 'senha' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        className="pl-10 pr-10 h-12 rounded-xl"
                        placeholder="Digite sua nova senha"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        className="pl-10 h-12 rounded-xl"
                        placeholder="Confirme sua nova senha"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 gradient-bg text-primary-foreground shadow-glow hover:opacity-90 font-semibold text-lg rounded-xl"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {loading ? 'Salvando...' : 'Alterar Senha'}
                </Button>
              </form>
            )}

            {activeTab === 'modulos' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Package className="w-6 h-6 text-primary" />
                  <h3 className="text-lg font-semibold">Meus Módulos</h3>
                  <p className="text-sm text-muted-foreground">
                    Confirme o recebimento dos módulos que foram entregues para você
                  </p>
                </div>

                {loadingModules ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Carregando módulos...</p>
                  </div>
                ) : modules.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-bold mb-2">Nenhum módulo entregue</h3>
                    <p className="text-muted-foreground">
                      Quando módulos forem entregues para você, eles aparecerão aqui
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-auto rounded-xl border border-border/50">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead>Módulo</TableHead>
                            <TableHead>Turma</TableHead>
                            <TableHead>Curso</TableHead>
                            <TableHead className="text-center">Data de Entrega</TableHead>
                            <TableHead className="text-center">Status</TableHead>
                            <TableHead className="text-center">Ação</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {modules.map((delivery) => (
                            <TableRow key={delivery.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                  {delivery.module.name}
                                </div>
                              </TableCell>
                              <TableCell>{delivery.module.turma?.name || "-"}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {delivery.module.turma?.course?.title || "-"}
                              </TableCell>
                              <TableCell className="text-center">
                                {new Date(delivery.delivered_at).toLocaleDateString("pt-BR")}
                              </TableCell>
                              <TableCell className="text-center">
                                {delivery.student_confirmed ? (
                                  <Badge className="bg-green-500">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Confirmado
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Aguardando
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {delivery.student_confirmed ? (
                                  <div className="text-sm text-muted-foreground">
                                    Confirmado em{" "}
                                    {new Date(delivery.confirmed_at).toLocaleDateString("pt-BR")}
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handleConfirmModule(delivery.id)}
                                    disabled={confirmingId === delivery.id}
                                  >
                                    {confirmingId === delivery.id ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Confirmando...
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Confirmar
                                      </>
                                    )}
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-blue-900 dark:text-blue-100">
                            Por que confirmar o recebimento?
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            A confirmação garante que você recebeu o material físico do módulo.
                            Isso ajuda a administração a ter controle sobre as entregas realizadas.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'financeiro' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-6">
                  <Receipt className="w-6 h-6 text-primary" />
                  <h3 className="text-lg font-semibold">Histórico de Pagamentos</h3>
                </div>

                {loadingPayments ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando pagamentos...</p>
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-12">
                    <Receipt className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-bold mb-2">Nenhum pagamento encontrado</h3>
                    <p className="text-muted-foreground mb-6">
                      Você ainda não realizou nenhuma compra.
                    </p>
                    <Link to="/cursos">
                      <Button className="gradient-bg text-primary-foreground">
                        <GraduationCap className="w-5 h-5 mr-2" />
                        Explorar Cursos
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payments.map((enrollment) => {
                      const getPaymentMethodLabel = (method: string) => {
                        const methods: Record<string, string> = {
                          'credit_card': 'Cartão de Crédito',
                          'debit_card': 'Cartão de Débito',
                          'pix': 'PIX',
                          'boleto': 'Boleto',
                          'cash': 'Dinheiro',
                          'courtesy': 'Cortesia',
                        };
                        return methods[method] || method;
                      };

                      const paymentStatus = enrollment.payment?.status;
                      const isRefunded = paymentStatus === 'REFUNDED';
                      const amount = enrollment.amount_paid || 0;

                      // Verificar se a turma está expirada
                      const now = new Date();
                      let isExpired = false;
                      
                      // Verificar data de fim de acesso da turma
                      if (enrollment.turma?.access_end_date) {
                        const accessEndDate = new Date(enrollment.turma.access_end_date);
                        if (now > accessEndDate) {
                          isExpired = true;
                        }
                      }
                      
                      // Verificar data de expiração individual do enrollment
                      if (enrollment.access_expires_at) {
                        const expiresAt = new Date(enrollment.access_expires_at);
                        if (now > expiresAt) {
                          isExpired = true;
                        }
                      }

                      return (
                        <div key={enrollment.id} className="bg-muted/30 rounded-xl p-4 border border-border/50 hover:border-primary/30 transition-colors">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <GraduationCap className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm md:text-base truncate">
                                    {enrollment.turma?.name || 'Curso não encontrado'}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs md:text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>Pago em: {enrollment.paid_at ? new Date(enrollment.paid_at).toLocaleDateString('pt-BR') : new Date(enrollment.created_at).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    {enrollment.access_expires_at && (
                                      <>
                                        <span className="text-muted-foreground/50">•</span>
                                        <div className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          <span>Expira: {new Date(enrollment.access_expires_at).toLocaleDateString('pt-BR')}</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 mt-2">
                                    <div className="flex items-center gap-1 text-xs md:text-sm text-muted-foreground">
                                      <CreditCard className="w-3 h-3" />
                                      <span>{getPaymentMethodLabel(enrollment.payment_method)}</span>
                                    </div>
                                    {isExpired ? (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-600">
                                        Turma Expirada
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-600">
                                        Turma Ativa
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between md:flex-col md:items-end gap-2">
                              {enrollment.is_courtesy ? (
                                <div className="flex items-center gap-1 text-lg md:text-xl font-bold text-green-600">
                                  <span>Cortesia</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-lg md:text-xl font-bold text-primary">
                                  <DollarSign className="w-4 h-4 md:w-5 md:h-5" />
                                  <span>R$ {Number(amount).toFixed(2)}</span>
                                </div>
                              )}
                              {isRefunded && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600">
                                  Estornado
                                </span>
                              )}
                            </div>
                          </div>
                          {enrollment.payment?.installment_count && enrollment.payment.installment_count > 1 && !isRefunded && (
                            <div className="mt-3 pt-3 border-t border-border/30">
                              <p className="text-xs text-muted-foreground">
                                Parcelado em {enrollment.payment.installment_count}x de R$ {(Number(amount) / enrollment.payment.installment_count).toFixed(2)}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Resumo Total */}
                    <div className="mt-6 pt-6 border-t border-border">
                      <div className="bg-primary/5 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground">Total investido em cursos:</span>
                          <span className="text-xl md:text-2xl font-bold text-primary">
                            R$ {payments
                              .filter(e => !e.is_courtesy && e.payment?.status !== 'REFUNDED')
                              .reduce((sum, e) => sum + Number(e.amount_paid || 0), 0)
                              .toFixed(2)
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
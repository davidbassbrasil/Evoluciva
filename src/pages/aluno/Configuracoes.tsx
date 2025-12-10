import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, User, Mail, Lock, Eye, EyeOff, ChevronLeft, Save, Globe, MessageCircle, UserCircle, Key, Phone, Hash, MapPin, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser, updateUser } from '@/lib/localStorage';
import { User as UserType } from '@/types';
import supabase from '@/lib/supabaseClient';

const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function AlunoConfiguracoes() {
  const [user, setUser] = useState<UserType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const loadUserData = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        navigate('/aluno/login');
        return;
      }
      setUser(currentUser);

      // Try to fetch complete profile from Supabase
      if (supabase && currentUser.id) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          
          if (profile) {
            setProfileData({
              name: profile.full_name || currentUser.name,
              email: profile.email || currentUser.email,
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

      // Fallback to localStorage data
      setProfileData({
        name: currentUser.name,
        email: currentUser.email,
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

    try {
      // Update in Supabase if available
      if (supabase && user.id) {
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
          .eq('id', user.id);

        if (error) throw error;
      }

      // Update localStorage
      const updatedUser: UserType = {
        ...user,
        name: profileData.name,
        email: profileData.email,
      };

      updateUser(updatedUser);
      setUser(updatedUser);
      
      toast({
        title: 'Sucesso!',
        description: 'Seus dados foram atualizados.',
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-foreground text-primary-foreground py-4 px-6">
        <div className="container mx-auto flex items-center gap-4">
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
        <div className="bg-card rounded-2xl p-8 border border-border/50 shadow-lg">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-glow">
              {profileData.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{profileData.name}</h2>
              <p className="text-muted-foreground">{profileData.email}</p>
            </div>
          </div>

          <Tabs defaultValue="site" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="site">
                <Globe className="w-4 h-4 mr-2" />
                Site
              </TabsTrigger>
              <TabsTrigger value="contato">
                <MessageCircle className="w-4 h-4 mr-2" />
                Contato
              </TabsTrigger>
              <TabsTrigger value="dados">
                <UserCircle className="w-4 h-4 mr-2" />
                Meus Dados
              </TabsTrigger>
              <TabsTrigger value="senha">
                <Key className="w-4 h-4 mr-2" />
                Senha
              </TabsTrigger>
            </TabsList>

            <TabsContent value="site" className="space-y-4 mt-6">
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
            </TabsContent>

            <TabsContent value="contato" className="space-y-4 mt-6">
              <div className="text-center py-8">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-bold mb-2">Fale com a Gente</h3>
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
            </TabsContent>

            <TabsContent value="dados" className="space-y-4 mt-6">
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
            </TabsContent>

            <TabsContent value="senha" className="space-y-4 mt-6">
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
                        placeholder="Confirme a nova senha"
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
                  <Key className="w-5 h-5 mr-2" />
                  {loading ? 'Alterando...' : 'Alterar Senha'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

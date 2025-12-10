import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Home, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getUserByEmail as localGetUserByEmail } from '@/lib/localStorage';
import { signIn, signUp } from '@/lib/supabaseAuth';
import { User as UserType } from '@/types';

const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function AlunoLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    password: '',
    cpf: '',
    endereco: '',
    numero: '',
    complemento: '',
    estado: '',
    cidade: '',
    cep: '',
  });
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { user, error } = await signIn(formData.email, formData.password);
        if (error || !user) {
          // fallback message
          toast({ title: 'Erro no login', description: (error && (error.message || String(error))) || 'Email ou senha incorretos.', variant: 'destructive' });
        } else {
          toast({ title: 'Login realizado!', description: 'Bem-vindo de volta!' });
          // Redirect to saved path or dashboard
          const returnPath = sessionStorage.getItem('checkout_return_path');
          if (returnPath) {
            sessionStorage.removeItem('checkout_return_path');
            navigate(returnPath);
          } else {
            navigate('/aluno/dashboard');
          }
        }
      } else {
        // Validação dos campos obrigatórios
        if (!formData.name || !formData.email || !formData.whatsapp || !formData.password || 
            !formData.cpf || !formData.endereco || !formData.numero || !formData.estado || 
            !formData.cidade || !formData.cep) {
          toast({
            title: 'Campos obrigatórios',
            description: 'Por favor, preencha todos os campos obrigatórios.',
            variant: 'destructive',
          });
          return;
        }

        // Prefer Supabase signUp; fallback to local check if needed
        const existingLocal = localGetUserByEmail(formData.email);
        if (existingLocal) {
          toast({ title: 'Email já cadastrado', description: 'Tente fazer login ou use outro email.', variant: 'destructive' });
        } else {
          const profileFields = {
            whatsapp: formData.whatsapp,
            cpf: formData.cpf,
            address: formData.endereco,
            number: formData.numero,
            complement: formData.complemento,
            state: formData.estado,
            city: formData.cidade,
            cep: formData.cep,
          };
          const { user, error } = await signUp(formData.name, formData.email, formData.password, profileFields);
          if (error) {
            toast({ title: 'Erro no cadastro', description: (error && (error.message || String(error))) || 'Não foi possível criar a conta.', variant: 'destructive' });
          } else {
            toast({ title: 'Cadastro realizado!', description: 'Sua conta foi criada com sucesso.' });
            // Redirect to saved path or dashboard
            const returnPath = sessionStorage.getItem('checkout_return_path');
            if (returnPath) {
              sessionStorage.removeItem('checkout_return_path');
              navigate(returnPath);
            } else {
              navigate('/aluno/dashboard');
            }
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-3xl shadow-2xl p-8 border border-border/50 max-h-[90vh] overflow-y-auto">
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center shadow-glow">
              <GraduationCap className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">
              <span className="gradient-text">Concursa</span>
              <span className="text-foreground">Plus</span>
            </span>
          </Link>

          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold mb-2">
              {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
            </h1>
            <p className="text-muted-foreground">
              {isLogin
                ? 'Acesse sua área do aluno'
                : 'Preencha seus dados para começar'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                {/* Nome */}
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      className="pl-10 h-11 rounded-xl"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="whatsapp"
                      type="tel"
                      placeholder="(00) 00000-0000"
                      className="pl-10 h-11 rounded-xl"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: formatPhone(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                {/* CPF */}
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="cpf"
                      type="text"
                      placeholder="000.000.000-00"
                      className="pl-10 h-11 rounded-xl"
                      value={formData.cpf}
                      onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10 h-11 rounded-xl"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="password">Senha *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-11 rounded-xl"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
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

            {!isLogin && (
              <>
                {/* Endereço */}
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="endereco"
                      type="text"
                      placeholder="Rua, Avenida..."
                      className="pl-10 h-11 rounded-xl"
                      value={formData.endereco}
                      onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Número e Complemento */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="numero">Número *</Label>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="numero"
                        type="text"
                        placeholder="123"
                        className="pl-10 h-11 rounded-xl"
                        value={formData.numero}
                        onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                        required
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
                      value={formData.complemento}
                      onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                    />
                  </div>
                </div>

                {/* Estado e Cidade */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado *</Label>
                    <Select
                      value={formData.estado}
                      onValueChange={(value) => setFormData({ ...formData, estado: value })}
                      required
                    >
                      <SelectTrigger className="h-11 rounded-xl bg-card">
                        <SelectValue placeholder="UF" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-border z-50">
                        {ESTADOS.map((estado) => (
                          <SelectItem key={estado} value={estado}>
                            {estado}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      type="text"
                      placeholder="Sua cidade"
                      className="h-11 rounded-xl"
                      value={formData.cidade}
                      onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* CEP */}
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="cep"
                      type="text"
                      placeholder="00000-000"
                      className="pl-10 h-11 rounded-xl"
                      value={formData.cep}
                      onChange={(e) => setFormData({ ...formData, cep: formatCEP(e.target.value) })}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 gradient-bg text-primary-foreground shadow-glow hover:opacity-90 font-semibold text-lg rounded-xl mt-2"
            >
              {loading ? 'Carregando...' : isLogin ? 'Entrar' : 'Cadastrar'}
            </Button>
          </form>

          {/* Toggle */}
          <div className="text-center mt-5">
            <p className="text-muted-foreground">
              {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}{' '}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary font-semibold hover:underline"
              >
                {isLogin ? 'Cadastre-se' : 'Faça login'}
              </button>
            </p>
          </div>

          {/* Back to home */}
          <div className="text-center mt-3">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Voltar para o site
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, User, Mail, Lock, Eye, EyeOff, ChevronLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser, updateUser } from '@/lib/localStorage';
import { User as UserType } from '@/types';

export default function AlunoConfiguracoes() {
  const [user, setUser] = useState<UserType | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/aluno/login');
      return;
    }
    setUser(currentUser);
    setFormData({
      name: currentUser.name,
      email: currentUser.email,
      newPassword: '',
      confirmPassword: '',
    });
  }, [navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }

    const updatedUser: UserType = {
      ...user,
      name: formData.name,
      email: formData.email,
      password: formData.newPassword || user.password,
    };

    updateUser(updatedUser);
    setUser(updatedUser);
    
    toast({
      title: 'Sucesso!',
      description: 'Suas informações foram atualizadas.',
    });

    setFormData((prev) => ({ ...prev, newPassword: '', confirmPassword: '' }));
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
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="bg-card rounded-2xl p-8 border border-border/50 shadow-lg">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-20 h-20 rounded-full gradient-bg flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-glow">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  className="pl-10 h-12 rounded-xl"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-10 h-12 rounded-xl"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold mb-4">Alterar Senha</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nova senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      className="pl-10 pr-10 h-12 rounded-xl"
                      placeholder="Deixe em branco para manter a atual"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
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
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 gradient-bg text-primary-foreground shadow-glow hover:opacity-90 font-semibold text-lg rounded-xl"
            >
              <Save className="w-5 h-5 mr-2" />
              Salvar Alterações
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}

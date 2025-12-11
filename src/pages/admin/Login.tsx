import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { signIn, getUser } from '@/lib/supabaseAuth';
import supabase from '@/lib/supabaseClient';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate fields
    if (!email || !password) {
      toast({ title: 'Erro', description: 'Por favor, preencha email e senha', variant: 'destructive' });
      return;
    }
    
    try {
      const { user, error } = await signIn(email, password);
      
      if (error || !user) {
        toast({ title: 'Erro', description: (error && (error.message || String(error))) || 'Credenciais inválidas', variant: 'destructive' });
        return;
      }

      // Check profile role via Supabase if available
      if (supabase) {
        const { data: profile, error: pErr } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (pErr) {
          if (pErr.code === 'PGRST116') {
            toast({ title: 'Erro', description: 'Perfil não encontrado. Por favor, cadastre-se primeiro.', variant: 'destructive' });
          } else {
            toast({ title: 'Erro', description: `Erro ao verificar permissões: ${pErr.message}`, variant: 'destructive' });
          }
          return;
        }
        
        if (profile?.role === 'admin' || profile?.role === 'moderator') {
          toast({ title: 'Bem-vindo!', description: 'Login realizado com sucesso' });
          setTimeout(() => navigate('/admin'), 100);
          return;
        }
        
        toast({ title: 'Acesso negado', description: 'Usuário não possui permissão de administrador', variant: 'destructive' });
        return;
      }

      // Supabase not configured: fallback to email-based check
      if (user.email === 'admin@admin.com') {
        toast({ title: 'Bem-vindo!', description: 'Login realizado com sucesso' });
        setTimeout(() => navigate('/admin'), 100);
      } else {
        toast({ title: 'Acesso negado', description: 'Usuário não possui permissão de admin', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Erro', description: String(err), variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-center gap-2 mb-8">
          <img src={"/src/assets/logo_.png"} alt="Logo" className="h-12" />
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input className="pl-10 h-12" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input className="pl-10 h-12" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" />
          </div>
          <Button type="submit" className="w-full h-12 gradient-bg text-primary-foreground">Entrar</Button>
        </form>
      </div>
    </div>
  );
}

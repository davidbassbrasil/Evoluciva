import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getUserByEmail, setCurrentUser } from '@/lib/localStorage';

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@admin.com');
  const [password, setPassword] = useState('admin123');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = getUserByEmail(email);
    if (user && user.password === password && user.email === 'admin@admin.com') {
      setCurrentUser(user);
      navigate('/admin');
    } else {
      toast({ title: 'Erro', description: 'Credenciais inválidas', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-primary-foreground" />
          </div>
          <span className="text-2xl font-bold">Admin</span>
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

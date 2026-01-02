import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '@/lib/localStorage';
import supabase from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
  requiredPermission?: string; // Ex: 'financeiro', 'alunos', 'admin_only'
}

export default function ProtectedAdminRoute({ children, requiredPermission }: ProtectedAdminRouteProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAccess();
  }, [requiredPermission]);

  const checkAccess = async () => {
    try {
      const user = getCurrentUser();
      
      if (!user) {
        navigate('/admin/login');
        return;
      }

      // Se Supabase está configurado, verificar role no banco
      if (supabase) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (error || !profile) {
            navigate('/admin/login');
            return;
          }

          // Verificar se é admin ou moderator
          if (profile.role !== 'admin' && profile.role !== 'moderator') {
            navigate('/admin/login');
            return;
          }

          // Admins têm acesso a tudo
          if (profile.role === 'admin') {
            setHasAccess(true);
            setIsChecking(false);
            return;
          }

          // Se não há permissão específica requerida, moderador pode acessar
          if (!requiredPermission) {
            setHasAccess(true);
            setIsChecking(false);
            return;
          }

          // Para rotas 'admin_only', negar acesso a moderadores
          if (requiredPermission === 'admin_only') {
            navigate('/admin');
            return;
          }

          // Verificar se moderador tem a permissão específica
          const { data: permissions } = await supabase
            .from('user_permissions')
            .select('permission_key')
            .eq('user_id', user.id);

          const permKeys = permissions?.map(p => p.permission_key) || [];
          
          if (permKeys.includes(requiredPermission)) {
            setHasAccess(true);
          } else {
            // Sem permissão, redirecionar para dashboard
            navigate('/admin');
          }
        } catch (e) {
          // Se erro na verificação de permissões, verificar email fallback
          if (user.email === 'admin@admin.com') {
            setHasAccess(true);
          } else {
            navigate('/admin/login');
          }
        }
      } else {
        // Sem Supabase: fallback para email check
        if (user.email === 'admin@admin.com') {
          setHasAccess(true);
        } else {
          navigate('/admin/login');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar acesso:', error);
      navigate('/admin/login');
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Redirecionamento já foi feito
  }

  return <>{children}</>;
}

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, LayoutDashboard, BookOpen, Users, MessageSquare, HelpCircle, Image, Tags, LogOut, Menu, X, Wallet, UsersRound, PlayCircle, Shield, Package, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCurrentUser, logout, getSettings } from '@/lib/localStorage';
import { cn } from '@/lib/utils';
import supabase from '@/lib/supabaseClient';
import logoPng from '@/assets/logo_.png';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin', permission: 'dashboard' },
  { icon: Image, label: 'Banners', path: '/admin/banners', permission: 'banners' },
  { icon: BookOpen, label: 'Cursos', path: '/admin/cursos', permission: 'cursos' },
  { icon: UsersRound, label: 'Turmas', path: '/admin/turmas', permission: 'turmas' },
  { icon: PlayCircle, label: 'Aulas', path: '/admin/aulas', permission: 'aulas' },
  { icon: Users, label: 'Professores', path: '/admin/professores', permission: 'professores' },
  { icon: Tags, label: 'Tags • Matérias', path: '/admin/tags', permission: 'tags' },
  { icon: MessageSquare, label: 'Depoimentos', path: '/admin/depoimentos', permission: 'depoimentos' },
  { icon: HelpCircle, label: 'FAQ', path: '/admin/faq', permission: 'faq' },
  { icon: Users, label: 'Alunos', path: '/admin/alunos', permission: 'alunos' },
  { icon: Wallet, label: 'Financeiro', path: '/admin/financeiro', permission: 'financeiro' },
  { icon: Package, label: 'Módulos', path: '/admin/modulos', permission: 'modulos' },
  { icon: Settings, label: 'App Settings', path: '/admin/app-settings', permission: 'app_settings' },
  { icon: Shield, label: 'Acesso', path: '/admin/acesso', permission: 'admin_only' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const user = getCurrentUser();
      
      if (!user) {
        navigate('/admin/login');
        return;
      }

      // If Supabase is configured, check role in profiles table
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

          setUserRole(profile.role);

          // Se for moderador, carregar permissões
          if (profile.role === 'moderator') {
            const { data: permissions } = await supabase
              .from('user_permissions')
              .select('permission_key')
              .eq('user_id', user.id);

            const permKeys = permissions?.map(p => p.permission_key) || [];
            console.log('🔑 Role:', profile.role);
            console.log('🔑 Permissões do moderador:', permKeys);
            setUserPermissions(permKeys);
          } else {
            console.log('🔑 Role:', profile.role, '(admin tem todas as permissões)');
          }
        } catch (e) {
          // If error checking profile, fallback to email check
          if (user.email !== 'admin@admin.com') {
            navigate('/admin/login');
            return;
          }
          setUserRole('admin');
        }
      } else {
        // No Supabase: fallback to email check
        if (user.email !== 'admin@admin.com') {
          navigate('/admin/login');
          return;
        }
        setUserRole('admin');
      }
      
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [navigate]);

  const hasPermission = (permission: string) => {
    // Admin tem todas as permissões
    if (userRole === 'admin') return true;
    
    // Admin_only é apenas para admins
    if (permission === 'admin_only') return false;
    
    // Moderador precisa ter a permissão específica
    const has = userPermissions.includes(permission);
    console.log(`🔍 Verificando permissão "${permission}":`, has ? '✅' : '❌');
    return has;
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border">
            <Link to="/admin" className="flex items-center gap-2">
              <img src={logoPng} alt="Logo" className="h-10" />
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-auto">
            {menuItems
              .filter(item => hasPermission(item.permission))
              .map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                    location.pathname === item.path
                      ? 'bg-primary text-primary-foreground shadow-glow'
                      : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
          </nav>

          <div className="p-4 border-t border-border">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={handleLogout}>
              <LogOut className="w-5 h-5 mr-3" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">Painel Administrativo</h1>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

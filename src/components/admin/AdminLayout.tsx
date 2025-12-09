import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GraduationCap, LayoutDashboard, BookOpen, Users, MessageSquare, HelpCircle, Image, Tags, LogOut, Menu, X, Wallet, UsersRound, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCurrentUser, logout, getSettings } from '@/lib/localStorage';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Image, label: 'Banners', path: '/admin/banners' },
  { icon: BookOpen, label: 'Cursos', path: '/admin/cursos' },
  { icon: UsersRound, label: 'Turmas', path: '/admin/turmas' },
  { icon: PlayCircle, label: 'Aulas', path: '/admin/aulas' },
  { icon: Users, label: 'Professores', path: '/admin/professores' },
  { icon: Tags, label: 'Tags', path: '/admin/tags' },
  { icon: MessageSquare, label: 'Depoimentos', path: '/admin/depoimentos' },
  { icon: HelpCircle, label: 'FAQ', path: '/admin/faq' },
  { icon: Users, label: 'Alunos', path: '/admin/alunos' },
  { icon: Wallet, label: 'Financeiro', path: '/admin/financeiro' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.email !== 'admin@admin.com') {
      navigate('/admin/login');
    }
  }, [navigate]);

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
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <span className="font-bold text-lg">Admin</span>
                <p className="text-xs text-muted-foreground">{getSettings().siteName}</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-auto">
            {menuItems.map((item) => (
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

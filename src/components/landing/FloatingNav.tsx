import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, GraduationCap, User, ShoppingCart, Moon, Sun, LogOut, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { getSettings, getCurrentUser, getCart, logout } from '@/lib/localStorage';
import { SiteSettings } from '@/types';

export function FloatingNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const currentUser = getCurrentUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    setSettings(getSettings());
    setCartCount(getCart().length);
  }, []);

  useEffect(() => {
    const onCartUpdated = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail;
        if (detail && Array.isArray(detail.cart)) setCartCount(detail.cart.length);
        else setCartCount(getCart().length);
      } catch {
        setCartCount(getCart().length);
      }
    };

    window.addEventListener('cartUpdated', onCartUpdated as EventListener);
    // Also listen to storage events (other tabs)
    const onStorage = (ev: StorageEvent) => {
      if (ev.key === undefined || ev.key === null) return;
      if (ev.key.includes('cursos_cart')) {
        setCartCount(getCart().length);
      }
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('cartUpdated', onCartUpdated as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);
  }, []);

  const toggleDarkMode = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newDark);
  };

  const navLinks = [
    { href: '/cursos', label: 'Cursos', isRoute: true },
    { href: '/sobre', label: 'Sobre', isRoute: true },
    { href: '#professores', label: 'Professores', isRoute: false },
    { href: '#depoimentos', label: 'Depoimentos', isRoute: false },
    { href: '#faq', label: 'FAQ', isRoute: false },
  ];

  return (
    <nav
      className={cn(
        'fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-out',
        isScrolled
          ? 'w-[90%] max-w-4xl py-2 px-4 rounded-2xl glass shadow-lg'
          : 'w-[95%] max-w-6xl py-4 px-6 rounded-3xl glass shadow-xl'
      )}
    >
      <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          {settings?.logo ? (
            <img src={settings.logo} alt={settings.siteName} className="h-10" />
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-glow transition-transform group-hover:scale-110">
                <GraduationCap className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className={cn(
                'font-bold transition-all duration-300',
                isScrolled ? 'text-lg' : 'text-xl'
              )}>
                <span className="gradient-text">{settings?.siteName?.split(' ')[0] || 'Concursa'}</span>
                <span className="text-foreground">{settings?.siteName?.split(' ').slice(1).join(' ') || 'Plus'}</span>
              </span>
            </>
          )}
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            link.isRoute ? (
              <Link
                key={link.href}
                to={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium text-sm"
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium text-sm"
              >
                {link.label}
              </a>
            )
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-full"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ShoppingCart className="w-5 h-5" />
            </Button>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs font-semibold">
                {cartCount}
              </span>
            )}
          </Link>
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gradient-bg text-primary-foreground shadow-glow hover:opacity-90 font-semibold">
                  <User className="w-4 h-4 mr-2" />
                  {currentUser.email === 'admin@admin.com' ? 'Admin' : 'Minha Conta'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={currentUser.email === 'admin@admin.com' ? '/admin' : '/aluno/dashboard'} className="cursor-pointer">
                    <LogIn className="w-4 h-4 mr-2" />
                    Acessar
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/aluno/login">
              <Button size="sm" className="gradient-bg text-primary-foreground shadow-glow hover:opacity-90 font-semibold">
                <User className="w-4 h-4 mr-2" />
                Área do Aluno
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            className="rounded-full"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ShoppingCart className="w-5 h-5" />
            </Button>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs font-semibold">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-border animate-fade-in">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              link.isRoute ? (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </a>
              )
            ))}
            <div className="flex flex-col gap-2 pt-2">
              {currentUser ? (
                <>
                  <Link to={currentUser.email === 'admin@admin.com' ? '/admin' : '/aluno/dashboard'} onClick={() => setIsMenuOpen(false)}>
                    <Button className="w-full gradient-bg text-primary-foreground">
                      <LogIn className="w-4 h-4 mr-2" />
                      Acessar
                    </Button>
                  </Link>
                  <Button 
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </Button>
                </>
              ) : (
                <Link to="/aluno/login" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full gradient-bg text-primary-foreground">
                    <User className="w-4 h-4 mr-2" />
                    Área do Aluno
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

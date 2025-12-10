import { useState, useEffect } from 'react';
import { ArrowUp, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function FloatingButtons() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openWhatsApp = () => {
    window.open('https://wa.me/5582988163133?text=Olá! Gostaria de saber mais sobre os cursos.', '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <Button
        onClick={scrollToTop}
        size="icon"
        className={cn(
          'w-12 h-12 rounded-full shadow-lg transition-all duration-300',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <ArrowUp className="w-5 h-5" />
      </Button>
      
      <Button
        onClick={openWhatsApp}
        size="icon"
        className="w-14 h-14 rounded-full shadow-lg bg-[transparent] hover:bg-[transparent] flex items-center justify-center p-0"
      >
        <img src={'/src/assets/WhatsApp.svg.png'} alt="WhatsApp" className="w-14 h-14" />
      </Button>
    </div>
  );
}

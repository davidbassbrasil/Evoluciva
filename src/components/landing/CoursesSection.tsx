import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import supabase from '@/lib/supabaseClient';
import { Turma } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function CoursesSection() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('turmas')
          .select(`
            *,
            course:courses (
              id,
              title,
              description,
              image,
              instructor,
              category,
              slug,
              full_description,
              whats_included,
              duration,
              lessons,
              active
            )
          `)
          .in('status', ['active', 'coming_soon'])
          .order('created_at', { ascending: false });

        if (!error && data) {
          // Filtrar por curso ativo, preços definidos e datas de venda
          const now = new Date();
          const filtered = data.filter((turma: any) => {
            // Filtrar se o curso está desativado
            if (!turma.course?.active) return false;
            
            // Filtrar se não tem preço definido (nem presencial nem online)
            if (!turma.price && !turma.price_online) return false;
            if (turma.price <= 0 && (!turma.price_online || turma.price_online <= 0)) return false;
            
            // Se é coming_soon, sempre mostrar (para informação)
            if (turma.status === 'coming_soon') return true;
            
            // Para active, filtrar por datas
            const startDate = turma.sale_start_date ? new Date(turma.sale_start_date) : null;
            const endDate = turma.sale_end_date ? new Date(turma.sale_end_date) : null;
            
            if (startDate && now < startDate) return false;
            if (endDate && now > endDate) return false;
            
            return true;
          });
          
          setTurmas(filtered);
        }
      } catch (err) {
        console.error('Error loading turmas from Supabase:', err);
      }
    };

    load();
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 400;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section id="cursos" className="py-12 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <Badge variant="secondary" className="mb-4 px-4 py-1 text-sm font-medium">

          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Prepare-se com os <span className="gradient-text">melhores cursos</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Cursos completos desenvolvidos por professores especialistas para garantir sua aprovação
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-card shadow-lg hover:shadow-xl transition-all -translate-x-1/2 hidden md:flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-card shadow-lg hover:shadow-xl transition-all translate-x-1/2 hidden md:flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {turmas.map((turma) => (
              <div
                key={turma.id}
                className="flex-shrink-0 w-[320px] md:w-[380px] snap-start"
              >
                <div className="group bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover-lift border border-border/50">
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={turma.course?.image}
                      alt={turma.course?.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {turma.status === 'coming_soon' && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-orange-500">Em Breve</Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {turma.course?.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {turma.course?.description}
                    </p>

                    <p className="text-sm text-muted-foreground mb-4">
                      {turma.course?.instructor}
                    </p>
                    
                    <div className="flex items-end justify-between">
                      <div>
                        {turma.original_price > turma.price && (
                          <span className="text-muted-foreground text-sm line-through">
                            R$ {Number(turma.original_price).toFixed(2)}
                          </span>
                        )}
                        <div className="text-2xl font-bold text-primary">
                          R$ {Number(turma.price).toFixed(2)}
                        </div>
                      </div>
                      <Link to={`/curso/${turma.course?.slug || turma.course_id}?turma=${turma.id}`}>
                        <Button className="gradient-bg text-primary-foreground shadow-glow hover:opacity-90">
                          Saber mais
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

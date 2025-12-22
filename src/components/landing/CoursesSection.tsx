import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import supabase from '@/lib/supabaseClient';
import { Turma } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function CoursesSection() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;
      try {
        // ✨ OTIMIZAÇÃO: Buscar apenas campos necessários + limitar a 7 turmas para home
        const { data, error } = await supabase
          .from('turmas')
          .select(`
            id, name, price, price_online, original_price, original_price_online,
            presential_slots, status, sale_start_date, sale_end_date, access_end_date,
            course:courses (
              id, title, description, image, instructor, slug, active, display_order
            )
          `)
          .in('status', ['active', 'coming_soon'])
          .limit(20);

        if (!error && data) {
          // Ordenar por display_order do curso (menor número = mais prioritário)
          const sorted = data.sort((a: any, b: any) => {
            const orderA = a.course?.display_order ?? 999;
            const orderB = b.course?.display_order ?? 999;
            return orderA - orderB;
          });
          
          // Limitar a 7 após ordenar
          const limited = sorted.slice(0, 7);

          // Filtrar por curso ativo e datas de venda/acesso
          const now = new Date();
          const filtered = sorted.filter((turma: any) => {
            // Filtrar se o curso está desativado
            if (!turma.course?.active) return false;
            
            // Verificar se a turma já expirou completamente (fim de acesso do aluno)
            if (turma.access_end_date) {
              const accessEndDate = new Date(turma.access_end_date);
              if (now > accessEndDate) return false;
            }
            
            // Se é coming_soon, sempre mostrar (para informação)
            if (turma.status === 'coming_soon') return true;
            
            // Para active, filtrar por datas de venda
            const startDate = turma.sale_start_date ? new Date(turma.sale_start_date) : null;
            const endDate = turma.sale_end_date ? new Date(turma.sale_end_date) : null;
            
            if (startDate && now < startDate) return false;
            if (endDate && now > endDate) return false;
            
            return true;
          });
          
          // Agrupar por curso - pegar apenas a primeira turma de cada curso
          const uniqueCourses = new Map();
          filtered.forEach((turma: any) => {
            if (turma.course?.id && !uniqueCourses.has(turma.course.id)) {
              uniqueCourses.set(turma.course.id, turma);
            }
          });
          
          // Limitar a 7 cursos únicos
          const uniqueTurmas = Array.from(uniqueCourses.values()).slice(0, 7);
          
          setTurmas(uniqueTurmas);
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

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const cardWidth = 400; // mesmo valor do scrollAmount
      const index = Math.round(container.scrollLeft / cardWidth);
      const clampedIndex = Math.min(turmas.length, Math.max(0, index));
      setCurrentIndex(clampedIndex);
    };

    container.addEventListener('scroll', handleScroll);
    // inicializa posição
    // garantir que começa na posição 0 para evitar deslocamento inicial
    try {
      container.scrollTo({ left: 0 });
    } catch (e) {
      /* noop */
    }
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [turmas.length]);

  return (
    <section id="cursos" className="pt-10 pb-8 md:pt-20 md:pb-20 bg-background">
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
            className="flex flex-row gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 pl-4 md:pl-6 pr-4 md:pr-6"
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
                      loading="lazy"
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
                     
                     {/*}
                     <div>
                        {turma.original_price > turma.price && (
                          <span className="text-muted-foreground text-sm line-through">
                            R$ {Number(turma.original_price).toFixed(2)}
                          </span>
                        )}
                        <div className="text-2xl font-bold text-primary">
                          R$ {Number(turma.price).toFixed(2)}
                        </div>
                      </div>*/}

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

            {/* Card "Ver Mais Cursos" */}
            <div className="flex-shrink-0 w-[320px] md:w-[380px] snap-start">
              <Link to="/cursos" className="block h-full">
                <div className="group bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover-lift border-2 border-primary/10 hover:border-primary/50 h-full flex flex-col items-center justify-center p-8 min-h-[500px]">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <ArrowRight className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="font-bold text-2xl mb-4 group-hover:text-primary transition-colors">
                      Ver Mais Cursos
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Descubra todos os nossos cursos e escolha o melhor para sua aprovação!
                    </p>
                    <Button className="gradient-bg text-primary-foreground shadow-glow hover:opacity-90">
                      Explorar Todos
                    </Button>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Bolinhas indicadoras para mobile */}
          {turmas.length > 0 && (
            <div className="mt-2 flex items-center justify-center gap-1 md:hidden">
              <div className="flex gap-1">
                {[...Array(turmas.length + 1)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (!scrollRef.current) return;
                      const cardWidth = 400;
                      scrollRef.current.scrollTo({
                        left: cardWidth * index,
                        behavior: 'smooth',
                      });
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'bg-primary w-4'
                        : 'bg-primary/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

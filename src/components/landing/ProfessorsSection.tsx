import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import supabase from '@/lib/supabaseClient';
import { Professor } from '@/types';
import { Badge } from '@/components/ui/badge';

export function ProfessorsSection() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;
      try {
        // Carregar professores (apenas ativos). We'll convert order to number and sort client-side
        const { data: professorsData, error: professorsError } = await supabase
          .from('professors')
          .select('*')
          .eq('active', true);

        if (professorsError) throw professorsError;

        // Buscar relacionamentos com cursos
        const { data: relationsData } = await supabase
          .from('professor_courses')
          .select(`
            professor_id,
            course:courses(id, title, slug)
          `);

        // Agrupar cursos por professor
        const coursesMap: { [key: string]: any[] } = {};
        relationsData?.forEach((rel: any) => {
          if (!coursesMap[rel.professor_id]) {
            coursesMap[rel.professor_id] = [];
          }
          if (rel.course) {
            coursesMap[rel.professor_id].push(rel.course);
          }
        });

        // Juntar dados e normalizar order para number
        const professorsWithCourses = (professorsData?.map(prof => ({
          ...prof,
          order: typeof prof.order === 'string' ? (prof.order === null ? null : parseInt(prof.order, 10)) : prof.order,
          courses: coursesMap[prof.id] || []
        })) || []).sort((a: any, b: any) => {
          const ao = typeof a.order === 'number' ? a.order : Number.POSITIVE_INFINITY;
          const bo = typeof b.order === 'number' ? b.order : Number.POSITIVE_INFINITY;
          if (ao !== bo) return ao - bo;
          const aUpdated = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const bUpdated = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return bUpdated - aUpdated;
        });

        setProfessors(professorsWithCourses);
      } catch (err) {
        console.error('Error loading professors from Supabase:', err);
      }
    };

    load();

    // Listen to updates from admin
    const handler = () => load();
    window.addEventListener('professorsUpdated', handler as EventListener);
    return () => {
      window.removeEventListener('professorsUpdated', handler as EventListener);
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || professors.length === 0) return;

    const handleScroll = () => {
      const cardWidth = 320; // mesmo valor do scrollAmount
      const index = Math.round(container.scrollLeft / cardWidth);
      const clampedIndex = Math.min(professors.length - 1, Math.max(0, index));
      setCurrentIndex(clampedIndex);
    };

    container.addEventListener('scroll', handleScroll);
    // inicializa posição
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [professors.length]);

  if (professors.length === 0) return null;

  return (
    <section id="professores" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 px-4 py-1 text-sm font-medium">
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Aprenda com os <span className="gradient-text">melhores professores</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Profissionais com vasta experiência em concursos públicos e didática comprovada
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
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {professors.map((professor) => {
              // Se tem cursos, vai para página do professor, senão vai para /cursos
              const linkTo = (professor.courses && professor.courses.length > 0)
                ? `/professor/${professor.slug || professor.id}`
                : '/cursos';

              return (
                <Link
                  key={professor.id}
                  to={linkTo}
                  className="flex-shrink-0 w-[280px] group"
                >
                  <div className="bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover-lift border border-border/50 p-6 text-center">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <div className="absolute inset-0 rounded-full gradient-bg opacity-20 group-hover:opacity-30 transition-opacity" />
                      <img
                        src={professor.image}
                        alt={professor.name}
                        loading="lazy"
                        className="w-full h-full object-cover rounded-full border-4 border-card shadow-lg"
                      />
                    </div>
                    
                    <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{professor.name}</h3>
                    <Badge variant="secondary" className="mb-3">
                      {professor.specialty}
                    </Badge>
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {professor.bio}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>

          {professors.length > 1 && (
            <div className="mt-2 flex items-center justify-center gap-1 md:hidden">
              <div className="flex gap-1">
                {professors.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (!scrollRef.current) return;
                      const cardWidth = 320;
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

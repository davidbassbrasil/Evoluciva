import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import supabase from '@/lib/supabaseClient';
import { Professor } from '@/types';
import { Badge } from '@/components/ui/badge';

export function ProfessorsSection() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('professors')
          .select('*')
          .order('name', { ascending: true });

        if (!error && data) setProfessors(data);
      } catch (err) {
        console.error('Error loading professors from Supabase:', err);
      }
    };

    load();
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
            {professors.map((professor) => (
              <div
                key={professor.id}
                className="flex-shrink-0 w-[280px] group"
              >
                <div className="bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover-lift border border-border/50 p-6 text-center">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full gradient-bg opacity-20 group-hover:opacity-30 transition-opacity" />
                    <img
                      src={professor.image}
                      alt={professor.name}
                      className="w-full h-full object-cover rounded-full border-4 border-card shadow-lg"
                    />
                  </div>
                  
                  <h3 className="font-bold text-lg mb-1">{professor.name}</h3>
                  <Badge variant="secondary" className="mb-3">
                    {professor.specialty}
                  </Badge>
                  <p className="text-muted-foreground text-sm line-clamp-3">
                    {professor.bio}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

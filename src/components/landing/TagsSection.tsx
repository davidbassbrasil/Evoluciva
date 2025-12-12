import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Tag } from '@/types';
import supabase from '@/lib/supabaseClient';

export function TagsSection() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data) setTags(data);
    } catch (err) {
      console.error('Error loading tags from Supabase:', err);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 350;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || tags.length === 0) return;

    const handleScroll = () => {
      const cardWidth = 350;
      const index = Math.round(container.scrollLeft / cardWidth);
      const clampedIndex = Math.min(tags.length - 1, Math.max(0, index));
      setCurrentIndex(clampedIndex);
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [tags.length]);

  if (tags.length === 0) return null;

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Matérias <span className="gradient-text">Disponíveis</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Encontre o conteúdo que você precisa para sua aprovação
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
            {tags.map((tag) => {
              const linkTo = tag.course_id ? `/curso/${tag.course_id}` : '/cursos';
              
              return (
                <Link
                  key={tag.id}
                  to={linkTo}
                  className="group flex-shrink-0 w-[320px] md:w-[350px]"
                >
                  <div className="bg-card rounded-2xl border border-border/50 overflow-hidden hover:shadow-xl transition-all duration-300 hover-lift h-full">
                    <div className="p-6 flex flex-col h-[280px]">
                        <h3 className="font-bold text-2xl mb-3 group-hover:text-primary transition-colors">
                        {tag.name}
                      </h3>
                      
                      {tag.description_tag ? (
                        <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1">
                          {tag.description_tag}
                        </p>
                      ) : (
                        <div className="flex-1" />
                      )}
                      
                      <div className="text-sm text-primary font-medium group-hover:underline flex items-center gap-1">
                        Ver cursos
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Bolinhas indicadoras para mobile */}
          {tags.length > 1 && (
            <div className="mt-4 flex items-center justify-center gap-1 md:hidden">
              <div className="flex gap-1">
                {tags.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (!scrollRef.current) return;
                      const cardWidth = 350;
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

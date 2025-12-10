import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTags } from '@/lib/localStorage';
import { Tag } from '@/types';
import { supabase } from '@/lib/supabaseClient';

export function TagsSection() {
  const [tags, setTags] = useState<Tag[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    // Try to load from Supabase first
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('tags')
          .select('*')
          .order('name', { ascending: true });
        
        if (!error && data) {
          setTags(data);
          return;
        }
      } catch (err) {
        console.error('Error loading tags from Supabase:', err);
      }
    }
    // Fallback to localStorage
    setTags(getTags());
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (tags.length === 0) return null;

  return (
    <section className="py-16 bg-secondary/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Matérias Disponíveis
          </h2>
          <p className="text-muted-foreground">
            Encontre o conteúdo que você precisa para sua aprovação
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-card shadow-md hover:shadow-lg transition-all -translate-x-1/2 hidden md:flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-card shadow-md hover:shadow-lg transition-all translate-x-1/2 hidden md:flex items-center justify-center"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide py-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {tags.map((tag) => (
              <button
                key={tag.id}
                className="flex-shrink-0 px-6 py-3 rounded-full font-medium text-sm transition-all hover:scale-105 hover:shadow-lg"
                style={{
                  backgroundColor: `${tag.color}15`,
                  color: tag.color,
                  border: `2px solid ${tag.color}30`,
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

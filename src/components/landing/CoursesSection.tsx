import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getCourses } from '@/lib/localStorage';
import { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function CoursesSection() {
  const [courses, setCourses] = useState<Course[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCourses(getCourses());
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
    <section id="cursos" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 px-4 py-1 text-sm font-medium">
            Nossos Cursos
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
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex-shrink-0 w-[320px] md:w-[380px] snap-start"
              >
                <div className="group bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover-lift border border-border/50">
                  <div className="relative aspect-[5/4] overflow-hidden">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm">
                        {course.category}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {course.description}
                    </p>

                    <p className="text-sm text-muted-foreground mb-4">
                      {course.instructor}
                    </p>
                    
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-muted-foreground text-sm line-through">
                          R$ {course.originalPrice.toFixed(2)}
                        </span>
                        <div className="text-2xl font-bold text-primary">
                          R$ {course.price.toFixed(2)}
                        </div>
                      </div>
                      <Link to={`/curso/${course.id}`}>
                        <Button className="gradient-bg text-primary-foreground shadow-glow hover:opacity-90">
                          Comprar
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

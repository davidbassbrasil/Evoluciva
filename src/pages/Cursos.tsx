import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import supabase from '@/lib/supabaseClient';
import { Course } from '@/types';
import { FloatingNav } from '@/components/landing/FloatingNav';
import { Footer } from '@/components/landing/Footer';

export default function Cursos() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('active', true)
          .order('display_order', { ascending: true, nullsFirst: false })
          .order('title', { ascending: true });

        if (!error && data) {
          setCourses(data);
          setFilteredCourses(data);
        }
      } catch (err) {
        console.error('Error loading courses:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  useEffect(() => {
    let result = courses;
    
    if (searchTerm) {
      result = result.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedEstado) {
      result = result.filter(course => course.estado === selectedEstado);
    }
    
    setFilteredCourses(result);
  }, [searchTerm, selectedEstado, courses]);

  const states = ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE', 'DF', 'GO', 'PA', 'AM', 'MT', 'MS', 'ES', 'PB', 'RN', 'AL', 'SE', 'PI', 'MA', 'TO', 'RO', 'AC', 'AP', 'RR'];

  return (
    <div className="min-h-screen bg-background">
      <FloatingNav />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 px-4 py-1 text-sm font-medium">
              Catálogo Completo
            </Badge>
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Todos os <span className="gradient-text">Nossos Cursos</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Encontre o curso ideal para sua preparação e comece sua jornada rumo à aprovação
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedEstado || "all"}
              onValueChange={(value) => setSelectedEstado(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-full md:w-48 bg-card">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border z-50">
                <SelectItem value="all">Todos os Estados</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <p className="text-muted-foreground mb-6">
            {filteredCourses.length} curso{filteredCourses.length !== 1 ? 's' : ''} encontrado{filteredCourses.length !== 1 ? 's' : ''}
          </p>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando cursos...</p>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">Nenhum curso encontrado</p>
              </div>
            ) : (
              filteredCourses.map(course => (
              <Link 
                key={course.id} 
                to={`/curso/${course.slug || course.id}`}
                className="group"
              >
                <div className="bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover-lift border border-border/50 h-full flex flex-col">
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
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
                      {course.description}
                    </p>

                    <p className="text-sm text-muted-foreground mb-4">
                      {course.instructor}
                    </p>
                    
                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        <span className="text-muted-foreground text-sm line-through">
                          R$ {Number(course.originalPrice || 0).toFixed(2)}
                        </span>
                        <div className="text-2xl font-bold text-primary">
                          R$ {Number(course.price || 0).toFixed(2)}
                        </div>
                      </div>
                      <Button size="sm" className="gradient-bg text-primary-foreground shadow-glow hover:opacity-90">
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            )))}
          </div>

          {!loading && filteredCourses.length === 0 && (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">
                Nenhum curso encontrado
              </p>
              <Button onClick={() => { setSearchTerm(''); setSelectedEstado(null); }}>
                Limpar filtros
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
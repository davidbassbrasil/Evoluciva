import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import supabase from '@/lib/supabaseClient';
import { Turma } from '@/types';
import { FloatingNav } from '@/components/landing/FloatingNav';
import { Footer } from '@/components/landing/Footer';

export default function Cursos() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [filteredTurmas, setFilteredTurmas] = useState<Turma[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<string | null>(null);
  const [modeFilter, setModeFilter] = useState<'all' | 'presencial' | 'online'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCourses = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // ✨ OTIMIZAÇÃO: Buscar apenas campos necessários (não precisa de duration, lessons, full_description)
        const { data, error } = await supabase
          .from('turmas')
          .select(`
            id, name, price, price_online, original_price, original_price_online,
            presential_slots, status, sale_start_date, sale_end_date, access_end_date,
            course:courses (
              id, title, description, image, instructor, slug, estado, active, display_order
            )
          `)
          .in('status', ['active', 'coming_soon'])
          .limit(100);

        if (!error && data) {
          // Ordenar por display_order do curso
          const sorted = data.sort((a: any, b: any) => {
            const orderA = a.course?.display_order ?? 999;
            const orderB = b.course?.display_order ?? 999;
            return orderA - orderB;
          });
          
          const now = new Date();
          const availableTurmas = sorted.filter((t: any) => {
            // Filtrar se o curso está desativado
            if (!t.course?.active) return false;
            
            // Verificar se a turma já expirou completamente (fim de acesso do aluno)
            if (t.access_end_date) {
              const accessEndDate = new Date(t.access_end_date);
              if (now > accessEndDate) return false;
            }
            
            // Se é coming_soon, sempre mostrar (para informação)
            if (t.status === 'coming_soon') return true;
            
            // Para active, filtrar por datas de venda
            const startDate = t.sale_start_date ? new Date(t.sale_start_date) : null;
            const endDate = t.sale_end_date ? new Date(t.sale_end_date) : null;
            if (startDate && now < startDate) return false;
            if (endDate && now > endDate) return false;
            return true;
          });
          setTurmas(availableTurmas);
          setFilteredTurmas(availableTurmas);
        }
      } catch (err) {
        console.error('Error loading turmas:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, []);

  useEffect(() => {
    let result = turmas;

    if (searchTerm) {
      result = result.filter(turma => 
        turma.course?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        turma.course?.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        turma.course?.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        turma.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedEstado) {
      result = result.filter(turma => turma.course?.estado === selectedEstado);
    }

    if (modeFilter && modeFilter !== 'all') {
      result = result.filter(turma => {
        const hasPresencial = Boolean(turma.price) || typeof turma.presential_slots !== 'undefined';
        const hasOnline = Boolean(turma.price_online);
        if (modeFilter === 'presencial') return hasPresencial;
        if (modeFilter === 'online') return hasOnline;
        return true;
      });
    }

    setFilteredTurmas(result);
  }, [searchTerm, selectedEstado, turmas, modeFilter]);

  const states = ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE', 'DF', 'GO', 'PA', 'AM', 'MT', 'MS', 'ES', 'PB', 'RN', 'AL', 'SE', 'PI', 'MA', 'TO', 'RO', 'AC', 'AP', 'RR'];

  return (
    <div className="min-h-screen bg-background">
      <FloatingNav />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Todos os <span className="gradient-text">Nossos Cursos</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Encontre o curso ideal para sua preparação e comece sua jornada rumo à aprovação
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 items-start">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setModeFilter(modeFilter === 'presencial' ? 'all' : 'presencial')}
                className={`px-3 py-2 rounded-md text-sm border w-32 md:w-36 flex items-center justify-center ${modeFilter === 'presencial' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'}`}>
                Presencial
              </button>
              <button
                onClick={() => setModeFilter(modeFilter === 'online' ? 'all' : 'online')}
                className={`px-3 py-2 rounded-md text-sm border w-32 md:w-36 flex items-center justify-center ${modeFilter === 'online' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground border-border'}`}>
                Online
              </button>
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
            {filteredTurmas.length} turma{filteredTurmas.length !== 1 ? 's' : ''} encontrada{filteredTurmas.length !== 1 ? 's' : ''}
          </p>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando cursos...</p>
              </div>
            ) : filteredTurmas.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">Nenhum curso encontrado</p>
              </div>
            ) : (
              filteredTurmas.map(turma => (
              <Link 
                key={turma.id} 
                to={`/curso/${turma.course?.slug || turma.course_id}?turma=${turma.id}`}
                className="group"
              >
                <div className="bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover-lift border border-border/50 h-full flex flex-col">
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
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {turma.course?.title}
                    </h3>
                    <Badge variant="outline" className="text-xs mb-2 w-fit">{turma.name}</Badge>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
                      {turma.course?.description}
                    </p>

                    <p className="text-sm text-muted-foreground mb-4">
                      {turma.course?.instructor}
                    </p>
                    
                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-xs text-muted-foreground">Presencial</div>
                          {turma.presential_slots > 0 && (
                            <Badge variant={turma.presential_slots <= 5 ? "destructive" : "secondary"} className="text-xs">
                              {turma.presential_slots} {turma.presential_slots === 1 ? 'vaga' : 'vagas'}
                            </Badge>
                          )}
                          {turma.presential_slots === 0 && (
                            <Badge variant="destructive" className="text-xs">
                              Esgotado
                            </Badge>
                          )}
                        </div>
                        {turma.original_price > turma.price && (
                          <span className="text-muted-foreground text-xs line-through">
                            R$ {Number(turma.original_price).toFixed(2)}
                          </span>
                        )}
                        <div className="text-lg font-bold text-primary">
                          R$ {Number(turma.price).toFixed(2)}
                        </div>
                        {turma.price_online > 0 && (
                          <>
                            <div className="text-xs text-muted-foreground mt-2 mb-1">Online</div>
                            {turma.original_price_online > turma.price_online && (
                              <span className="text-muted-foreground text-xs line-through">
                                R$ {Number(turma.original_price_online).toFixed(2)}
                              </span>
                            )}
                            <div className="text-lg font-bold text-primary">
                              R$ {Number(turma.price_online).toFixed(2)}
                            </div>
                          </>
                        )}
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

          {!loading && filteredTurmas.length === 0 && (
            <div className="text-center py-16">
              <p className="text-xl text-muted-foreground mb-4">
                Nenhuma turma encontrada
              </p>
              <Button onClick={() => { setSearchTerm(''); setSelectedEstado(null); setModeFilter('all'); }}>
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
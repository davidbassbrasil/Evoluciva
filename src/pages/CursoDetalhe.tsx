import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, User, CheckCircle, ShoppingCart, ShoppingBag, Calendar, Users as UsersIcon, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { addToCart, getCurrentUser } from '@/lib/localStorage';
import { useToast } from '@/hooks/use-toast';
import { Course, Turma } from '@/types';
import { FloatingNav } from '@/components/landing/FloatingNav';
import { Footer } from '@/components/landing/Footer';
import supabase from '@/lib/supabaseClient';
import ReactMarkdown from 'react-markdown';

interface Professor {
  id: string;
  name: string;
  specialty: string;
  image: string;
}

export default function CursoDetalhe() {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const turmaIdFromUrl = searchParams.get('turma');
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [selectedTurma, setSelectedTurma] = useState<Turma | null>(null);
  const [selectedModality, setSelectedModality] = useState<'presential' | 'online'>('presential');
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolledTurmaId, setEnrolledTurmaId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadCourse = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Tentar buscar por slug primeiro, depois por ID
        let query = supabase
          .from('courses')
          .select('*')
          .eq('active', true);

        // Verificar se é UUID (id) ou slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId || '');
        
        if (isUUID) {
          query = query.eq('id', courseId);
        } else {
          query = query.eq('slug', courseId);
        }

        const { data, error } = await query.single();

        if (error) throw error;
        setCourse(data);
        
        // Carregar professores vinculados
        const { data: professorLinks } = await supabase
          .from('professor_courses')
          .select('professor_id, professors(id, name, specialty, image)')
          .eq('course_id', data.id);
        
        if (professorLinks && professorLinks.length > 0) {
          const profs = professorLinks
            .map(link => link.professors)
            .filter(Boolean) as Professor[];
          setProfessors(profs);
        }
        
        // Carregar turmas disponíveis para este curso
        const { data: turmasData, error: turmasError } = await supabase
          .from('turmas')
          .select('*')
          .eq('course_id', data.id)
          .in('status', ['active', 'coming_soon'])
          .order('created_at', { ascending: false });
        
        if (!turmasError && turmasData) {
          // Filtrar por datas de venda e acesso
          const now = new Date();
          const availableTurmas = turmasData.filter((turma: any) => {
            // Verificar se a turma já expirou completamente (fim de acesso do aluno)
            if (turma.access_end_date) {
              const accessEndDate = new Date(turma.access_end_date);
              if (now > accessEndDate) return false;
            }
            
            const startDate = turma.sale_start_date ? new Date(turma.sale_start_date) : null;
            const endDate = turma.sale_end_date ? new Date(turma.sale_end_date) : null;
            
            // Se status é coming_soon, sempre mostrar (mas não permitir compra)
            if (turma.status === 'coming_soon') return true;
            
            // Para active, verificar datas de venda
            if (startDate && now < startDate) return false;
            if (endDate && now > endDate) return false;
            
            return true;
          });
          
          setTurmas(availableTurmas);
          
          // Verificar se o aluno está matriculado em alguma turma deste curso
          const currentUser = getCurrentUser();
          if (currentUser?.id) {
            const { data: enrollmentData } = await supabase
              .from('enrollments')
              .select('turma_id, turmas!inner(course_id)')
              .eq('profile_id', currentUser.id);
            
            if (enrollmentData && enrollmentData.length > 0) {
              const enrollment = enrollmentData.find((e: any) => e.turmas?.course_id === data.id);
              if (enrollment) {
                setIsEnrolled(true);
                setEnrolledTurmaId(enrollment.turma_id);
              }
            }
          }
          
          // Selecionar turma da URL ou primeira disponível
          if (turmaIdFromUrl) {
            const turmaFromUrl = availableTurmas.find((t: any) => t.id === turmaIdFromUrl);
            const selectedT = turmaFromUrl || availableTurmas[0] || null;
            setSelectedTurma(selectedT);
            
            // Se vagas presenciais esgotadas e tem online, selecionar online automaticamente
            if (selectedT && selectedT.presential_slots === 0 && selectedT.price_online > 0) {
              setSelectedModality('online');
            }
          } else {
            const selectedT = availableTurmas[0] || null;
            setSelectedTurma(selectedT);
            
            // Se vagas presenciais esgotadas e tem online, selecionar online automaticamente
            if (selectedT && selectedT.presential_slots === 0 && selectedT.price_online > 0) {
              setSelectedModality('online');
            }
          }
        }
      } catch (err: any) {
        console.error('Error loading course:', err);
        setCourse(null);
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId, turmaIdFromUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando curso...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Curso não encontrado</h1>
          <Link to="/cursos">
            <Button>Ver todos os cursos</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Parse whats_included from database (accepts commas or line breaks)
  const benefits = course.whats_included 
    ? course.whats_included
        .split(/[,\n]/) // Split by comma or newline
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^[•\-*]\s*/, '')) // Remove bullets if present
    : [
        "Acesso ao conteúdo do curso",
        "Certificado de conclusão",
        "Suporte com o professor",
        "Material complementar"
      ];

  const modules = [
    { title: "Módulo 1 - Introdução e Fundamentos", lessons: 8 },
    { title: "Módulo 2 - Conceitos Intermediários", lessons: 12 },
    { title: "Módulo 3 - Tópicos Avançados", lessons: 10 },
    { title: "Módulo 4 - Exercícios e Simulados", lessons: 15 },
    { title: "Módulo 5 - Revisão Final", lessons: 6 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <FloatingNav />
      
      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <Link to="/cursos" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para cursos
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Course Header */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  {course.title}
                </h1>
                <p className="text-lg text-muted-foreground mb-6">
                  {course.description}
                </p>
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {course.instructor}
                  </div>
                </div>
              </div>

              {/* Professor Cards */}
              {professors.length > 0 && (
                <div className="bg-card rounded-2xl p-4 border border-border/50">
                  <div className="flex flex-wrap gap-4">
                    {professors.map((prof) => (
                      <div key={prof.id} className="flex items-center gap-3">
                        <img 
                          src={prof.image} 
                          alt={prof.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                        />
                        <div>
                          <h3 className="font-semibold text-sm">{prof.name}</h3>
                          <p className="text-xs text-muted-foreground">{prof.specialty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Course Image */}
              <div className="aspect-[3/4] rounded-2xl overflow-hidden">
                <img 
                  src={course.image} 
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* About Course */}
              <div className="bg-card rounded-2xl p-6 border border-border/50">
                <h2 className="text-2xl font-bold mb-4">Sobre o Curso</h2>
                <div className="prose prose-neutral dark:prose-invert max-w-none">
                  {course.full_description ? (
                    <div className="text-muted-foreground markdown-content">
                      <ReactMarkdown>{course.full_description}</ReactMarkdown>
                    </div>
                  ) : (
                    <>
                      <p className="text-muted-foreground mb-4">
                        {course.description}
                      </p>
                      <p className="text-muted-foreground mb-4">
                        O professor {course.instructor} traz anos de experiência na preparação de candidatos, com um método didático que facilita o aprendizado mesmo dos temas mais complexos. As aulas são objetivas e focadas no que realmente cai nas provas.
                      </p>
                      <p className="text-muted-foreground">
                        Além das videoaulas, você terá acesso a material de apoio em PDF, exercícios comentados, simulados exclusivos e acesso à comunidade de alunos para tirar dúvidas e trocar experiências.
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Benefits */}
              <div className="bg-card rounded-2xl p-6 border border-border/50">
                <h2 className="text-2xl font-bold mb-6">O que está incluso</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar - Purchase Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-32 bg-card rounded-2xl p-6 border border-border/50 shadow-lg">
                <div className="aspect-[3/4] rounded-xl overflow-hidden mb-6">
                  <img 
                    src={course.image} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="mb-6">
                  {selectedTurma && selectedTurma.original_price > selectedTurma.price && selectedModality === 'presential' && (
                    <span className="text-sm text-muted-foreground line-through block mb-1">
                      De R$ {Number(selectedTurma.original_price).toFixed(2)}
                    </span>
                  )}
                  {selectedTurma && selectedTurma.original_price_online > selectedTurma.price_online && selectedModality === 'online' && (
                    <span className="text-sm text-muted-foreground line-through block mb-1">
                      De R$ {Number(selectedTurma.original_price_online).toFixed(2)}
                    </span>
                  )}
                  <div className="text-3xl font-bold text-primary">
                    R$ {
                      selectedTurma 
                        ? (selectedModality === 'online' 
                            ? Number(selectedTurma.price_online).toFixed(2) 
                            : Number(selectedTurma.price).toFixed(2)
                          )
                        : Number(course.price || 0).toFixed(2)
                    }
                  </div>
                  {selectedTurma?.allow_installments && selectedModality === 'presential' && (
                    <p className="text-sm text-muted-foreground mt-1">
                      ou até {selectedTurma.max_installments}x de R$ {(Number(selectedTurma.price) / selectedTurma.max_installments).toFixed(2)}
                    </p>
                  )}
                </div>

                {/* Seleção de Turma */}
                {turmas.length > 0 && (
                  <div className="mb-6 pb-6 border-b border-border">
                    <label className="text-sm font-medium mb-2 block">Turma Disponível</label>
                    <div className="space-y-2">
                      {turmas.map((turma) => {
                        const isComingSoon = turma.status === 'coming_soon';
                        
                        return (
                          <button
                            key={turma.id}
                            onClick={() => {
                              if (!isComingSoon) {
                                setSelectedTurma(turma);
                                // Se vagas presenciais esgotadas e tem online, selecionar online
                                if (turma.presential_slots === 0 && turma.price_online > 0) {
                                  setSelectedModality('online');
                                } else {
                                  setSelectedModality('presential');
                                }
                              }
                            }}
                            disabled={isComingSoon}
                            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                              selectedTurma?.id === turma.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            } ${isComingSoon ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-sm">{turma.name}</span>
                              {isComingSoon && (
                                <Badge className="bg-orange-500 text-xs">Em Breve</Badge>
                              )}
                            </div>
                            {turma.start_date && (
                              <div className="text-xs text-primary font-medium mb-2 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Início: {new Date(turma.start_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Presencial:</span>{' '}
                                <span className="font-bold text-primary">
                                  R$ {Number(turma.price).toFixed(2)}
                                </span>
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
                              {turma.price_online > 0 && (
                                <div>
                                  <span className="font-medium">Online:</span>{' '}
                                  <span className="font-bold text-primary">
                                    R$ {Number(turma.price_online).toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Seleção de Modalidade */}
                {selectedTurma && (
                  <div className="mb-6 pb-6 border-b border-border">
                    <Label className="text-sm font-medium mb-3 block">Modalidade</Label>
                    <RadioGroup value={selectedModality} onValueChange={(value) => setSelectedModality(value as 'presential' | 'online')}>
                      <div className={`flex items-center space-x-2 p-3 rounded-lg border border-border transition-all ${
                        selectedTurma.presential_slots === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary cursor-pointer'
                      }`}>
                        <RadioGroupItem value="presential" id="presential" disabled={selectedTurma.presential_slots === 0} />
                        <Label htmlFor="presential" className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Presencial</span>
                            {selectedTurma.presential_slots > 0 && (
                              <Badge variant={selectedTurma.presential_slots <= 5 ? "destructive" : "secondary"} className="text-xs">
                                {selectedTurma.presential_slots} {selectedTurma.presential_slots === 1 ? 'vaga' : 'vagas'}
                              </Badge>
                            )}
                            {selectedTurma.presential_slots === 0 && (
                              <Badge variant="destructive" className="text-xs">
                                Esgotado
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            R$ {Number(selectedTurma.price).toFixed(2)}
                            {selectedTurma.allow_installments && (
                              <span> ou até {selectedTurma.max_installments}x</span>
                            )}
                          </div>
                        </Label>
                      </div>
                      {selectedTurma.price_online > 0 && (
                        <div className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:border-primary transition-all">
                          <RadioGroupItem value="online" id="online" />
                          <Label htmlFor="online" className="flex-1 cursor-pointer">
                            <div className="font-medium">Online</div>
                            <div className="text-sm text-muted-foreground">
                              R$ {Number(selectedTurma.price_online).toFixed(2)}
                            </div>
                          </Label>
                        </div>
                      )}
                    </RadioGroup>
                  </div>
                )}

                <div className="space-y-3">
                  {isEnrolled && enrolledTurmaId ? (
                    <Button
                      onClick={() => navigate(`/aluno/curso/${enrolledTurmaId}`)}
                      className="w-full gradient-bg text-primary-foreground shadow-glow hover:opacity-90 h-12 text-lg"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      Estudar agora
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        if (!selectedTurma) {
                          toast({ 
                            title: 'Selecione uma turma', 
                            description: 'Escolha uma turma disponível.',
                            variant: 'destructive'
                          });
                          return;
                        }
                        
                        if (selectedTurma.status === 'coming_soon') {
                          toast({ 
                            title: 'Turma em breve', 
                            description: 'As inscrições ainda não foram abertas.',
                            variant: 'destructive'
                          });
                          return;
                        }
                        
                        if (selectedModality === 'presential' && selectedTurma.presential_slots === 0) {
                          toast({ 
                            title: 'Vagas esgotadas', 
                            description: 'As vagas presenciais para esta turma estão esgotadas. Selecione a modalidade online.',
                            variant: 'destructive'
                          });
                          return;
                        }
                        
                        const currentUser = getCurrentUser();
                        if (!currentUser) {
                          toast({ 
                            title: 'Faça login', 
                            description: 'Você precisa estar logado para adicionar cursos ao carrinho.',
                            variant: 'destructive'
                          });
                          sessionStorage.setItem('checkout_return_path', window.location.pathname);
                          navigate('/aluno/login');
                          return;
                        }
                        
                        // Salvar no localStorage como "courseId:turmaId:modality"
                        addToCart(`${course.id}:${selectedTurma.id}:${selectedModality}`);
                        toast({ 
                          title: 'Adicionado ao carrinho', 
                          description: `${course.title} - ${selectedTurma.name} (${selectedModality === 'online' ? 'Online' : 'Presencial'})` 
                        });
                      }}
                      className="w-full gradient-bg text-primary-foreground shadow-glow hover:opacity-90 h-12 text-lg"
                      disabled={!selectedTurma || selectedTurma.status === 'coming_soon'}
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Adicionar ao carrinho
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="w-full h-12 text-lg"
                    onClick={() => {
                      const currentUser = getCurrentUser();
                      if (!currentUser) {
                        toast({ 
                          title: 'Faça login', 
                          description: 'Você precisa estar logado para acessar o carrinho.',
                          variant: 'destructive'
                        });
                        sessionStorage.setItem('checkout_return_path', '/cart');
                        navigate('/aluno/login');
                        return;
                      }
                      navigate('/cart');
                    }}
                  >
                    <ShoppingBag className="w-5 h-5 mr-2" />
                    Ir para o carrinho
                  </Button>
                </div>

                <div className="mt-6 pt-6 border-t border-border space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Pagamento seguro
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Garantia de 7 dias
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Acesso garantido
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
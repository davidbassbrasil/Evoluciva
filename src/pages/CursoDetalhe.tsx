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
import { SEOHead, seoHelpers } from '@/components/SEOHead';
import { Breadcrumb } from '@/components/Breadcrumb';
import { getCourseSchema, getOrganizationSchema, injectSchema } from '@/lib/schemas';
import { formatSessions, DAY_LABELS } from '@/lib/schedules';
import { formatBRDateTime, formatBRDate, todayKeyBR } from '@/lib/dates';

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
  const [precoOpcional, setPrecoOpcional] = useState<any | null>(null);
  const [precoMap, setPrecoMap] = useState<Record<string, { presential?: any; online?: any }>>({});
  const { toast } = useToast();

  // SEO - Schemas e meta tags (DEVE estar ANTES de qualquer return condicional!)
  useEffect(() => {
    if (course && selectedTurma) {
      // Injetar schemas
      const orgSchema = getOrganizationSchema();
      injectSchema(orgSchema);

      const courseSchema = getCourseSchema({
        id: course.id,
        name: course.title,
        description: course.description,
        price: selectedTurma.price,
        priceOnline: selectedTurma.price_online,
        instructor: course.instructor,
        image: course.image,
        estado: course.estado
      });
      injectSchema(courseSchema);
    }
  }, [course, selectedTurma]);

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
          // professorLinks may contain 'professors' as an object or an array depending on the join.
          const profs = professorLinks
            .flatMap((link: any) => link.professors ? (Array.isArray(link.professors) ? link.professors : [link.professors]) : [])
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
          
          // Ordenar turmas: 1) pela data de início (`start_date`) mais antiga primeiro
          // 2) se igual ou ausente, usar `created_at` (turma "raiz"/mais antiga primeiro)
          availableTurmas.sort((a: any, b: any) => {
            const aStart = a.start_date ? new Date(a.start_date).getTime() : Infinity;
            const bStart = b.start_date ? new Date(b.start_date).getTime() : Infinity;
            if (aStart !== bStart) return aStart - bStart;

            const aCreated = a.created_at ? new Date(a.created_at).getTime() : Infinity;
            const bCreated = b.created_at ? new Date(b.created_at).getTime() : Infinity;
            return aCreated - bCreated;
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

  // Carregar preço opcional vigente sempre que a turma selecionada ou modalidade mudar
  useEffect(() => {
    const loadPrecoOpcional = async (turmaId: string, channel: string) => {
      try {
        const today = todayKeyBR();
        const { data, error } = await supabase
          .from('turma_precos_opcionais')
          .select('*')
          .eq('turma_id', turmaId)
          .gte('expires_at', today)
          .in('channel', ['both', channel])
          .order('expires_at', { ascending: true })
          .limit(1);

        if (error) throw error;
        setPrecoOpcional((data && data.length > 0) ? data[0] : null);
      } catch (err: any) {
        console.error('Erro ao buscar preço opcional:', err);
        setPrecoOpcional(null);
      }
    };

    if (selectedTurma) {
      loadPrecoOpcional(selectedTurma.id, selectedModality);
    } else {
      setPrecoOpcional(null);
    }
  }, [selectedTurma, selectedModality]);

  // Carregar preços opcionais para todas as turmas listadas (para mostrar na lista)
  useEffect(() => {
    const loadPrecosForTurmas = async () => {
      if (!turmas || turmas.length === 0) {
        setPrecoMap({});
        return;
      }

      try {
        const turmaIds = turmas.map(t => t.id);
        const today = todayKeyBR();
        const { data, error } = await supabase
          .from('turma_precos_opcionais')
          .select('*')
          .in('turma_id', turmaIds)
          .gte('expires_at', today)
          .order('expires_at', { ascending: true });

        if (error) throw error;

        const map: Record<string, { presential?: any; online?: any }> = {};
        (data || []).forEach((p: any) => {
          const id = p.turma_id;
          if (!map[id]) map[id] = {};
          if (p.channel === 'both') {
            if (!map[id].presential) map[id].presential = p;
            if (!map[id].online) map[id].online = p;
          } else if (p.channel === 'presential') {
            if (!map[id].presential) map[id].presential = p;
          } else if (p.channel === 'online') {
            if (!map[id].online) map[id].online = p;
          }
        });

        setPrecoMap(map);
      } catch (err: any) {
        console.error('Erro ao carregar preços opcionais para turmas:', err);
        setPrecoMap({});
      }
    };

    loadPrecosForTurmas();
  }, [turmas]);

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

  const renderMedia = (link?: string) => {
    if (!link) return null;
    // YouTube
    const yt = link.match(/(?:youtube\.com.*v=|youtu\.be\/)([\w-_-]+)/i);
    if (yt && yt[1]) {
      const id = yt[1];
      return (
        <div className="aspect-video rounded-2xl overflow-hidden">
          <iframe
            title="Vídeo do curso"
            src={`https://www.youtube.com/embed/${id}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      );
    }

    // Arquivo de vídeo direto (mp4/webm)
    if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(link)) {
      return (
        <div className="aspect-video rounded-2xl overflow-hidden bg-black">
          <video controls src={link} className="w-full h-full object-cover" />
        </div>
      );
    }

    // Fallback - tentar embutir em iframe
    return (
      <div className="aspect-video rounded-2xl overflow-hidden">
        <iframe
          title="Vídeo do curso"
          src={link}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  };

  // Gerar título e descrição SEO
  const seoTitle = course 
    ? seoHelpers.generateTitle(`${course.title} | Preparatório para Concurso`) 
    : 'Curso';
  const seoDescription = course
    ? seoHelpers.generateDescription(`${seoHelpers.stripHtml(course.description)} Curso preparatório completo com ${course.instructor}. Modalidades presencial em Maceió e online para todo Brasil. Matricule-se agora!`)
    : 'Curso preparatório para concursos públicos';

  // Preços efetivos (evita flicker): prioridade precoMap -> precoOpcional -> turma
  const selectedId = selectedTurma?.id;
  const mapEntry = selectedId ? precoMap[selectedId] : undefined;
  const effectivePresential = (mapEntry?.presential?.price !== undefined)
    ? Number(mapEntry!.presential.price)
    : (precoOpcional && (precoOpcional.channel === 'both' || precoOpcional.channel === 'presential') ? Number(precoOpcional.price) : Number(selectedTurma?.price ?? course?.price ?? 0));
  const effectiveOnline = (mapEntry?.online?.price !== undefined)
    ? Number(mapEntry!.online.price)
    : (precoOpcional && (precoOpcional.channel === 'both' || precoOpcional.channel === 'online') ? Number(precoOpcional.price) : Number(selectedTurma?.price_online ?? course?.price ?? 0));
  const effectiveDisplayed = selectedTurma ? (selectedModality === 'online' ? effectiveOnline : effectivePresential) : Number(course?.price ?? 0);

  return (
    <>
      {course && (
        <SEOHead
          title={seoTitle}
          description={seoDescription}
          keywords={`${course.title}, curso ${course.title}, preparatório ${course.title}, ${course.instructor}, curso concurso ${course.estado || 'Brasil'}`}
          image={course.image}
          type="website"
        />
      )}
      <div className="min-h-screen bg-background">
        <FloatingNav />
        
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            {/* Breadcrumb */}
            {course && (
              <Breadcrumb 
                items={[
                  { label: 'Cursos', href: '/cursos' },
                  { label: course.title }
                ]}
                className="mb-8"
              />
            )}

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
                  {professors.length === 0 && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {course.instructor}
                    </div>
                  )}
                </div>
              </div>
 

              {/* Course Media: vídeo (se houver) ou imagem */}
              {course.link_video ? (
                renderMedia(course.link_video)
              ) : (
                <div className="aspect-[3/4] rounded-2xl overflow-hidden">
                  <img 
                    src={course.image} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

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

              {/* Professores + Instrutor (moved) */}
              {professors.length > 0 && (
                <div className="bg-card rounded-2xl p-4 border border-border/50">
                  <div className="flex items-center gap-3 mb-4">
                    <User className="w-5 h-5" />
                    <span className="font-medium">{course.instructor}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {professors.map((prof) => (
                      <div key={prof.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/5">
                        <img 
                          src={prof.image} 
                          alt={prof.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                        />
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm truncate">{prof.name}</h3>
                          <p className="text-xs text-muted-foreground truncate">{prof.specialty}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                        {selectedTurma && !precoOpcional && selectedTurma.original_price > selectedTurma.price && selectedModality === 'presential' && (
                    <span className="text-sm text-muted-foreground line-through block mb-1">
                      De R$ {Number(selectedTurma.original_price).toFixed(2)}
                    </span>
                  )}
                        {selectedTurma && !precoOpcional && selectedTurma.original_price_online > selectedTurma.price_online && selectedModality === 'online' && (
                    <span className="text-sm text-muted-foreground line-through block mb-1">
                      De R$ {Number(selectedTurma.original_price_online).toFixed(2)}
                    </span>
                  )}
                        <div>
                          {/* label: prefer mapEntry label (per-channel) then precoOpcional.label */}
                          {((mapEntry && ((selectedModality === 'presential' && mapEntry.presential) || (selectedModality === 'online' && mapEntry.online)))?.label || precoOpcional?.label) && (
                            <div className="text-sm text-muted-foreground mb-1">{((mapEntry && ((selectedModality === 'presential' && mapEntry.presential) || (selectedModality === 'online' && mapEntry.online)))?.label) || precoOpcional?.label}</div>
                          )}
                          <div className="text-3xl font-bold text-primary">R$ {effectiveDisplayed.toFixed(2)}</div>
                        </div>
                        {selectedTurma?.allow_installments && (
                          <p className="text-sm text-muted-foreground mt-1">
                            ou até {selectedTurma.max_installments}x de R$ {(effectiveDisplayed / selectedTurma.max_installments).toFixed(2)}
                          </p>
                        )}
                        {selectedTurma && selectedTurma.sessions && selectedTurma.sessions.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            <span className="flex gap-2 items-center">
                              {selectedTurma.sessions.map((s: any, i: number) => (
                                <span key={i} className="mr-2">
                                  <strong className="font-semibold">{DAY_LABELS[s.day] || s.day}</strong>{' '}
                                  <strong className="font-semibold">{s.start}{s.end ? '–' + s.end : ''}</strong>
                                  {i < (selectedTurma.sessions.length - 1) ? ', ' : ''}
                                </span>
                              ))}
                            </span>
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
                                  Início: {formatBRDate(turma.start_date)}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Presencial:</span>{' '}
                                <span className="font-bold text-primary">
                                  R$ {precoMap[turma.id] && precoMap[turma.id].presential ? Number(precoMap[turma.id].presential.price).toFixed(2) : Number(turma.price).toFixed(2)}
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
                                    R$ {precoMap[turma.id] && precoMap[turma.id].online ? Number(precoMap[turma.id].online.price).toFixed(2) : Number(turma.price_online).toFixed(2)}
                                  </span>
                                </div>
                              )}
                              {turma.sessions && turma.sessions.length > 0 && (
                                <div className="text-xs text-muted-foreground mt-2">
                                  {turma.sessions.map((s: any, i: number) => (
                                    <span key={i} className="mr-2">
                                      <strong className="font-semibold">{DAY_LABELS[s.day] || s.day}</strong>{' '}
                                      <strong className="font-semibold">{s.start}{s.end ? '–' + s.end : ''}</strong>
                                      {i < (turma.sessions.length - 1) ? ', ' : ''}
                                    </span>
                                  ))}
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
                            R$ {effectivePresential.toFixed(2)}
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
                              R$ {effectiveOnline.toFixed(2)}
                              {selectedTurma.allow_installments && (
                                <span> ou até {selectedTurma.max_installments}x</span>
                              )}
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
                    Garantia de 15 dias
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
    </>
  );
}
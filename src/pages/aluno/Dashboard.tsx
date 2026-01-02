import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Play, Clock, BookOpen, Settings, LogOut, ChevronRight, ChevronLeft, CheckCircle, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoPng from '@/assets/logo_.png';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getCurrentUser, logout, getPreviewStudentId, clearPreviewStudentId } from '@/lib/localStorage';
import { exitPreviewAndCloseWindow } from '@/lib/previewUtils';
import supabase from '@/lib/supabaseClient';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';

interface EnrolledTurma {
  id: string;
  turma_id: string;
  turma_name: string;
  course_id: string;
  course_title: string;
  course_image: string;
  total_lessons: number;
  completed_lessons: number;
  progress: number;
  lesson_live?: string;
}

interface Course {
  id: string;
  title: string;
  slug?: string;
  image?: string;
  price?: number;
}

export default function AlunoDashboard() {
  const [userName, setUserName] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [enrolledTurmas, setEnrolledTurmas] = useState<EnrolledTurma[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const enrolledScrollRef = useRef<HTMLDivElement | null>(null);
  const recommendedScrollRef = useRef<HTMLDivElement | null>(null);
  const [enrolledIndex, setEnrolledIndex] = useState(0);
  const [recommendedIndex, setRecommendedIndex] = useState(0);
  const [showEnrolledArrows, setShowEnrolledArrows] = useState(false);
  const [showRecommendedArrows, setShowRecommendedArrows] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      const previewId = getPreviewStudentId();
      const currentUser = getCurrentUser();

      // If preview mode active, show as that student (admin still authenticated)
      if (previewId) {
        setUserId(previewId);
      } else {
        if (!currentUser) {
          navigate('/aluno/login');
          return;
        }
        setUserId(currentUser.id);
      }
      
      // Try to fetch full profile data from Supabase
      try {
        const idToFetch = getPreviewStudentId() || currentUser?.id;
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', idToFetch)
          .single();

        setUserName(profile?.full_name || currentUser?.name || 'Aluno');
      } catch (e) {
        setUserName(currentUser?.name || 'Aluno');
      }

      // Load enrolled turmas with progress
      try {
        const idToUse = previewId || currentUser?.id || '';
        const { data: enrollments, error } = await supabase
          .from('enrollments')
          .select(`
            id,
            turma_id,
            access_expires_at,
            turmas (
              id,
              name,
              course_id,
              lesson_live,
              access_end_date,
              courses (
                id,
                title,
                image
              )
            )
          `)
          .eq('profile_id', idToUse);

        if (error) throw error;

        if (enrollments && enrollments.length > 0) {
          // Filtrar turmas com acesso expirado
          const now = new Date();
          const activeEnrollments = enrollments.filter((enrollment: any) => {
            const turma = enrollment.turmas;
            
            // Verificar se a turma tem data de fim de acesso
            if (turma?.access_end_date) {
              const accessEndDate = new Date(turma.access_end_date);
              if (now > accessEndDate) {
                return false; // Acesso expirado pela turma
              }
            }
            
            // Verificar se o enrollment tem data de expiração individual
            if (enrollment.access_expires_at) {
              const expiresAt = new Date(enrollment.access_expires_at);
              if (now > expiresAt) {
                return false; // Acesso expirado pelo enrollment
              }
            }
            
            return true;
          });

          // ✨ OTIMIZAÇÃO: Buscar TODAS lessons e progress de uma vez (não por turma)
          const turmaIds = activeEnrollments.map((e: any) => e.turma_id);
          
          const [lessonsResult, progressResult] = await Promise.all([
            // Buscar todas as lessons de todas as turmas do aluno de uma vez
            supabase
              .from('lessons')
              .select('id, turma_id')
              .in('turma_id', turmaIds),
            
            // Buscar todo o progresso do aluno de uma vez
            supabase
              .from('lesson_progress')
              .select('lesson_id, completed')
              .eq('profile_id', idToUse)
              .eq('completed', true)
          ]);

          const allLessons = lessonsResult.data || [];
          const allProgress = progressResult.data || [];
          const completedLessonIds = new Set(allProgress.map(p => p.lesson_id));
          
          // Agrupar lessons por turma_id
          const lessonsByTurma: Record<string, string[]> = {};
          allLessons.forEach(lesson => {
            if (!lessonsByTurma[lesson.turma_id]) {
              lessonsByTurma[lesson.turma_id] = [];
            }
            lessonsByTurma[lesson.turma_id].push(lesson.id);
          });

          // Calcular progresso para cada turma (sem queries adicionais)
          const turmasWithProgress = activeEnrollments.map((enrollment: any) => {
            const turma = enrollment.turmas;
            const course = turma?.courses;
            
            const lessonIds = lessonsByTurma[enrollment.turma_id] || [];
            const totalLessons = lessonIds.length;
            const completedLessons = lessonIds.filter(id => completedLessonIds.has(id)).length;
            const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
            
            return {
              id: enrollment.id,
              turma_id: enrollment.turma_id,
              turma_name: turma?.name || 'Turma',
              course_id: course?.id || '',
              course_title: course?.title || 'Curso',
              course_image: course?.image || '/placeholder.jpg',
              total_lessons: totalLessons,
              completed_lessons: completedLessons,
              progress,
              lesson_live: turma?.lesson_live
            };
          });
          
          setEnrolledTurmas(turmasWithProgress);
        }

        // ✨ OTIMIZAÇÃO: Buscar cursos + turmas em paralelo + limitar a 10 recomendações
        const [coursesResult, turmasResult] = await Promise.all([
          supabase
            .from('courses')
            .select('id, title, slug, image')
            .eq('active', true)
            .order('display_order', { ascending: true, nullsFirst: false })
            .order('title', { ascending: true })
            .limit(10),
          
          supabase
            .from('turmas')
            .select('course_id, price, access_end_date, sale_start_date, sale_end_date')
            .eq('status', 'active')
        ]);

        if (coursesResult.data && turmasResult.data) {
          const now = new Date();
          
          // Filtrar turmas válidas (não expiradas e dentro do período de vendas)
          const validTurmas = turmasResult.data.filter((t) => {
            if (t.access_end_date && now > new Date(t.access_end_date)) return false;
            if (t.sale_start_date && now < new Date(t.sale_start_date)) return false;
            if (t.sale_end_date && now > new Date(t.sale_end_date)) return false;
            return true;
          });

          const coursesWithPrices = coursesResult.data.map((course) => {
            const courseTurmas = validTurmas.filter((t) => t.course_id === course.id);
            let minPrice = 0;
            if (courseTurmas.length > 0) {
              const prices = courseTurmas
                .map((t) => Number(t.price))
                .filter((p) => p > 0);
              minPrice = prices.length > 0 ? Math.min(...prices) : 0;
            }
            return { ...course, price: minPrice };
          });

          // Filtrar apenas cursos que têm turmas válidas disponíveis
          const availableCourses = coursesWithPrices.filter(c => c.price > 0);
          setAllCourses(availableCourses);
        }
      } catch (err) {
        console.error('Error loading enrollments:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  const isPreview = Boolean(getPreviewStudentId());

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Sync enrolled carousel index on scroll (use measured card width and proper bounds)
  useEffect(() => {
    const container = enrolledScrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const first = container.querySelector('.snap-start') as HTMLElement | null;
      const cardWidth = first?.offsetWidth || 320;
      const index = Math.round(container.scrollLeft / cardWidth);
      const maxIndex = Math.max(0, enrolledTurmas.length - 1);
      const clamped = Math.max(0, Math.min(index, maxIndex));
      setEnrolledIndex(clamped);
    };

    container.addEventListener('scroll', handleScroll);
    try { container.scrollTo({ left: 0 }); } catch (e) {}
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [enrolledTurmas.length]);

  // Show/hide enrolled arrows depending on visible columns
  useEffect(() => {
    const container = enrolledScrollRef.current;
    const update = () => {
      if (!container) {
        setShowEnrolledArrows(false);
        return;
      }
      const first = container.querySelector('.snap-start') as HTMLElement | null;
      const cardWidth = first?.offsetWidth || 320;
      const visible = Math.max(1, Math.floor(container.clientWidth / cardWidth));
      setShowEnrolledArrows(enrolledTurmas.length > visible);
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [enrolledTurmas.length]);

  // Sync recommended carousel index on scroll (use measured card width and correct max index)
  useEffect(() => {
    const container = recommendedScrollRef.current;
    if (!container) return;

    const filtered = allCourses.filter((c) => !enrolledTurmas.some(t => t.course_id === c.id)).slice(0, 5);
    const count = Math.min(5, filtered.length) + 1; // +1 for 'Explorar Mais'

    const handleScroll = () => {
      const first = container.querySelector('.snap-start') as HTMLElement | null;
      const cardWidth = first?.offsetWidth || 320;
      const index = Math.round(container.scrollLeft / cardWidth);
      const maxIndex = Math.max(0, count - 1);
      const clamped = Math.max(0, Math.min(index, maxIndex));
      setRecommendedIndex(clamped);
    };

    container.addEventListener('scroll', handleScroll);
    try { container.scrollTo({ left: 0 }); } catch (e) {}
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [allCourses.length, enrolledTurmas.length]);

  // Show/hide recommended arrows depending on visible columns
  useEffect(() => {
    const container = recommendedScrollRef.current;
    const update = () => {
      if (!container) {
        setShowRecommendedArrows(false);
        return;
      }
      const filtered = allCourses.filter((c) => !enrolledTurmas.some(t => t.course_id === c.id));
      const count = Math.min(5, filtered.length) + 1; // +1 for 'Explorar Mais' card
      const first = container.querySelector('.snap-start') as HTMLElement | null;
      const cardWidth = first?.offsetWidth || 320;
      const visible = Math.max(1, Math.floor(container.clientWidth / cardWidth));
      setShowRecommendedArrows(count > visible);
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [allCourses.length, enrolledTurmas.length]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {isPreview && (
        <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-900 py-2 px-4 text-sm flex items-center justify-between">
          <div>Visualizando como aluno — <strong>MODO ADMIN</strong></div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { clearPreviewStudentId(); exitPreviewAndCloseWindow(); }}>Sair do modo visualização</Button>
          </div>
        </div>
      )}
      <header className="bg-foreground text-primary-foreground py-4 px-6 sticky top-0 z-50">
        <div className="w-full md:container md:mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoPng} alt="Logo" className="h-10" />
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm hidden md:block">Olá, {userName.split(' ')[0]}</span>
            <Link to="/aluno/configuracoes">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold mb-2">
            Bem-vindo, <span className="gradient-text">{userName.split(' ')[0]}</span>!
          </h1>
          <p className="text-muted-foreground">
            Continue de onde parou e alcance sua aprovação.
          </p>
        </div>

        {/* My Courses */}
        <section className="mb-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-3">
            <h2 className="text-2xl font-bold">Minhas Turmas</h2>
            {enrolledTurmas.some(t => t.lesson_live) && (
              <div className="flex flex-wrap items-center gap-2">
                {enrolledTurmas.filter(t => t.lesson_live).map((turma) => (
                  <a
                    key={turma.turma_id}
                    href={turma.lesson_live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full sm:inline-block sm:w-auto"
                  >
                    <Button className="bg-red-600 text-white animate-pulse shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto justify-center text-sm md:text-base whitespace-nowrap">
                      <Video className="w-4 h-4 mr-2" />
                      Aula ao Vivo - {turma.turma_name}
                    </Button>
                  </a>
                ))}
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : enrolledTurmas.length === 0 ? (
            <div className="bg-card rounded-2xl p-10 text-center border border-border/50">
              <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">Nenhuma turma matriculada</h3>
              <p className="text-muted-foreground mb-6">
                Entre em contato para se matricular em uma turma!
              </p>
              <Link to="/cursos">
                <Button className="gradient-bg text-primary-foreground">
                  Ver Cursos Disponíveis
                </Button>
              </Link>
            </div>
          ) : (
            <div className="relative">
              {showEnrolledArrows && (
                <button
                  onClick={() => {
                    if (!enrolledScrollRef.current) return;
                    enrolledScrollRef.current.scrollBy({ left: -400, behavior: 'smooth' });
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-card shadow-lg hidden md:flex items-center justify-center -translate-x-1/2"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {showEnrolledArrows && (
                <button
                  onClick={() => {
                    if (!enrolledScrollRef.current) return;
                    enrolledScrollRef.current.scrollBy({ left: 400, behavior: 'smooth' });
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-card shadow-lg hidden md:flex items-center justify-center translate-x-1/2"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              <div
                ref={enrolledScrollRef}
                className="flex flex-row gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 pl-4 md:pl-6 pr-4 md:pr-6"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {enrolledTurmas.map((turma) => (
                  <div key={turma.id} className="flex-shrink-0 w-[320px] md:w-[380px] snap-start">
                    <div className="group bg-card rounded-2xl overflow-hidden border border-border/50 hover:shadow-xl transition-all duration-300 hover-lift">
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <img src={turma.course_image} alt={turma.course_title} className="w-full h-full object-cover" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <Badge className="mb-2 bg-primary/80">{turma.turma_name}</Badge>
                          <h3 className="text-white font-bold line-clamp-1 drop-shadow-md">{turma.course_title}</h3>
                        </div>
                        <Link to={`/aluno/curso/${turma.turma_id}`} className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center shadow-glow">
                            <Play className="w-8 h-8 text-primary-foreground ml-1" />
                          </div>
                        </Link>
                      </div>

                      <div className="p-5">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {turma.total_lessons} {turma.total_lessons === 1 ? 'aula' : 'aulas'}
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            {turma.completed_lessons} concluídas
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-semibold">{turma.progress}%</span>
                          </div>
                          <Progress value={turma.progress} className="h-2" />
                        </div>

                        <Link to={`/aluno/curso/${turma.turma_id}`}>
                          <Button className="w-full gradient-bg text-primary-foreground">
                            {turma.progress > 0 ? 'Continuar' : 'Começar'}
                            <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bolinhas indicadoras para mobile */}
              {enrolledTurmas.length > 0 && (
                <div className="mt-2 flex items-center justify-center gap-1 md:hidden">
                  <div className="flex gap-1">
                    {[...Array(enrolledTurmas.length)].map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (!enrolledScrollRef.current) return;
                          const first = enrolledScrollRef.current.querySelector('.snap-start') as HTMLElement | null;
                          const cardWidth = first?.offsetWidth || 320;
                          enrolledScrollRef.current.scrollTo({ left: cardWidth * index, behavior: 'smooth' });
                        }}
                        className={`w-2 h-2 rounded-full transition-all ${index === enrolledIndex ? 'bg-primary w-4' : 'bg-primary/30'}`}
                      />
                    ))} 
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Recommended Courses */}
        {enrolledTurmas.length < allCourses.length && allCourses.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Cursos Recomendados</h2>

            <div className="relative">
              {showRecommendedArrows && (
                <button
                  onClick={() => {
                    if (!recommendedScrollRef.current) return;
                    recommendedScrollRef.current.scrollBy({ left: -400, behavior: 'smooth' });
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-card shadow-lg hidden md:flex items-center justify-center -translate-x-1/2"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}

              {showRecommendedArrows && (
                <button
                  onClick={() => {
                    if (!recommendedScrollRef.current) return;
                    recommendedScrollRef.current.scrollBy({ left: 400, behavior: 'smooth' });
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-card shadow-lg hidden md:flex items-center justify-center translate-x-1/2"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              <div
                ref={recommendedScrollRef}
                className="flex flex-row gap-6 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4 pl-4 md:pl-6 pr-4 md:pr-6"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {allCourses
                  .filter((c) => !enrolledTurmas.some(t => t.course_id === c.id))
                  .slice(0, 5)
                  .map((course) => (
                    <div key={course.id} className="flex-shrink-0 w-[320px] md:w-[380px] snap-start">
                      <div className="bg-card rounded-xl overflow-hidden border border-border/50 hover:shadow-lg transition-all group">
                        <div className="relative aspect-[3/4] overflow-hidden">
                          <img src={course.image || '/placeholder.jpg'} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-sm line-clamp-2 mb-2">{course.title}</h4>
                          <div className="flex items-center justify-between">
                         {/*}   <span className="text-primary font-bold">R$ {Number(course.price || 0).toFixed(2)}</span> */}
                            <Link to={`/curso/${course.slug || course.id}`}>
                              <Button size="sm" className="gradient-bg text-primary-foreground shadow-glow hover:opacity-90">
                                Ver mais
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                {/* Card explorar mais cursos */}
                <div className="flex-shrink-0 w-[320px] md:w-[380px] snap-start">
                  <Link to="/cursos" className="block h-full">
                    <div className="group bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover-lift border-2 border-primary/10 hover:border-primary/50 h-full flex flex-col items-center justify-center p-8 min-h-[280px]">
                      <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                          <ChevronRight className="w-10 h-10 text-primary" />
                        </div>
                        <h3 className="font-bold text-2xl mb-4 group-hover:text-primary transition-colors">Explorar Mais Cursos</h3>
                        <p className="text-muted-foreground mb-6">Descubra todos os nossos cursos e escolha o melhor para sua aprovação!</p>
                        <Button className="gradient-bg text-primary-foreground shadow-glow hover:opacity-90">Explorar Todos</Button>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Bolinhas indicadoras para mobile */}
              {true && (
                <div className="mt-2 flex items-center justify-center gap-1 md:hidden">
                  <div className="flex gap-1">
                    {[...Array(Math.min(5, allCourses.filter((c) => !enrolledTurmas.some(t => t.course_id === c.id)).length) + 1)].map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (!recommendedScrollRef.current) return;
                          const first = recommendedScrollRef.current.querySelector('.snap-start') as HTMLElement | null;
                          const cardWidth = first?.offsetWidth || 320;
                          recommendedScrollRef.current.scrollTo({ left: cardWidth * index, behavior: 'smooth' });
                        }}
                        className={`w-2 h-2 rounded-full transition-all ${index === recommendedIndex ? 'bg-primary w-4' : 'bg-primary/30'}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}

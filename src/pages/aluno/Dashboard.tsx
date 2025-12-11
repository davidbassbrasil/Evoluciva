import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Play, Clock, BookOpen, Settings, LogOut, ChevronRight, CheckCircle, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { getCurrentUser, logout } from '@/lib/localStorage';
import supabase from '@/lib/supabaseClient';

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

  useEffect(() => {
    const loadUserData = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        navigate('/aluno/login');
        return;
      }

      setUserId(currentUser.id);
      
      // Try to fetch full profile data from Supabase
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', currentUser.id)
          .single();
        
        setUserName(profile?.full_name || currentUser.name || 'Aluno');
      } catch (e) {
        setUserName(currentUser.name || 'Aluno');
      }

      // Load enrolled turmas with progress
      try {
        const { data: enrollments, error } = await supabase
          .from('enrollments')
          .select(`
            id,
            turma_id,
            turmas (
              id,
              name,
              course_id,
              lesson_live,
              courses (
                id,
                title,
                image
              )
            )
          `)
          .eq('profile_id', currentUser.id);

        if (error) throw error;

        if (enrollments && enrollments.length > 0) {
          // Calculate progress for each turma
          const turmasWithProgress = await Promise.all(
            enrollments.map(async (enrollment: any) => {
              const turma = enrollment.turmas;
              const course = turma?.courses;
              
              // Get total lessons for this turma
              const { data: lessons } = await supabase
                .from('lessons')
                .select('id')
                .eq('turma_id', enrollment.turma_id);
              
              const totalLessons = lessons?.length || 0;
              
              // Get completed lessons
              let completedLessons = 0;
              if (totalLessons > 0 && lessons) {
                const { data: completedProgress } = await supabase
                  .from('lesson_progress')
                  .select('id')
                  .eq('profile_id', currentUser.id)
                  .eq('completed', true)
                  .in('lesson_id', lessons.map(l => l.id));
                
                completedLessons = completedProgress?.length || 0;
              }
              
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
            })
          );
          
          setEnrolledTurmas(turmasWithProgress);
        }

        // Load all active courses for recommendations
        const { data: coursesData } = await supabase
          .from('courses')
          .select('id, title, slug, image')
          .eq('active', true)
          .order('display_order', { ascending: true, nullsFirst: false })
          .order('title', { ascending: true });

        if (coursesData) {
          // Get turmas to fetch prices
          const { data: turmasData } = await supabase
            .from('turmas')
            .select('course_id, price')
            .eq('status', 'active');

          const coursesWithPrices = coursesData.map((course) => {
            const courseTurmas = turmasData?.filter((t) => t.course_id === course.id) || [];
            let minPrice = 0;
            if (courseTurmas.length > 0) {
              const prices = courseTurmas
                .map((t) => Number(t.price))
                .filter((p) => p > 0);
              minPrice = prices.length > 0 ? Math.min(...prices) : 0;
            }
            return { ...course, price: minPrice };
          });

          setAllCourses(coursesWithPrices);
        }
      } catch (err) {
        console.error('Error loading enrollments:', err);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-foreground text-primary-foreground py-4 px-6 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={"/src/assets/logo_.png"} alt="Logo" className="h-10" />
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Minhas Turmas</h2>
            {enrolledTurmas.some(t => t.lesson_live) && (
              <div className="flex items-center gap-2">
                {enrolledTurmas.filter(t => t.lesson_live).map((turma) => (
                  <a
                    key={turma.turma_id}
                    href={turma.lesson_live}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button className="bg-red-600 text-white animate-pulse shadow-lg hover:shadow-xl transition-shadow">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledTurmas.map((turma) => (
                <div
                  key={turma.id}
                  className="group bg-card rounded-2xl overflow-hidden border border-border/50 hover:shadow-xl transition-all duration-300 hover-lift"
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={turma.course_image}
                      alt={turma.course_title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <Badge className="mb-2 bg-primary/80">
                        {turma.turma_name}
                      </Badge>
                      <h3 className="text-primary-foreground font-bold line-clamp-1">
                        {turma.course_title}
                      </h3>
                    </div>
                    <Link
                      to={`/aluno/curso/${turma.turma_id}`}
                      className="absolute inset-0 flex items-center justify-center bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
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
              ))}
            </div>
          )}
        </section>

        {/* Recommended Courses */}
        {enrolledTurmas.length < allCourses.length && allCourses.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Cursos Recomendados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {allCourses
                .filter((c) => !enrolledTurmas.some(t => t.course_id === c.id))
                .slice(0, 4)
                .map((course) => (
                  <div
                    key={course.id}
                    className="bg-card rounded-xl overflow-hidden border border-border/50 hover:shadow-lg transition-all group"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={course.image || '/placeholder.jpg'}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-sm line-clamp-2 mb-2">{course.title}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-bold">R$ {Number(course.price || 0).toFixed(2)}</span>
                        <Link to={`/curso/${course.slug || course.id}`}>
                          <Button size="sm" variant="outline">
                            Ver mais
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

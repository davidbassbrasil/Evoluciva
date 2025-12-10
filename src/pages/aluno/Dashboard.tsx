import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Play, Clock, BookOpen, Settings, LogOut, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getCurrentUser, getLessonsByCourse, logout } from '@/lib/localStorage';
import { Course, Lesson, User } from '@/types';
import supabase from '@/lib/supabaseClient';

export default function AlunoDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserData = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        navigate('/aluno/login');
        return;
      }

      // Try to fetch full profile data from Supabase if available
      if (supabase && currentUser.id) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', currentUser.id)
            .single();
          
          if (profile && profile.full_name) {
            currentUser.name = profile.full_name;
          }
        } catch (e) {
          // Use data from localStorage if Supabase fails
        }
      }

      setUser(currentUser);

      // Load courses from Supabase with turma prices
      if (supabase) {
        try {
          // First get all active courses
          const { data: coursesData, error: coursesError } = await supabase
            .from('courses')
            .select('*')
            .eq('active', true)
            .order('display_order', { ascending: true, nullsFirst: false })
            .order('title', { ascending: true });

            if (!coursesError && coursesData) {
            // Get active turmas to fetch prices
            const { data: turmasData } = await supabase
              .from('turmas')
              .select('course_id, price, price_online')
              .eq('status', 'active');

            // Map courses with presential price from turmas
            const coursesWithPrices = coursesData.map((course) => {
              const courseTurmas = turmasData?.filter((t) => t.course_id === course.id) || [];
              
              // Find minimum presential price
              let minPrice = 0;
              if (courseTurmas.length > 0) {
                const presentialPrices = courseTurmas
                  .map((t) => Number(t.price))
                  .filter((p) => p > 0);
                minPrice = presentialPrices.length > 0 ? Math.min(...presentialPrices) : 0;
              }
              
              return { ...course, price: minPrice };
            });

            setAllCourses(coursesWithPrices);

            // Also fetch enrollments for this user (admin can enroll students)
            let enrolledCourseIds: string[] = [];
            try {
              const { data: enrollData, error: enrollError } = await supabase
                .from('enrollments')
                .select('turma:turmas (course_id)')
                .eq('profile_id', currentUser.id);

              if (!enrollError && enrollData) {
                enrolledCourseIds = (enrollData || [])
                  .map((e: any) => (e.turma && e.turma.course_id) ? e.turma.course_id : null)
                  .filter((id: any) => id) as string[];
              }
            } catch (err) {
              console.error('Error loading enrollments for user:', err);
            }

            // Merge purchasedCourses (from localStorage) with enrolledCourseIds
            const mergedCourseIds = Array.from(new Set([...(currentUser.purchasedCourses || []), ...enrolledCourseIds]));
            const purchasedCrs = coursesWithPrices.filter((c) => mergedCourseIds.includes(c.id));
            setCourses(purchasedCrs);
          }
        } catch (err) {
          console.error('Error loading courses:', err);
        }
      }
    };

    loadUserData();
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getProgress = (courseId: string) => {
    if (!user || !user.progress[courseId]) return 0;
    const lessons = getLessonsByCourse(courseId);
    if (lessons.length === 0) return 0;
    const completed = user.progress[courseId].filter((p) => p.completed).length;
    return Math.round((completed / lessons.length) * 100);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-foreground text-primary-foreground py-4 px-6 sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={"/src/assets/logo_.png"} alt="Logo" className="h-10" />
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm hidden md:block">Olá, {user.name.split(' ')[0]}</span>
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
            Bem-vindo, <span className="gradient-text">{user.name.split(' ')[0]}</span>!
          </h1>
          <p className="text-muted-foreground">
            Continue de onde parou e alcance sua aprovação.
          </p>
        </div>

        {/* My Courses - Netflix Style */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Meus Cursos</h2>
          </div>

          {courses.length === 0 ? (
            <div className="bg-card rounded-2xl p-10 text-center border border-border/50">
              <GraduationCap className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">Nenhum curso adquirido</h3>
              <p className="text-muted-foreground mb-6">
                Explore nossos cursos e comece sua jornada de aprovação!
              </p>
              <Link to="/cursos">
                <Button className="gradient-bg text-primary-foreground">
                  Ver Cursos Disponíveis
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => {
                const progress = getProgress(course.id);
                return (
                  <div
                    key={course.id}
                    className="group bg-card rounded-2xl overflow-hidden border border-border/50 hover:shadow-xl transition-all duration-300 hover-lift"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={course.image}
                        alt={course.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-primary-foreground font-bold line-clamp-1">
                          {course.title}
                        </h3>
                      </div>
                      <Link
                        to={`/aluno/curso/${course.id}`}
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
                          <Clock className="w-4 h-4" />
                          {course.duration}
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {course.lessons} aulas
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-semibold">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>

                      <Link to={`/aluno/curso/${course.id}`}>
                        <Button className="w-full gradient-bg text-primary-foreground">
                          {progress > 0 ? 'Continuar' : 'Começar'}
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recommended Courses */}
        {courses.length < allCourses.length && (
          <section>
            <h2 className="text-2xl font-bold mb-6">Cursos Recomendados</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {allCourses
                .filter((c) => !user.purchasedCourses.includes(c.id))
                .slice(0, 4)
                .map((course) => (
                  <div
                    key={course.id}
                    className="bg-card rounded-xl overflow-hidden border border-border/50 hover:shadow-lg transition-all group"
                  >
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <img
                        src={course.image}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-sm line-clamp-2 mb-2">{course.title}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-bold">Presencial: R$ {Number(course.price || 0).toFixed(2)}</span>
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

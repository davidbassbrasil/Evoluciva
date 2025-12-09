import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { GraduationCap, Play, CheckCircle, Circle, ChevronLeft, Clock, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getCurrentUser, getCourses, getLessonsByCourse, updateProgress } from '@/lib/localStorage';
import { Course, Lesson, User } from '@/types';
import { cn } from '@/lib/utils';

export default function CursoPlayer() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      navigate('/aluno/login');
      return;
    }
    setUser(currentUser);

    if (!courseId) return;

    const allCourses = getCourses();
    const foundCourse = allCourses.find((c) => c.id === courseId);
    
    if (!foundCourse || !currentUser.purchasedCourses.includes(courseId)) {
      navigate('/aluno/dashboard');
      return;
    }

    setCourse(foundCourse);
    const courseLessons = getLessonsByCourse(courseId).sort((a, b) => a.order - b.order);
    setLessons(courseLessons);

    if (courseLessons.length > 0) {
      // Find first incomplete lesson or start from beginning
      const progress = currentUser.progress[courseId] || [];
      const incompleteLesson = courseLessons.find(
        (l) => !progress.find((p) => p.lessonId === l.id && p.completed)
      );
      setCurrentLesson(incompleteLesson || courseLessons[0]);
    }
  }, [courseId, navigate]);

  const isLessonCompleted = (lessonId: string) => {
    if (!user || !courseId) return false;
    const progress = user.progress[courseId] || [];
    return progress.some((p) => p.lessonId === lessonId && p.completed);
  };

  const handleLessonComplete = () => {
    if (!user || !courseId || !currentLesson) return;
    updateProgress(user.id, courseId, currentLesson.id, true);
    
    // Refresh user data
    const updatedUser = getCurrentUser();
    if (updatedUser) setUser(updatedUser);

    // Go to next lesson
    const currentIndex = lessons.findIndex((l) => l.id === currentLesson.id);
    if (currentIndex < lessons.length - 1) {
      setCurrentLesson(lessons[currentIndex + 1]);
    }
  };

  const getProgress = () => {
    if (!user || !courseId || lessons.length === 0) return 0;
    const progress = user.progress[courseId] || [];
    const completed = progress.filter((p) => p.completed).length;
    return Math.round((completed / lessons.length) * 100);
  };

  if (!course || !currentLesson) return null;

  return (
    <div className="min-h-screen bg-foreground">
      {/* Header */}
      <header className="bg-foreground border-b border-primary-foreground/10 py-3 px-6">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/aluno/dashboard"
              className="flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden md:inline">Voltar</span>
            </Link>
            <div className="h-6 w-px bg-primary-foreground/20" />
            <h1 className="text-primary-foreground font-semibold truncate max-w-md">
              {course.title}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-primary-foreground/70 text-sm">
              <span>{getProgress()}% concluído</span>
              <Progress value={getProgress()} className="w-24 h-2" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* Video Player */}
        <div className="flex-1 bg-black">
          <div className="aspect-video">
            <iframe
              src={currentLesson.videoUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Lesson Info */}
          <div className="p-6 bg-foreground">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-primary-foreground mb-1">
                  {currentLesson.title}
                </h2>
                <div className="flex items-center gap-4 text-primary-foreground/60 text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {currentLesson.duration}
                  </span>
                  <span>Aula {currentLesson.order} de {lessons.length}</span>
                </div>
              </div>

              <Button
                onClick={handleLessonComplete}
                disabled={isLessonCompleted(currentLesson.id)}
                className={cn(
                  'gradient-bg text-primary-foreground',
                  isLessonCompleted(currentLesson.id) && 'opacity-50'
                )}
              >
                {isLessonCompleted(currentLesson.id) ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Concluída
                  </>
                ) : (
                  'Marcar como concluída'
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Lessons Sidebar */}
        <div className="lg:w-96 bg-card border-l border-border">
          <div className="p-4 border-b border-border">
            <h3 className="font-bold">Conteúdo do Curso</h3>
            <p className="text-sm text-muted-foreground">
              {lessons.length} aulas • {course.duration}
            </p>
          </div>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-2">
              {lessons.map((lesson, index) => {
                const isCompleted = isLessonCompleted(lesson.id);
                const isCurrent = currentLesson.id === lesson.id;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => setCurrentLesson(lesson)}
                    className={cn(
                      'w-full p-4 rounded-xl text-left transition-all mb-2',
                      isCurrent
                        ? 'bg-primary/10 border-2 border-primary'
                        : 'hover:bg-secondary border-2 border-transparent'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-success" />
                        ) : isCurrent ? (
                          <Play className="w-5 h-5 text-primary" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'font-medium line-clamp-2',
                          isCompleted && 'text-muted-foreground'
                        )}>
                          {index + 1}. {lesson.title}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {lesson.duration}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

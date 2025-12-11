import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Play, CheckCircle, Circle, ChevronLeft, Clock, BookOpen, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCurrentUser } from '@/lib/localStorage';
import supabase from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface Lesson {
  id: string;
  turma_id: string;
  module_title: string;
  lesson_title: string;
  lesson_order: number;
  video_url: string;
  material_link?: string;
  description?: string;
}

interface LessonProgress {
  id: string;
  profile_id: string;
  lesson_id: string;
  completed: boolean;
  last_watched_at: string;
}

export default function CursoPlayer() {
  const { turmaId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string>('');
  const [turmaName, setTurmaName] = useState<string>('');
  const [courseName, setCourseName] = useState<string>('');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const currentUser = getCurrentUser();
      if (!currentUser) {
        navigate('/aluno/login');
        return;
      }
      setUserId(currentUser.id);

      if (!turmaId) {
        navigate('/aluno/dashboard');
        return;
      }

      try {
        // Check if user has access to this turma
        const { data: enrollData, error: enrollError } = await supabase
          .from('enrollments')
          .select('id, turma:turmas (id, name, course_id, courses (title))')
          .eq('profile_id', currentUser.id)
          .eq('turma_id', turmaId)
          .single();

        if (enrollError || !enrollData) {
          console.error('No access to this turma:', enrollError);
          navigate('/aluno/dashboard');
          return;
        }

        const turma = (enrollData as any).turma;
        setTurmaName(turma.name);
        setCourseName(turma.courses?.title || 'Curso');

        // Load lessons for this turma
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('*')
          .eq('turma_id', turmaId)
          .order('module_title')
          .order('lesson_order');

        if (lessonsError) throw lessonsError;

        const lessonsArray = lessonsData || [];
        setLessons(lessonsArray);

        // Load user progress
        const { data: progressData, error: progressError } = await supabase
          .from('lesson_progress')
          .select('*')
          .eq('profile_id', currentUser.id)
          .in('lesson_id', lessonsArray.map(l => l.id));

        if (!progressError && progressData) {
          setProgress(progressData);
        }

        // Set first lesson or first incomplete
        if (lessonsArray.length > 0) {
          const incompleteLesson = lessonsArray.find(
            l => !progressData?.find(p => p.lesson_id === l.id && p.completed)
          );
          setCurrentLesson(incompleteLesson || lessonsArray[0]);
        }
      } catch (err) {
        console.error('Error loading course player:', err);
        navigate('/aluno/dashboard');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [turmaId, navigate]);

  const isLessonCompleted = (lessonId: string) => {
    return progress.some(p => p.lesson_id === lessonId && p.completed);
  };

  const handleLessonComplete = async () => {
    if (!userId || !currentLesson || saving) return;

    setSaving(true);
    try {
      // Check if progress record exists
      const existingProgress = progress.find(p => p.lesson_id === currentLesson.id);

      if (existingProgress && existingProgress.completed) {
        // Already completed
        toast({ title: 'Esta aula já foi concluída' });
        setSaving(false);
        return;
      }

      if (existingProgress) {
        // Update existing
        const { error } = await supabase
          .from('lesson_progress')
          .update({ 
            completed: true,
            last_watched_at: new Date().toISOString()
          })
          .eq('id', existingProgress.id);

        if (error) throw error;
        
        // Update local state immediately
        setProgress(progress.map(p => 
          p.id === existingProgress.id 
            ? { ...p, completed: true, last_watched_at: new Date().toISOString() }
            : p
        ));
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('lesson_progress')
          .insert([{
            profile_id: userId,
            lesson_id: currentLesson.id,
            completed: true,
            last_watched_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) throw error;
        
        // Add to local state immediately
        if (data) {
          setProgress([...progress, data]);
        }
      }

      toast({ title: 'Aula concluída!', description: 'Seu progresso foi salvo.' });

      // Go to next lesson after a brief delay
      setTimeout(() => {
        const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
        if (currentIndex < lessons.length - 1) {
          setCurrentLesson(lessons[currentIndex + 1]);
        }
      }, 800);
    } catch (err: any) {
      console.error('Error marking lesson as complete:', err);
      toast({ 
        title: 'Erro ao salvar progresso', 
        description: err.message || 'Tente novamente',
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const getProgressPercentage = () => {
    if (lessons.length === 0) return 0;
    const completed = progress.filter(p => p.completed).length;
    return Math.round((completed / lessons.length) * 100);
  };

  const convertVideoUrl = (url: string) => {
    // Convert YouTube watch URLs to embed URLs
    if (url.includes('youtube.com/watch')) {
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get('v');
      return `https://www.youtube.com/embed/${videoId}`;
    }
    // Convert Vimeo URLs to embed URLs
    if (url.includes('vimeo.com/') && !url.includes('/video/')) {
      const videoId = url.split('vimeo.com/')[1].split('?')[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    return url;
  };

  // Group lessons by module
  const groupedLessons = lessons.reduce((acc, lesson) => {
    if (!acc[lesson.module_title]) {
      acc[lesson.module_title] = [];
    }
    acc[lesson.module_title].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!currentLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Nenhuma aula disponível</p>
          <Button onClick={() => navigate('/aluno/dashboard')} className="mt-4">
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b py-4 px-6 sticky top-0 z-10">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Link
              to="/aluno/dashboard"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden md:inline">Voltar</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="font-semibold truncate max-w-md">
                {courseName}
              </h1>
              <p className="text-sm text-muted-foreground">{turmaName}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{getProgressPercentage()}% concluído</span>
              <Progress value={getProgressPercentage()} className="w-24 h-2" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* Video Player */}
        <div className="flex-1 bg-black">
          <div className="aspect-video">
            <iframe
              src={convertVideoUrl(currentLesson.video_url)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={currentLesson.lesson_title}
            />
          </div>

          {/* Lesson Info */}
          <div className="p-6 bg-card">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1">
                <Badge variant="outline" className="mb-2">
                  {currentLesson.module_title}
                </Badge>
                <h2 className="text-xl font-bold mb-2">
                  {currentLesson.lesson_title}
                </h2>
                
                {currentLesson.description && (
                  <p className="text-muted-foreground text-sm mb-4">
                    {currentLesson.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    Aula {lessons.findIndex(l => l.id === currentLesson.id) + 1} de {lessons.length}
                  </span>
                  
                  {currentLesson.material_link && (
                    <a 
                      href={currentLesson.material_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      Material de apoio
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <Button
                onClick={handleLessonComplete}
                disabled={isLessonCompleted(currentLesson.id) || saving}
                className={cn(
                  'gradient-bg text-primary-foreground shrink-0',
                  isLessonCompleted(currentLesson.id) && 'opacity-50'
                )}
              >
                {isLessonCompleted(currentLesson.id) ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Concluída
                  </>
                ) : saving ? (
                  'Salvando...'
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
            <h3 className="font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Conteúdo do Curso
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {lessons.length} {lessons.length === 1 ? 'aula' : 'aulas'}
            </p>
          </div>

          <ScrollArea className="h-[calc(100vh-180px)]">
            <div className="p-2">
              {Object.entries(groupedLessons).map(([moduleTitle, moduleLessons]) => (
                <div key={moduleTitle} className="mb-4">
                  <h4 className="px-3 py-2 text-sm font-semibold text-muted-foreground sticky top-0 bg-card">
                    {moduleTitle}
                  </h4>
                  {moduleLessons
                    .sort((a, b) => a.lesson_order - b.lesson_order)
                    .map((lesson) => {
                      const isCompleted = isLessonCompleted(lesson.id);
                      const isCurrent = currentLesson.id === lesson.id;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => setCurrentLesson(lesson)}
                          className={cn(
                            'w-full p-3 rounded-lg text-left transition-all mb-1',
                            isCurrent
                              ? 'bg-primary/10 border-2 border-primary'
                              : 'hover:bg-muted border-2 border-transparent'
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 shrink-0">
                              {isCompleted ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : isCurrent ? (
                                <Play className="w-5 h-5 text-primary" />
                              ) : (
                                <Circle className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                'font-medium text-sm line-clamp-2',
                                isCompleted && !isCurrent && 'text-muted-foreground'
                              )}>
                                {lesson.lesson_order}. {lesson.lesson_title}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

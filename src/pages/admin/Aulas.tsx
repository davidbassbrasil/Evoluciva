import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getCourses, getLessons, setLessons } from '@/lib/localStorage';
import { Course, Lesson } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, PlayCircle, Clock, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function AdminAulas() {
  const [lessons, setLessonsState] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Lesson | null>(null);
  const [form, setForm] = useState({
    title: '',
    courseId: '',
    duration: '',
    videoUrl: '',
    order: '1',
  });
  const { toast } = useToast();

  useEffect(() => {
    setLessonsState(getLessons());
    setCourses(getCourses());
  }, []);

  const resetForm = () => {
    setForm({
      title: '',
      courseId: '',
      duration: '',
      videoUrl: '',
      order: '1',
    });
    setSelected(null);
  };

  const handleSave = () => {
    if (!form.title || !form.courseId) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    const lesson: Lesson = {
      id: selected?.id || Math.random().toString(36).substr(2, 9),
      courseId: form.courseId,
      title: form.title,
      duration: form.duration,
      videoUrl: form.videoUrl,
      order: Number(form.order),
    };

    const updated = selected
      ? lessons.map((l) => (l.id === lesson.id ? lesson : l))
      : [...lessons, lesson];

    setLessons(updated);
    setLessonsState(updated);
    setOpen(false);
    resetForm();
    toast({ title: 'Aula salva com sucesso!' });
  };

  const handleDelete = (id: string) => {
    const updated = lessons.filter((l) => l.id !== id);
    setLessons(updated);
    setLessonsState(updated);
    toast({ title: 'Aula excluída' });
  };

  const handleEdit = (lesson: Lesson) => {
    setSelected(lesson);
    setForm({
      title: lesson.title,
      courseId: lesson.courseId,
      duration: lesson.duration,
      videoUrl: lesson.videoUrl,
      order: String(lesson.order),
    });
    setOpen(true);
  };

  const getCourseName = (courseId: string) => {
    return courses.find((c) => c.id === courseId)?.title || 'Curso não encontrado';
  };

  const filteredLessons = selectedCourseFilter === 'all'
    ? lessons
    : lessons.filter((l) => l.courseId === selectedCourseFilter);

  const sortedLessons = [...filteredLessons].sort((a, b) => {
    if (a.courseId !== b.courseId) {
      return getCourseName(a.courseId).localeCompare(getCourseName(b.courseId));
    }
    return a.order - b.order;
  });

  // Group lessons by course
  const groupedLessons = sortedLessons.reduce((acc, lesson) => {
    const courseId = lesson.courseId;
    if (!acc[courseId]) {
      acc[courseId] = [];
    }
    acc[courseId].push(lesson);
    return acc;
  }, {} as Record<string, Lesson[]>);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Aulas</h1>
          <p className="text-muted-foreground">Gerencie todas as aulas dos cursos</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-bg text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Nova Aula
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selected ? 'Editar' : 'Nova'} Aula</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título da Aula *</label>
                <Input
                  placeholder="Ex: Introdução ao Direito Administrativo"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Curso *</label>
                <Select value={form.courseId} onValueChange={(value) => setForm({ ...form, courseId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Duração</label>
                  <Input
                    placeholder="Ex: 45:00"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Ordem</label>
                  <Input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">URL do Vídeo</label>
                <Input
                  placeholder="https://youtube.com/embed/..."
                  value={form.videoUrl}
                  onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
                />
              </div>

              <Button onClick={handleSave} className="w-full gradient-bg text-primary-foreground">
                Salvar Aula
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <Select value={selectedCourseFilter} onValueChange={setSelectedCourseFilter}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="Filtrar por curso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os cursos</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {sortedLessons.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
          <PlayCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma aula cadastrada</h3>
          <p className="text-muted-foreground mb-4">Crie sua primeira aula para começar</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedLessons).map(([courseId, courseLessons]) => (
            <div key={courseId} className="bg-card rounded-2xl border border-border/50 overflow-hidden">
              <div className="p-4 bg-secondary/50 border-b border-border/50">
                <h3 className="font-bold flex items-center gap-2">
                  {getCourseName(courseId)}
                  <Badge variant="secondary">{courseLessons.length} aulas</Badge>
                </h3>
              </div>
              <div className="divide-y divide-border/50">
                {courseLessons.sort((a, b) => a.order - b.order).map((lesson, index) => (
                  <div key={lesson.id} className="p-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors">
                    <div className="text-muted-foreground">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                      {lesson.order}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{lesson.title}</h4>
                      {lesson.duration && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {lesson.duration}
                        </p>
                      )}
                    </div>
                    {lesson.videoUrl && (
                      <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="icon">
                          <PlayCircle className="w-4 h-4" />
                        </Button>
                      </a>
                    )}
                    <Button variant="outline" size="icon" onClick={() => handleEdit(lesson)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(lesson.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

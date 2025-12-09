import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getCourses, setCourses, getLessons, setLessons } from '@/lib/localStorage';
import { Course, Lesson } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminCursos() {
  const [courses, setCoursesState] = useState<Course[]>([]);
  const [open, setOpen] = useState(false);
  const [lessonsOpen, setLessonsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessonsState] = useState<Lesson[]>([]);
  const [form, setForm] = useState({ title: '', description: '', price: '', originalPrice: '', image: '', instructor: '', duration: '', lessons: '', category: '' });
  const [lessonForm, setLessonForm] = useState({ title: '', duration: '', videoUrl: '' });
  const { toast } = useToast();

  useEffect(() => { setCoursesState(getCourses()); }, []);

  const handleSave = () => {
    const newCourse: Course = {
      id: selectedCourse?.id || Math.random().toString(36).substr(2, 9),
      ...form, price: Number(form.price), originalPrice: Number(form.originalPrice), lessons: Number(form.lessons), featured: false
    };
    const updated = selectedCourse ? courses.map(c => c.id === newCourse.id ? newCourse : c) : [...courses, newCourse];
    setCourses(updated); setCoursesState(updated); setOpen(false); setSelectedCourse(null);
    setForm({ title: '', description: '', price: '', originalPrice: '', image: '', instructor: '', duration: '', lessons: '', category: '' });
    toast({ title: 'Sucesso!' });
  };

  const handleDelete = (id: string) => {
    const updated = courses.filter(c => c.id !== id);
    setCourses(updated); setCoursesState(updated);
  };

  const openLessons = (course: Course) => {
    setSelectedCourse(course);
    setLessonsState(getLessons().filter(l => l.courseId === course.id).sort((a,b) => a.order - b.order));
    setLessonsOpen(true);
  };

  const addLesson = () => {
    const newLesson: Lesson = { id: Math.random().toString(36).substr(2, 9), courseId: selectedCourse!.id, ...lessonForm, order: lessons.length + 1 };
    const allLessons = [...getLessons(), newLesson];
    setLessons(allLessons); setLessonsState([...lessons, newLesson]);
    setLessonForm({ title: '', duration: '', videoUrl: '' });
  };

  const deleteLesson = (id: string) => {
    const allLessons = getLessons().filter(l => l.id !== id);
    setLessons(allLessons); setLessonsState(lessons.filter(l => l.id !== id));
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cursos</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gradient-bg text-primary-foreground"><Plus className="w-4 h-4 mr-2" />Novo Curso</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
            <DialogHeader><DialogTitle>{selectedCourse ? 'Editar' : 'Novo'} Curso</DialogTitle></DialogHeader>
            <div className="grid gap-4">
              <Input placeholder="Título" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              <Textarea placeholder="Descrição" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <Input placeholder="Preço" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} />
                <Input placeholder="Preço Original" type="number" value={form.originalPrice} onChange={e => setForm({...form, originalPrice: e.target.value})} />
              </div>
              <Input placeholder="URL da Imagem" value={form.image} onChange={e => setForm({...form, image: e.target.value})} />
              <Input placeholder="Instrutor" value={form.instructor} onChange={e => setForm({...form, instructor: e.target.value})} />
              <div className="grid grid-cols-3 gap-4">
                <Input placeholder="Duração" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} />
                <Input placeholder="Nº Aulas" type="number" value={form.lessons} onChange={e => setForm({...form, lessons: e.target.value})} />
                <Input placeholder="Categoria" value={form.category} onChange={e => setForm({...form, category: e.target.value})} />
              </div>
              <Button onClick={handleSave} className="gradient-bg text-primary-foreground">Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4">
        {courses.map(course => (
          <div key={course.id} className="bg-card p-4 rounded-xl border flex items-center gap-4">
            <img src={course.image} alt={course.title} className="w-20 h-14 object-cover rounded-lg" />
            <div className="flex-1">
              <h3 className="font-bold">{course.title}</h3>
              <p className="text-sm text-muted-foreground">{course.instructor} • R$ {course.price}</p>
            </div>
            <Button variant="outline" size="icon" onClick={() => openLessons(course)}><BookOpen className="w-4 h-4" /></Button>
            <Button variant="outline" size="icon" onClick={() => { setSelectedCourse(course); setForm({...course, price: String(course.price), originalPrice: String(course.originalPrice), lessons: String(course.lessons)}); setOpen(true); }}><Pencil className="w-4 h-4" /></Button>
            <Button variant="destructive" size="icon" onClick={() => handleDelete(course.id)}><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
      </div>
      <Dialog open={lessonsOpen} onOpenChange={setLessonsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Aulas - {selectedCourse?.title}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Título" value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} />
              <Input placeholder="Duração" value={lessonForm.duration} onChange={e => setLessonForm({...lessonForm, duration: e.target.value})} className="w-24" />
              <Input placeholder="URL Vídeo" value={lessonForm.videoUrl} onChange={e => setLessonForm({...lessonForm, videoUrl: e.target.value})} />
              <Button onClick={addLesson}><Plus className="w-4 h-4" /></Button>
            </div>
            {lessons.map((l, i) => (
              <div key={l.id} className="flex items-center gap-2 p-2 bg-secondary rounded-lg">
                <span className="text-sm font-medium">{i+1}. {l.title}</span>
                <span className="text-xs text-muted-foreground ml-auto">{l.duration}</span>
                <Button variant="ghost" size="icon" onClick={() => deleteLesson(l.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

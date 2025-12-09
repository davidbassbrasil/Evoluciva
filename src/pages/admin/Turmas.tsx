import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getCourses } from '@/lib/localStorage';
import { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, Users, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export interface Turma {
  id: string;
  name: string;
  courseId: string;
  description: string;
  startDate: string;
  endDate: string;
  maxStudents: number;
  status: 'active' | 'inactive' | 'completed';
}

const STORAGE_KEY = 'cursos_turmas';

const getTurmas = (): Turma[] => {
  const item = localStorage.getItem(STORAGE_KEY);
  return item ? JSON.parse(item) : [];
};

const setTurmas = (turmas: Turma[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(turmas));
};

export default function AdminTurmas() {
  const [turmas, setTurmasState] = useState<Turma[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Turma | null>(null);
  const [form, setForm] = useState({
    name: '',
    courseId: '',
    description: '',
    startDate: '',
    endDate: '',
    maxStudents: '30',
    status: 'active' as 'active' | 'inactive' | 'completed',
  });
  const { toast } = useToast();

  useEffect(() => {
    setTurmasState(getTurmas());
    setCourses(getCourses());
  }, []);

  const resetForm = () => {
    setForm({
      name: '',
      courseId: '',
      description: '',
      startDate: '',
      endDate: '',
      maxStudents: '30',
      status: 'active',
    });
    setSelected(null);
  };

  const handleSave = () => {
    if (!form.name || !form.courseId) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    const turma: Turma = {
      id: selected?.id || Math.random().toString(36).substr(2, 9),
      name: form.name,
      courseId: form.courseId,
      description: form.description,
      startDate: form.startDate,
      endDate: form.endDate,
      maxStudents: Number(form.maxStudents),
      status: form.status,
    };

    const updated = selected
      ? turmas.map((t) => (t.id === turma.id ? turma : t))
      : [...turmas, turma];

    setTurmas(updated);
    setTurmasState(updated);
    setOpen(false);
    resetForm();
    toast({ title: 'Turma salva com sucesso!' });
  };

  const handleDelete = (id: string) => {
    const updated = turmas.filter((t) => t.id !== id);
    setTurmas(updated);
    setTurmasState(updated);
    toast({ title: 'Turma excluída' });
  };

  const handleEdit = (turma: Turma) => {
    setSelected(turma);
    setForm({
      name: turma.name,
      courseId: turma.courseId,
      description: turma.description,
      startDate: turma.startDate,
      endDate: turma.endDate,
      maxStudents: String(turma.maxStudents),
      status: turma.status,
    });
    setOpen(true);
  };

  const getCourseName = (courseId: string) => {
    return courses.find((c) => c.id === courseId)?.title || 'Curso não encontrado';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500">Ativa</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inativa</Badge>;
      case 'completed':
        return <Badge variant="outline">Concluída</Badge>;
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Turmas</h1>
          <p className="text-muted-foreground">Gerencie as turmas dos cursos</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-bg text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Nova Turma
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{selected ? 'Editar' : 'Nova'} Turma</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome da Turma *</label>
                <Input
                  placeholder="Ex: Turma A - 2024"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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

              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  placeholder="Descrição da turma"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Data Início</label>
                  <Input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Data Fim</label>
                  <Input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Máx. Alunos</label>
                  <Input
                    type="number"
                    value={form.maxStudents}
                    onChange={(e) => setForm({ ...form, maxStudents: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select value={form.status} onValueChange={(value: 'active' | 'inactive' | 'completed') => setForm({ ...form, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="inactive">Inativa</SelectItem>
                      <SelectItem value="completed">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleSave} className="w-full gradient-bg text-primary-foreground">
                Salvar Turma
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {turmas.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma turma cadastrada</h3>
          <p className="text-muted-foreground mb-4">Crie sua primeira turma para organizar seus alunos</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {turmas.map((turma) => (
            <div key={turma.id} className="bg-card p-5 rounded-xl border border-border/50 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold">{turma.name}</h3>
                  {getStatusBadge(turma.status)}
                </div>
                <p className="text-sm text-muted-foreground">{getCourseName(turma.courseId)}</p>
                {(turma.startDate || turma.endDate) && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {turma.startDate && new Date(turma.startDate).toLocaleDateString('pt-BR')}
                    {turma.startDate && turma.endDate && ' - '}
                    {turma.endDate && new Date(turma.endDate).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{turma.maxStudents} vagas</p>
              </div>
              <Button variant="outline" size="icon" onClick={() => handleEdit(turma)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={() => handleDelete(turma.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

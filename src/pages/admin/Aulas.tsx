import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2, PlayCircle, FileText, Loader2, BookOpen, Video, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Turma {
  id: string;
  name: string;
  course_id: string;
  course_title?: string;
  lesson_live?: string;
}

interface Lesson {
  id: string;
  turma_id: string;
  module_title: string;
  lesson_title: string;
  lesson_order: number;
  video_url: string;
  material_link?: string;
  description?: string;
  turma?: Turma;
}

interface LessonForm {
  turma_id: string;
  module_title: string;
  lesson_title: string;
  lesson_order: string;
  video_url: string;
  material_link: string;
  description: string;
}

export default function AdminAulas() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [existingModules, setExistingModules] = useState<string[]>([]);
  const [selectedTurmaFilter, setSelectedTurmaFilter] = useState<string>('all');
  const [open, setOpen] = useState(false);
  const [openLive, setOpenLive] = useState(false);
  const [selected, setSelected] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingLive, setSavingLive] = useState(false);
  const [useExistingModule, setUseExistingModule] = useState(false);
  const [liveForm, setLiveForm] = useState({ turma_id: '', lesson_live: '' });
  const [form, setForm] = useState<LessonForm>({
    turma_id: '',
    module_title: '',
    lesson_title: '',
    lesson_order: '1',
    video_url: '',
    material_link: '',
    description: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // ✨ OTIMIZAÇÃO: Executar turmas + lessons em paralelo
      const [turmasResult, lessonsResult] = await Promise.all([
        supabase
          .from('turmas')
          .select('id, name, course_id, lesson_live, courses (title)')
          .order('name'),
        
        supabase
          .from('lessons')
          .select(`
            *,
            turmas (
              id,
              name,
              course_id,
              courses (
                title
              )
            )
          `)
          .order('module_title')
          .order('lesson_order')
      ]);

      // Processar turmas
      if (!turmasResult.error && turmasResult.data) {
        const turmasWithCourse = turmasResult.data.map(t => ({
          id: t.id,
          name: t.name,
          course_id: t.course_id,
          course_title: (t as any).courses?.title || 'Sem curso',
          lesson_live: (t as any).lesson_live
        }));
        setTurmas(turmasWithCourse);
      } else if (turmasResult.error) {
        toast({ title: 'Erro ao carregar turmas', description: turmasResult.error.message, variant: 'destructive' });
      }

      // Processar lessons
      if (!lessonsResult.error && lessonsResult.data) {
        const lessonsWithTurma = lessonsResult.data.map(l => ({
          ...l,
          turma: l.turmas ? {
            id: (l.turmas as any).id,
            name: (l.turmas as any).name,
            course_id: (l.turmas as any).course_id,
            course_title: (l.turmas as any).courses?.title || 'Sem curso'
          } : undefined
        }));
        setLessons(lessonsWithTurma);
      } else if (lessonsResult.error) {
        toast({ title: 'Erro ao carregar aulas', description: lessonsResult.error.message, variant: 'destructive' });
      }

    } catch (error: any) {
      toast({ title: 'Erro ao carregar dados', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Funções antigas removidas - agora tudo carrega em paralelo no loadData
  const loadTurmas = async () => { /* deprecated */ };
  const loadLessons = async () => { /* deprecated */ };

  const loadModulesForTurma = async (turmaId: string) => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('module_title')
        .eq('turma_id', turmaId);
      
      if (error) throw error;
      
      // Pegar módulos únicos
      const uniqueModules = Array.from(new Set((data || []).map(l => l.module_title)));
      setExistingModules(uniqueModules);
    } catch (error: any) {
      console.error('Erro ao carregar módulos:', error);
    }
  };

  const resetForm = () => {
    setForm({
      turma_id: '',
      module_title: '',
      lesson_title: '',
      lesson_order: '1',
      video_url: '',
      material_link: '',
      description: '',
    });
    setSelected(null);
    setUseExistingModule(false);
    setExistingModules([]);
  };

  const handleTurmaChange = (turmaId: string) => {
    setForm({ ...form, turma_id: turmaId, module_title: '' });
    setUseExistingModule(false);
    if (turmaId) {
      loadModulesForTurma(turmaId);
    } else {
      setExistingModules([]);
    }
  };

  const handleSaveLive = async () => {
    if (!liveForm.turma_id || !liveForm.lesson_live) {
      toast({ title: 'Erro', description: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }

    setSavingLive(true);
    try {
      const { error } = await supabase
        .from('turmas')
        .update({ lesson_live: liveForm.lesson_live })
        .eq('id', liveForm.turma_id);
      
      if (error) throw error;
      
      toast({ title: 'Aula ao vivo ativada!', description: 'Os alunos já podem acessar.' });
      setOpenLive(false);
      setLiveForm({ turma_id: '', lesson_live: '' });
      loadTurmas(); // Recarregar turmas para atualizar o indicador
    } catch (error: any) {
      toast({ title: 'Erro ao salvar aula ao vivo', description: error.message, variant: 'destructive' });
    } finally {
      setSavingLive(false);
    }
  };

  const handleStopLive = async (turmaId: string) => {
    try {
      const { error } = await supabase
        .from('turmas')
        .update({ lesson_live: null })
        .eq('id', turmaId);
      
      if (error) throw error;
      
      toast({ title: 'Aula ao vivo encerrada' });
      loadTurmas();
    } catch (error: any) {
      toast({ title: 'Erro ao encerrar aula', description: error.message, variant: 'destructive' });
    }
  };

  const handleSave = async () => {
    if (!form.turma_id || !form.module_title || !form.lesson_title || !form.video_url) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const lessonData = {
        turma_id: form.turma_id,
        module_title: form.module_title,
        lesson_title: form.lesson_title,
        lesson_order: parseInt(form.lesson_order) || 1,
        video_url: form.video_url,
        material_link: form.material_link || null,
        description: form.description || null,
      };

      if (selected) {
        const { error } = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', selected.id);
        
        if (error) throw error;
        toast({ title: 'Aula atualizada com sucesso!' });
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert([lessonData]);
        
        if (error) throw error;
        toast({ title: 'Aula criada com sucesso!' });
      }

      setOpen(false);
      resetForm();
      loadLessons();
    } catch (error: any) {
      toast({ title: 'Erro ao salvar aula', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta aula?')) return;
    
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: 'Aula excluída com sucesso!' });
      loadLessons();
    } catch (error: any) {
      toast({ title: 'Erro ao excluir aula', description: error.message, variant: 'destructive' });
    }
  };

  const handleEdit = (lesson: Lesson) => {
    setSelected(lesson);
    setForm({
      turma_id: lesson.turma_id,
      module_title: lesson.module_title,
      lesson_title: lesson.lesson_title,
      lesson_order: String(lesson.lesson_order),
      video_url: lesson.video_url,
      material_link: lesson.material_link || '',
      description: lesson.description || '',
    });
    setOpen(true);
  };

  const filteredLessons = selectedTurmaFilter === 'all'
    ? lessons
    : lessons.filter((l) => l.turma_id === selectedTurmaFilter);

  // Group lessons by module and turma
  const groupedLessons = filteredLessons.reduce((acc, lesson) => {
    const key = `${lesson.turma_id}-${lesson.module_title}`;
    if (!acc[key]) {
      acc[key] = {
        turma: lesson.turma,
        module: lesson.module_title,
        lessons: []
      };
    }
    acc[key].lessons.push(lesson);
    return acc;
  }, {} as Record<string, { turma?: Turma; module: string; lessons: Lesson[] }>);

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Aulas</h1>
          <p className="text-muted-foreground">Gerencie as aulas das turmas</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={openLive} onOpenChange={(isOpen) => { setOpenLive(isOpen); if (!isOpen) setLiveForm({ turma_id: '', lesson_live: '' }); }}>            <DialogTrigger asChild>
              <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50">
                <Video className="w-4 h-4 mr-2" />
                Criar Aula ao Vivo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Iniciar Aula ao Vivo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Turma *</Label>
                  <Select 
                    value={liveForm.turma_id} 
                    onValueChange={(value) => setLiveForm({ ...liveForm, turma_id: value })}
                    disabled={savingLive}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {turmas.map((turma) => (
                        <SelectItem key={turma.id} value={turma.id}>
                          {turma.name} - {turma.course_title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Link do Google Meet / Zoom *</Label>
                  <Input
                    placeholder="https://meet.google.com/..."
                    value={liveForm.lesson_live}
                    onChange={(e) => setLiveForm({ ...liveForm, lesson_live: e.target.value })}
                    disabled={savingLive}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Cole o link da reunião ao vivo
                  </p>
                </div>

                <Button 
                  onClick={handleSaveLive} 
                  className="w-full bg-red-500 hover:bg-red-600 text-white"
                  disabled={savingLive}
                >
                  {savingLive ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Ativando...
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4 mr-2" />
                      Iniciar Aula ao Vivo
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gradient-bg text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Novo Módulo/Aula
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selected ? 'Editar' : 'Nova'} Aula</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Turma *</Label>
                <Select 
                  value={form.turma_id} 
                  onValueChange={handleTurmaChange}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma turma" />
                  </SelectTrigger>
                  <SelectContent>
                    {turmas.map((turma) => (
                      <SelectItem key={turma.id} value={turma.id}>
                        {turma.name} - {turma.course_title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {existingModules.length > 0 && (
                <div>
                  <Label>Usar módulo existente?</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={useExistingModule}
                        onChange={() => setUseExistingModule(true)}
                        disabled={saving}
                      />
                      <span className="text-sm">Sim, adicionar ao módulo existente</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!useExistingModule}
                        onChange={() => {
                          setUseExistingModule(false);
                          setForm({ ...form, module_title: '' });
                        }}
                        disabled={saving}
                      />
                      <span className="text-sm">Não, criar novo módulo</span>
                    </label>
                  </div>
                </div>
              )}

              <div>
                <Label>Título do Módulo *</Label>
                {useExistingModule && existingModules.length > 0 ? (
                  <Select 
                    value={form.module_title} 
                    onValueChange={(value) => setForm({ ...form, module_title: value })}
                    disabled={saving}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um módulo" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingModules.map((module) => (
                        <SelectItem key={module} value={module}>
                          {module}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    placeholder="Ex: Módulo 1 - Introdução"
                    value={form.module_title}
                    onChange={(e) => setForm({ ...form, module_title: e.target.value })}
                    disabled={saving}
                  />
                )}
              </div>

              <div>
                <Label>Título da Aula *</Label>
                <Input
                  placeholder="Ex: Aula 01 - Conceitos Fundamentais"
                  value={form.lesson_title}
                  onChange={(e) => setForm({ ...form, lesson_title: e.target.value })}
                  disabled={saving}
                />
              </div>

              <div>
                <Label>Ordem do Vídeo no Módulo *</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="1"
                  value={form.lesson_order}
                  onChange={(e) => setForm({ ...form, lesson_order: e.target.value })}
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Define a ordem de exibição da aula no módulo
                </p>
              </div>

              <div>
                <Label>URL do Vídeo (YouTube ou Vimeo) *</Label>
                <Input
                  placeholder="https://www.youtube.com/watch?v=... ou https://vimeo.com/..."
                  value={form.video_url}
                  onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Cole a URL completa do vídeo
                </p>
              </div>

              <div>
                <Label>Link de Material de Apoio</Label>
                <Input
                  placeholder="https://drive.google.com/... (opcional)"
                  value={form.material_link}
                  onChange={(e) => setForm({ ...form, material_link: e.target.value })}
                  disabled={saving}
                />
              </div>

              <div>
                <Label>Descrição da Aula</Label>
                <Textarea
                  placeholder="Descrição opcional da aula..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  disabled={saving}
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleSave} 
                className="w-full gradient-bg text-primary-foreground"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Aula'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Active Live Classes */}
      {turmas.filter(t => t.lesson_live).length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Video className="w-5 h-5 text-red-500" />
            Aulas ao Vivo Ativas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {turmas.filter(t => t.lesson_live).map((turma) => (
              <Card key={turma.id} className="border-red-500 border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Badge variant="destructive" className="animate-pulse">
                          AO VIVO
                        </Badge>
                      </CardTitle>
                      <p className="text-sm font-semibold mt-2">{turma.name}</p>
                      <p className="text-xs text-muted-foreground">{turma.course_title}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground break-all">
                      <strong>Link:</strong> {turma.lesson_live}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setLiveForm({ 
                            turma_id: turma.id, 
                            lesson_live: turma.lesson_live || '' 
                          });
                          setOpenLive(true);
                        }}
                      >
                        <Pencil className="w-3 h-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleStopLive(turma.id)}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Encerrar
                      </Button>
                    </div>
                    <a
                      href={turma.lesson_live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button size="sm" className="w-full" variant="secondary">
                        <Video className="w-3 h-3 mr-1" />
                        Abrir Link
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="mb-6">
        <Select value={selectedTurmaFilter} onValueChange={setSelectedTurmaFilter}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="Filtrar por turma" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as turmas</SelectItem>
            {turmas.map((turma) => (
              <SelectItem key={turma.id} value={turma.id}>
                {turma.name} - {turma.course_title}
                {turma.lesson_live && ' 🔴 AO VIVO'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lessons List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : Object.keys(groupedLessons).length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <PlayCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">Nenhuma aula cadastrada</p>
          <p className="text-sm text-muted-foreground mt-1">
            Clique em "+ Novo" para adicionar sua primeira aula
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedLessons).map(([key, group]) => (
            <Card key={key}>
              <CardHeader className="bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      {group.module}
                    </CardTitle>
                    {group.turma && (
                      <p className="text-sm text-muted-foreground">
                        Turma: {group.turma.name} - {group.turma.course_title}
                      </p>
                    )}
                  </div>
                  {group.turma && group.turma.lesson_live && (
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="animate-pulse">
                        <Video className="w-3 h-3 mr-1" />
                        AO VIVO
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStopLive(group.turma!.id)}
                      >
                        <X className="w-3 h-3 mr-1" />
                        Encerrar
                      </Button>
                    </div>
                  )}
                </div>
                <Badge variant="secondary" className="w-fit">
                  {group.lessons.length} {group.lessons.length === 1 ? 'aula' : 'aulas'}
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {group.lessons
                    .sort((a, b) => a.lesson_order - b.lesson_order)
                    .map((lesson) => (
                    <div 
                      key={lesson.id} 
                      className="px-4 py-3 flex items-start justify-between hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <Badge variant="outline" className="w-12 justify-center shrink-0 mt-1">
                          #{lesson.lesson_order}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{lesson.lesson_title}</p>
                          
                          {lesson.video_url && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <PlayCircle className="w-3 h-3 shrink-0" />
                              <span className="text-xs truncate">{lesson.video_url}</span>
                            </div>
                          )}
                          
                          {lesson.material_link && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <FileText className="w-3 h-3 shrink-0" />
                              <span className="text-xs truncate">{lesson.material_link}</span>
                            </div>
                          )}
                          
                          {lesson.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {lesson.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-3 shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(lesson)}
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(lesson.id)}
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

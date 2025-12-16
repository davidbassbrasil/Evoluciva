import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Course, Lesson } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, BookOpen, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import supabase from '@/lib/supabaseClient';

interface CourseForm {
  title: string;
  description: string;
  full_description: string;
  whats_included: string;
  instructor: string;
  link_video?: string;
  professor_ids: string[];
  upsell_course_ids: string[];
  estado: string;
  active: boolean;
  display_order: string;
}

interface Professor {
  id: string;
  name: string;
  specialty: string;
  image: string;
}

export default function AdminCursos() {
  const [courses, setCoursesState] = useState<Course[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [form, setForm] = useState<CourseForm>({ 
    title: '', 
    description: '', 
    full_description: '', 
    whats_included: '', 
    instructor: '', 
    link_video: '',
    professor_ids: [],
    upsell_course_ids: [],
    estado: '', 
    active: true, 
    display_order: '0' 
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => { 
    loadCourses();
    loadProfessors();
  }, []);

  const loadProfessors = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('professors')
        .select('id, name, specialty, image')
        .order('name');

      if (error) throw error;
      setProfessors(data || []);
    } catch (err: any) {
      console.error('Error loading professors:', err);
    }
  };

  const loadCourses = async () => {
    if (!supabase) {
      toast({ title: 'Erro', description: 'Supabase não configurado', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('display_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoursesState(data || []);
    } catch (err: any) {
      console.error('Error loading courses:', err);
      toast({ title: 'Erro ao carregar cursos', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!supabase) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `courses/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (err: any) {
      console.error('Upload error:', err);
      toast({ title: 'Erro ao fazer upload', description: err.message, variant: 'destructive' });
      return null;
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!supabase) {
      toast({ title: 'Erro', description: 'Supabase não configurado', variant: 'destructive' });
      return;
    }

    if (!form.title.trim()) {
      toast({ title: 'Erro', description: 'Título é obrigatório', variant: 'destructive' });
      return;
    }

    setUploading(true);

    try {
      let imageUrl = selectedCourse?.image || '';

      // Upload new image if selected
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        } else {
          setUploading(false);
          return;
        }
      }

      const slug = generateSlug(form.title);
      const courseData = {
        title: form.title,
        description: form.description,
        full_description: form.full_description,
        whats_included: form.whats_included,
        instructor: form.instructor,
        link_video: form.link_video || null,
        estado: form.estado,
        active: form.active,
        display_order: parseInt(form.display_order) || 0,
        slug,
        image: imageUrl,
        // Default values (can be edited later in different section)
        price: selectedCourse?.price || 0,
        originalPrice: selectedCourse?.originalPrice || 0,
        duration: selectedCourse?.duration || '0h',
        lessons: selectedCourse?.lessons || 0,
        category: selectedCourse?.category || 'Geral',
        featured: selectedCourse?.featured || false,
      };

      let courseIdToUpdate: string;

      if (selectedCourse) {
        // Update
        const { error } = await supabase
          .from('courses')
          .update({ ...courseData, updated_at: new Date().toISOString() })
          .eq('id', selectedCourse.id);

        if (error) throw error;
        courseIdToUpdate = selectedCourse.id;
        toast({ title: 'Curso atualizado com sucesso!' });
      } else {
        // Insert
        const { data: newCourse, error } = await supabase
          .from('courses')
          .insert([courseData])
          .select()
          .single();

        if (error) throw error;
        courseIdToUpdate = newCourse.id;
        toast({ title: 'Curso criado com sucesso!', description: `Link: /curso/${slug}` });
      }

      // Atualizar relacionamentos com professores
      // 1. Deletar relacionamentos antigos (capturar resposta para detectar falhas RLS)
      // 1.a - obter estado antes da deleção
      const { data: preDeleteProfLinks, error: preProfErr } = await supabase
        .from('professor_courses')
        .select('professor_id')
        .eq('course_id', courseIdToUpdate);

      if (preProfErr) {
        console.error('Erro ao buscar relacionamentos de professores (pre-delete):', preProfErr);
      }

      // 1.b - executar a deleção e pedir para retornar as linhas deletadas
      const { data: delProfData, error: delProfError } = await supabase
        .from('professor_courses')
        .delete()
        .eq('course_id', courseIdToUpdate)
        .select('professor_id');

      console.debug('professor_courses preDelete count:', (preDeleteProfLinks || []).length, 'deleted count:', (delProfData || []).length, 'delError:', delProfError);

      if (delProfError) {
        console.error('Erro ao deletar relacionamentos antigos de professores:', delProfError);
        // Informar o usuário para investigar permissões (RLS) ou usar backend
        toast({ title: 'Erro ao atualizar vínculos de professores', description: 'Não foi possível remover vínculos antigos. Verifique as políticas RLS no Supabase ou execute esta ação no backend com service role.', variant: 'destructive' });
      } else if ((preDeleteProfLinks || []).length > 0 && (delProfData || []).length === 0) {
        // Se havia vínculos antes, mas a deleção não retornou linhas, informar o usuário
        console.warn('Nenhuma linha deletada de professor_courses apesar de existirem vínculos antes do delete. Possível RLS silencioso.');
        toast({ title: 'Falha ao remover vínculos de professores', description: 'Não foram removidos os vínculos antigos de professores — verifique políticas RLS ou execute via backend com service role.', variant: 'destructive' });
      }

      // 2. Inserir novos relacionamentos (professores)
      if (form.professor_ids.length > 0) {
        const uniqueProfessorIds = Array.from(new Set(form.professor_ids));

        // Verificar relacionamentos já existentes para evitar inserir duplicatas (proteção caso o DELETE anterior falhe por RLS)
        const { data: existingProfLinks, error: existingProfErr } = await supabase
          .from('professor_courses')
          .select('professor_id')
          .eq('course_id', courseIdToUpdate);

        if (existingProfErr) {
          console.error('Erro ao checar relacionamentos de professores existentes:', existingProfErr);
        }

        const existingProfIds = (existingProfLinks || []).map((l: any) => l.professor_id);
        const toInsertProfessorIds = uniqueProfessorIds.filter(id => !existingProfIds.includes(id));

        if (toInsertProfessorIds.length > 0) {
          const professorCourses = toInsertProfessorIds.map(profId => ({
            professor_id: profId,
            course_id: courseIdToUpdate
          }));

          const { error: relError } = await supabase
            .from('professor_courses')
            .insert(professorCourses);

          if (relError) {
            console.error('Erro ao vincular professores:', relError);
            // For RLS issues (42501) give a clearer message to the admin
            if (relError.code === '42501' || relError.status === 403) {
              toast({ title: 'Permissão insuficiente', description: 'Não foi possível vincular professores: verifique as políticas RLS no Supabase ou execute esta ação no backend com service role.', variant: 'destructive' });
            } else if (relError.code === '23505') {
              toast({ title: 'Conflito de professor', description: 'Alguns professores já estão vinculados a este curso. Verifique os relacionamentos existentes.', variant: 'destructive' });
            } else {
              toast({ title: 'Erro ao vincular professores', description: relError.message || 'Verifique o console para mais detalhes', variant: 'destructive' });
            }
          }
        }
      }

      // Atualizar relacionamentos com cursos de upsell
      // 1. Deletar relacionamentos antigos (capturar resposta para detectar falhas RLS)
      const { data: preDeleteUpsellLinks, error: preUpsellErr } = await supabase
        .from('course_upsells')
        .select('upsell_course_id')
        .eq('course_id', courseIdToUpdate);

      if (preUpsellErr) {
        console.error('Erro ao buscar relacionamentos de upsells (pre-delete):', preUpsellErr);
      }

      const { data: delUpsellData, error: delUpsellError } = await supabase
        .from('course_upsells')
        .delete()
        .eq('course_id', courseIdToUpdate)
        .select('upsell_course_id');

      console.debug('course_upsells preDelete count:', (preDeleteUpsellLinks || []).length, 'deleted count:', (delUpsellData || []).length, 'delError:', delUpsellError);

      if (delUpsellError) {
        console.error('Erro ao deletar relacionamentos antigos de upsells:', delUpsellError);
        toast({ title: 'Erro ao atualizar vínculos de upsell', description: 'Não foi possível remover vínculos antigos de upsell. Verifique as políticas RLS no Supabase ou execute esta ação no backend com service role.', variant: 'destructive' });
      } else if ((preDeleteUpsellLinks || []).length > 0 && (delUpsellData || []).length === 0) {
        console.warn('Nenhuma linha deletada de course_upsells apesar de existirem vínculos antes do delete. Possível RLS silencioso.');
        toast({ title: 'Falha ao remover vínculos de upsell', description: 'Não foram removidos os vínculos antigos de upsell — verifique políticas RLS ou execute via backend com service role.', variant: 'destructive' });
      }

      // 2. Inserir novos relacionamentos (upsells) - garantir ids únicos para evitar conflito
      if (form.upsell_course_ids.length > 0) {
        const uniqueUpsellIds = Array.from(new Set(form.upsell_course_ids));

        // Verificar relacionamentos já existentes para evitar inserir duplicatas (proteção caso o DELETE anterior falhe por RLS)
        const { data: existingUpsellLinks, error: existingUpsellErr } = await supabase
          .from('course_upsells')
          .select('upsell_course_id')
          .eq('course_id', courseIdToUpdate);

        if (existingUpsellErr) {
          console.error('Erro ao checar relacionamentos de upsells existentes:', existingUpsellErr);
        }

        const existingUpsellIds = (existingUpsellLinks || []).map((l: any) => l.upsell_course_id);
        const toInsertUpsellIds = uniqueUpsellIds.filter(id => !existingUpsellIds.includes(id));

        if (toInsertUpsellIds.length > 0) {
          const courseUpsells = toInsertUpsellIds.map((upsellId, index) => ({
            course_id: courseIdToUpdate,
            upsell_course_id: upsellId,
            display_order: index
          }));

          const { error: upsellError } = await supabase
            .from('course_upsells')
            .insert(courseUpsells);

          if (upsellError) {
            console.error('Erro ao vincular cursos de upsell:', upsellError);
            if (upsellError.code === '23505') {
              // Duplicate key (should be prevented by dedupe, but inform user)
              toast({ title: 'Conflito de upsell', description: 'Alguns cursos já estão vinculados como upsell. Verifique os relacionamentos existentes.', variant: 'destructive' });
            } else {
              toast({ title: 'Erro ao vincular upsells', description: upsellError.message || 'Verifique o console para mais detalhes', variant: 'destructive' });
            }
          }
        }
      }

      await loadCourses();
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error saving course:', err);
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (course: Course) => {
    if (!supabase) return;
    if (!confirm(`Tem certeza que deseja excluir "${course.title}"?`)) return;

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', course.id);

      if (error) throw error;

      // Try to delete image from storage
      if (course.image && course.image.includes('supabase.co')) {
        const path = course.image.split('/').slice(-2).join('/');
        await supabase.storage.from('images').remove([path]);
      }

      toast({ title: 'Curso excluído' });
      await loadCourses();
    } catch (err: any) {
      console.error('Error deleting course:', err);
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' });
    }
  };

  const handleEdit = async (course: Course) => {
    setSelectedCourse(course);
    
    // Carregar professores vinculados
    const { data: professorLinks } = await supabase
      .from('professor_courses')
      .select('professor_id')
      .eq('course_id', course.id);
    
    const professorIds = professorLinks?.map(link => link.professor_id) || [];
    
    // Carregar cursos de upsell vinculados
    const { data: upsellLinks } = await supabase
      .from('course_upsells')
      .select('upsell_course_id')
      .eq('course_id', course.id)
      .order('display_order', { ascending: true });
    
    const upsellCourseIds = upsellLinks?.map(link => link.upsell_course_id) || [];
    
    setForm({
      title: course.title,
      description: course.description,
      full_description: course.full_description || '',
      link_video: course.link_video || '',
      whats_included: course.whats_included || '',
      instructor: course.instructor,
      professor_ids: professorIds,
      upsell_course_ids: upsellCourseIds,
      estado: course.estado || '',
      active: course.active ?? true,
      display_order: String(course.display_order ?? 0),
    });
    setImagePreview(course.image);
    setImageFile(null);
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setSelectedCourse(null);
    setForm({ title: '', description: '', full_description: '', whats_included: '', instructor: '', link_video: '', professor_ids: [], upsell_course_ids: [], estado: '', active: true, display_order: '0' });
    setImageFile(null);
    setImagePreview('');
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciar Cursos</h1>
        <Dialog open={open} onOpenChange={(isOpen) => {
          if (!isOpen) handleCloseDialog();
          else setOpen(true);
        }}>
          <DialogTrigger asChild>
            <Button className="gradient-bg text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Novo Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-full sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedCourse ? 'Editar' : 'Novo'} Curso</DialogTitle>
              <DialogDescription>
                Formulário para {selectedCourse ? 'editar' : 'criar'} um curso. Preencha os campos abaixo e clique em "Salvar Curso".
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* Upload de Imagem */}
              <div className="space-y-2">
                <Label>Imagem do Curso *</Label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1 w-full">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Formatos aceitos: JPG, PNG, WebP. Recomendado: 800x500px
                    </p>
                  </div>
                  <div className="relative w-full sm:w-32 h-48 sm:h-20 rounded-lg overflow-hidden border-2 border-border flex items-center justify-center">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>

              {/* Link do Vídeo */}
              <div className="space-y-2">
                <Label htmlFor="link_video">Link do Vídeo (Opcional)</Label>
                <Input
                  id="link_video"
                  placeholder="https://seulinkdovideo.com/exemplo"
                  value={form.link_video}
                  onChange={(e) => setForm({ ...form, link_video: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Caso este campo seja preenchido, o vídeo substituirá a imagem na página de detalhes do curso.</p>
              </div>

              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="title">Título do Curso *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Português Completo para Concursos"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              {/* Descrição Curta */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição Curta *</Label>
                <Textarea
                  id="description"
                  placeholder="Resumo do curso (aparece nos cards)"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                />
              </div>

              {/* Descrição Completa */}
              <div className="space-y-2">
                <Label htmlFor="full_description">Descrição Completa do Curso</Label>
                <Textarea
                  id="full_description"
                  placeholder="Descreva detalhadamente o conteúdo... Use **negrito**, *itálico*, # Títulos, - listas 😊"
                  value={form.full_description}
                  onChange={(e) => setForm({ ...form, full_description: e.target.value })}
                  rows={6}
                  className="font-sans font-mono text-sm"
                  style={{ unicodeBidi: 'plaintext' }}
                />
                <p className="text-xs text-muted-foreground">
                  Suporta <strong>Markdown</strong>: **negrito**, *itálico*, # Títulos, - listas, emojis 😊
                </p>
              </div>

              {/* O que está incluso */}
              <div className="space-y-2">
                <Label htmlFor="whats_included">O que está incluso</Label>
                <Textarea
                  id="whats_included"
                  placeholder="Ex: &#10;• Videoaulas em alta definição&#10;• Material em PDF&#10;• Exercícios com gabarito&#10;• Certificado de conclusão"
                  value={form.whats_included}
                  onChange={(e) => setForm({ ...form, whats_included: e.target.value })}
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  Use uma linha por item. Pode usar • ou - para listar
                </p>
              </div>

              {/* Professor */}
              <div className="space-y-2">
                <Label htmlFor="instructor">Professor ou Equipe *</Label>
                <Input
                  id="instructor"
                  placeholder="Ex: Prof. Maria Santos ou Equipe Evoluciva"
                  value={form.instructor}
                  onChange={(e) => setForm({ ...form, instructor: e.target.value })}
                />
              </div>

              {/* Selecionar Professores Cadastrados */}
              <div className="space-y-2">
                <Label>Vincular Professores (Opcional)</Label>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                  {professors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum professor cadastrado</p>
                  ) : (
                    professors.map((prof) => (
                      <label key={prof.id} className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={form.professor_ids.includes(prof.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({ ...form, professor_ids: [...form.professor_ids, prof.id] });
                            } else {
                              setForm({ ...form, professor_ids: form.professor_ids.filter(id => id !== prof.id) });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <div className="flex items-center gap-2">
                          <img src={prof.image} alt={prof.name} className="w-8 h-8 rounded-full object-cover" />
                          <div>
                            <p className="text-sm font-medium">{prof.name}</p>
                            <p className="text-xs text-muted-foreground">{prof.specialty}</p>
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selecione um ou mais professores para exibir na página do curso
                </p>
              </div>

              {/* Cursos para Upsell */}
              <div className="space-y-2">
                <Label>Cursos para Upsell no Carrinho (Opcional)</Label>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
                  {courses.filter(c => c.id !== selectedCourse?.id).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum outro curso disponível</p>
                  ) : (
                    courses.filter(c => c.id !== selectedCourse?.id).map((course) => (
                      <label key={course.id} className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={form.upsell_course_ids.includes(course.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({ ...form, upsell_course_ids: [...form.upsell_course_ids, course.id] });
                            } else {
                              setForm({ ...form, upsell_course_ids: form.upsell_course_ids.filter(id => id !== course.id) });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <div className="flex items-center gap-2">
                          <img src={course.image} alt={course.title} className="w-10 h-10 rounded object-cover" />
                          <div>
                            <p className="text-sm font-medium">{course.title}</p>
                            <p className="text-xs text-muted-foreground">{course.description}</p>
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Estes cursos aparecerão como sugestões no carrinho quando este curso for adicionado
                </p>
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <Label htmlFor="estado">Estado</Label>
                <select
                  id="estado"
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Selecione um estado</option>
                  <option value="AC">AC - Acre</option>
                  <option value="AL">AL - Alagoas</option>
                  <option value="AP">AP - Amapá</option>
                  <option value="AM">AM - Amazonas</option>
                  <option value="BA">BA - Bahia</option>
                  <option value="CE">CE - Ceará</option>
                  <option value="DF">DF - Distrito Federal</option>
                  <option value="ES">ES - Espírito Santo</option>
                  <option value="GO">GO - Goiás</option>
                  <option value="MA">MA - Maranhão</option>
                  <option value="MT">MT - Mato Grosso</option>
                  <option value="MS">MS - Mato Grosso do Sul</option>
                  <option value="MG">MG - Minas Gerais</option>
                  <option value="PA">PA - Pará</option>
                  <option value="PB">PB - Paraíba</option>
                  <option value="PR">PR - Paraná</option>
                  <option value="PE">PE - Pernambuco</option>
                  <option value="PI">PI - Piauí</option>
                  <option value="RJ">RJ - Rio de Janeiro</option>
                  <option value="RN">RN - Rio Grande do Norte</option>
                  <option value="RS">RS - Rio Grande do Sul</option>
                  <option value="RO">RO - Rondônia</option>
                  <option value="RR">RR - Roraima</option>
                  <option value="SC">SC - Santa Catarina</option>
                  <option value="SP">SP - São Paulo</option>
                  <option value="SE">SE - Sergipe</option>
                  <option value="TO">TO - Tocantins</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Selecione o estado relacionado ao curso (opcional)
                </p>
              </div>

              {/* Ordem de Exibição */}
              <div className="space-y-2">
                <Label htmlFor="display_order">Ordem de Exibição</Label>
                <Input
                  id="display_order"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Cursos com menor número aparecem primeiro (0 = topo)
                </p>
              </div>

              {/* Ativo/Inativo */}
              <div className="flex items-center justify-between p-4 rounded-lg border bg-secondary/20">
                <div className="space-y-0.5">
                  <Label htmlFor="active" className="text-base">
                    Exibir na Página Principal após a configuração da Turma
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Controla se o curso aparece na listagem da home
                  </p>
                </div>
                <Switch
                  id="active"
                  checked={form.active}
                  onCheckedChange={(checked) => setForm({ ...form, active: checked })}
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={uploading || !form.title.trim()}
                  className="w-full sm:flex-1 gradient-bg text-primary-foreground"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>Salvar Curso</>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={uploading}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista de Cursos */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum curso cadastrado ainda.</p>
          <p className="text-sm mt-2">Clique em "Novo Curso" para começar.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-card p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center gap-4 hover:shadow-md transition-shadow"
            >
              <img
                src={course.image || 'https://via.placeholder.com/100x60?text=Sem+Imagem'}
                alt={course.title}
                className="w-full md:w-24 h-48 md:h-16 object-cover rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold truncate">{course.title}</h3>
                  {course.active === false && (
                    <span className="text-xs px-2 py-0.5 rounded bg-destructive/10 text-destructive">
                      Inativo
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {course.instructor}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ordem: {course.display_order ?? 0} • Slug: {course.slug || 'sem-slug'}
                </p>
              </div>
              <div className="flex gap-2 mt-3 md:mt-0">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleEdit(course)}
                  title="Editar curso"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(course)}
                  title="Excluir curso"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Course, Lesson } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, BookOpen, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import supabase from '@/lib/supabaseClient';

interface CourseForm {
  title: string;
  description: string;
  full_description: string;
  whats_included: string;
  instructor: string;
  estado: string;
  active: boolean;
  display_order: string;
}

export default function AdminCursos() {
  const [courses, setCoursesState] = useState<Course[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [form, setForm] = useState<CourseForm>({ 
    title: '', 
    description: '', 
    full_description: '', 
    whats_included: '', 
    instructor: '', 
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
  }, []);

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

      if (selectedCourse) {
        // Update
        const { error } = await supabase
          .from('courses')
          .update({ ...courseData, updated_at: new Date().toISOString() })
          .eq('id', selectedCourse.id);

        if (error) throw error;
        toast({ title: 'Curso atualizado com sucesso!' });
      } else {
        // Insert
        const { error } = await supabase
          .from('courses')
          .insert([courseData]);

        if (error) throw error;
        toast({ title: 'Curso criado com sucesso!', description: `Link: /curso/${slug}` });
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

  const handleEdit = (course: Course) => {
    setSelectedCourse(course);
    setForm({
      title: course.title,
      description: course.description,
      full_description: course.full_description || '',
      whats_included: course.whats_included || '',
      instructor: course.instructor,
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
    setForm({ title: '', description: '', full_description: '', whats_included: '', instructor: '', estado: '', active: true, display_order: '0' });
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedCourse ? 'Editar' : 'Novo'} Curso</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              {/* Upload de Imagem */}
              <div className="space-y-2">
                <Label>Imagem do Curso *</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
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
                  {imagePreview && (
                    <div className="relative w-32 h-20 rounded-lg overflow-hidden border-2 border-border">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {!imagePreview && (
                    <div className="w-32 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
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
                  placeholder="Descreva detalhadamente o conteúdo, objetivos e benefícios do curso"
                  value={form.full_description}
                  onChange={(e) => setForm({ ...form, full_description: e.target.value })}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Esta descrição aparecerá na página individual do curso
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
                    Exibir na Página Principal
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
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={uploading || !form.title.trim()}
                  className="flex-1 gradient-bg text-primary-foreground"
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
              className="bg-card p-4 rounded-xl border flex items-center gap-4 hover:shadow-md transition-shadow"
            >
              <img
                src={course.image || 'https://via.placeholder.com/100x60?text=Sem+Imagem'}
                alt={course.title}
                className="w-24 h-16 object-cover rounded-lg"
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
              <div className="flex gap-2">
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

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { getBanners, setBanners, getProfessors, setProfessors, getTags, setTags, getTestimonials, setTestimonials, getFAQs, setFAQs, getUsers } from '@/lib/localStorage';
import { Banner, Professor, Tag, Testimonial, FAQ, User } from '@/types';
import supabase from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Upload, ChevronUp, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Banners Page
export function AdminBanners() {
  const [items, setItems] = useState<Banner[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    // Try to load from Supabase first
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('banners')
          .select('*')
          .order('order', { ascending: true });
        
        if (!error && data) {
          setItems(data);
          setBanners(data); // Sync with localStorage
          return;
        }
      } catch (err) {
        console.error('Error loading banners from Supabase:', err);
      }
    }
    // Fallback to localStorage
    setItems(getBanners());
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um arquivo de imagem.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (400KB)
    const maxSize = 400 * 1024; // 400KB in bytes
    if (file.size > maxSize) {
      toast({
        title: 'Imagem muito grande',
        description: 'A imagem deve ter no máximo 400KB.',
        variant: 'destructive',
      });
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !supabase) return null;

    setUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `banners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível fazer upload da imagem.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    // Upload image if a new file was selected
    let imageUrl = selected?.image || '';
    if (imageFile) {
      const uploadedUrl = await uploadImage();
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        return; // Upload failed
      }
    }

    if (!imageUrl) {
      toast({
        title: 'Imagem obrigatória',
        description: 'Por favor, selecione uma imagem.',
        variant: 'destructive',
      });
      return;
    }

    const bannerData = {
      image: imageUrl,
      order: selected?.order ?? items.length,
    };

    try {
      if (supabase) {
        if (selected) {
          // Update existing
          const { error } = await supabase
            .from('banners')
            .update({ image: bannerData.image })
            .eq('id', selected.id);
          
          if (error) throw error;
        } else {
          // Insert new
          const { error } = await supabase
            .from('banners')
            .insert([bannerData]);
          
          if (error) throw error;
        }
      }

      // Reload data
      await loadBanners();
      
      toast({ title: 'Sucesso!', description: 'Banner salvo.' });
      closeDialog();
    } catch (error) {
      console.error('Error saving banner:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o banner.',
        variant: 'destructive',
      });
    }
  };

  const del = async (id: string) => {
    if (!confirm('Deseja realmente excluir este banner?')) return;

    try {
      // Get banner data to extract image path
      const banner = items.find(b => b.id === id);
      
      if (supabase) {
        // Delete from database first
        const { error } = await supabase
          .from('banners')
          .delete()
          .eq('id', id);
        
        if (error) throw error;

        // Delete image from storage if exists
        if (banner?.image) {
          try {
            // Extract file path from URL
            // Example URL: https://[project].supabase.co/storage/v1/object/public/images/banners/abc123.jpg
            const urlParts = banner.image.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const filePath = `banners/${fileName}`;

            const { error: storageError } = await supabase.storage
              .from('images')
              .remove([filePath]);

            if (storageError) {
              console.error('Error deleting image from storage:', storageError);
              // Don't throw - banner is already deleted from DB
            }
          } catch (storageErr) {
            console.error('Error extracting/deleting image path:', storageErr);
            // Continue anyway - banner is deleted
          }
        }
      }

      await loadBanners();
      toast({ title: 'Banner excluído!' });
    } catch (error) {
      console.error('Error deleting banner:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o banner.',
        variant: 'destructive',
      });
    }
  };

  const changeOrder = async (id: string, direction: 'up' | 'down') => {
    const index = items.findIndex(i => i.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;

    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap items
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    
    // Update order values
    newItems.forEach((item, idx) => {
      item.order = idx;
    });

    try {
      if (supabase) {
        // Update orders in database
        for (const item of newItems) {
          await supabase
            .from('banners')
            .update({ order: item.order })
            .eq('id', item.id);
        }
      }

      setItems(newItems);
      setBanners(newItems);
      toast({ title: 'Ordem alterada!' });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar a ordem.',
        variant: 'destructive',
      });
    }
  };

  const openDialog = (banner?: Banner) => {
    if (banner) {
      setSelected(banner);
      setImagePreview(banner.image);
    } else {
      setSelected(null);
      setImagePreview('');
    }
    setImageFile(null);
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setSelected(null);
    setImageFile(null);
    setImagePreview('');
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Banners</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-bg text-primary-foreground" onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-full sm:max-w-lg md:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selected ? 'Editar' : 'Novo'} Banner</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Imagem do Banner *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  {imagePreview ? (
                    <div className="space-y-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 md:h-64 object-cover rounded-lg max-h-[60vh]"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                        }}
                      >
                        Remover Imagem
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Selecione uma imagem (máx. 400KB)
                        </p>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 400KB
                </p>
              </div>

              <Button
                onClick={save}
                disabled={uploading}
                className="w-full gradient-bg text-primary-foreground"
              >
                {uploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    Fazendo upload...
                  </>
                ) : (
                  'Salvar Banner'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 text-center border border-border/50">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold mb-2">Nenhum banner cadastrado</h3>
          <p className="text-muted-foreground mb-6">
            Crie seu primeiro banner clicando no botão "+ Novo" acima.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="bg-card p-4 rounded-xl border border-border/50 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row gap-4 items-start">
                  {/* Image */}
                  <img
                    src={item.image}
                    alt={`Banner ${index + 1}`}
                    className="w-full md:w-48 h-48 md:h-32 object-cover rounded-lg"
                  />

                  {/* Content */}
                  <div className="flex-1 flex items-center md:items-start">
                    <div>
                      <h3 className="font-bold text-lg">Banner {index + 1}</h3>
                      <p className="text-sm text-muted-foreground">
                        Ordem: {item.order + 1}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex w-full md:w-auto flex-row md:flex-col gap-2 justify-between md:justify-start">
                    {/* Order buttons */}
                    <div className="flex gap-1 md:flex-col">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => changeOrder(item.id, 'up')}
                        disabled={index === 0}
                        title="Mover para cima"
                        className="md:mb-1"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => changeOrder(item.id, 'down')}
                        disabled={index === items.length - 1}
                        title="Mover para baixo"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Edit and Delete */}
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openDialog(item)}
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => del(item.id)}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

// Professors Page
export function AdminProfessores() {
  const [items, setItems] = useState<Professor[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Professor | null>(null);
  const [form, setForm] = useState({ name: '', specialty: '', bio: '', selectedCourses: [] as string[] });
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadProfessors();
    loadCourses();
  }, []);

  const loadCourses = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, slug')
        .eq('active', true)
        .order('title', { ascending: true });
      
      if (!error && data) setCourses(data);
    } catch (err) {
      console.error('Error loading courses:', err);
    }
  };

  const loadProfessors = async () => {
    // Try to load from Supabase first
    if (supabase) {
      try {
        // Carregar professores
        const { data: professorsData, error: professorsError } = await supabase
          .from('professors')
          .select('*')
          .order('name', { ascending: true });
        
        if (professorsError) throw professorsError;

        // Buscar relacionamentos professor_courses
        const { data: relationsData } = await supabase
          .from('professor_courses')
          .select(`
            professor_id,
            course:courses(id, title, slug)
          `);

        // Agrupar cursos por professor
        const coursesMap: { [key: string]: any[] } = {};
        relationsData?.forEach((rel: any) => {
          if (!coursesMap[rel.professor_id]) {
            coursesMap[rel.professor_id] = [];
          }
          if (rel.course) {
            coursesMap[rel.professor_id].push(rel.course);
          }
        });

        // Juntar dados
        const professorsWithCourses = professorsData?.map(prof => ({
          ...prof,
          courses: coursesMap[prof.id] || []
        })) || [];
        
        setItems(professorsWithCourses);
        setProfessors(professorsWithCourses); // Sync with localStorage
        return;
      } catch (err) {
        console.error('Error loading professors from Supabase:', err);
      }
    }
    // Fallback to localStorage
    setItems(getProfessors());
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um arquivo de imagem.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (100KB)
    const maxSize = 100 * 1024; // 100KB in bytes
    if (file.size > maxSize) {
      toast({
        title: 'Imagem muito grande',
        description: 'A imagem deve ter no máximo 100KB.',
        variant: 'destructive',
      });
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !supabase) return null;

    setUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `professors/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível fazer upload da imagem.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim() || !form.specialty.trim() || !form.bio.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha nome, especialidade e bio.',
        variant: 'destructive',
      });
      return;
    }

    // Upload image if a new file was selected
    let imageUrl = selected?.image || '';
    if (imageFile) {
      const uploadedUrl = await uploadImage();
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      } else {
        return; // Upload failed
      }
    }

    if (!imageUrl) {
      toast({
        title: 'Imagem obrigatória',
        description: 'Por favor, selecione uma foto.',
        variant: 'destructive',
      });
      return;
    }

    const professorData = {
      name: form.name.trim(),
      specialty: form.specialty.trim(),
      bio: form.bio.trim(),
      image: imageUrl,
    };

    try {
      if (supabase) {
        let professorId = selected?.id;

        if (selected) {
          // Update existing
          const { error } = await supabase
            .from('professors')
            .update(professorData)
            .eq('id', selected.id);
          
          if (error) throw error;
        } else {
          // Insert new
          const { data: newProfessor, error } = await supabase
            .from('professors')
            .insert([professorData])
            .select()
            .single();
          
          if (error) throw error;
          professorId = newProfessor?.id;
        }

        // Atualizar relacionamentos com cursos
        if (professorId) {
          // Deletar relacionamentos antigos
          await supabase
            .from('professor_courses')
            .delete()
            .eq('professor_id', professorId);

          // Inserir novos relacionamentos
          if (form.selectedCourses.length > 0) {
            const relations = form.selectedCourses.map(courseId => ({
              professor_id: professorId,
              course_id: courseId
            }));

            const { error: relError } = await supabase
              .from('professor_courses')
              .insert(relations);

            if (relError) throw relError;
          }
        }
      }

      // Reload data
      await loadProfessors();
      
      toast({ title: 'Sucesso!', description: 'Professor salvo.' });
      closeDialog();
    } catch (error) {
      console.error('Error saving professor:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o professor.',
        variant: 'destructive',
      });
    }
  };

  const del = async (id: string) => {
    if (!confirm('Deseja realmente excluir este professor?')) return;

    try {
      // Get professor data to extract image path
      const professor = items.find(p => p.id === id);
      
      if (supabase) {
        // Delete from database first
        const { error } = await supabase
          .from('professors')
          .delete()
          .eq('id', id);
        
        if (error) throw error;

        // Delete image from storage if exists
        if (professor?.image) {
          try {
            // Extract file path from URL
            const urlParts = professor.image.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const filePath = `professors/${fileName}`;

            const { error: storageError } = await supabase.storage
              .from('images')
              .remove([filePath]);

            if (storageError) {
              console.error('Error deleting image from storage:', storageError);
            }
          } catch (storageErr) {
            console.error('Error extracting/deleting image path:', storageErr);
          }
        }
      }

      await loadProfessors();
      toast({ title: 'Professor excluído!' });
    } catch (error) {
      console.error('Error deleting professor:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o professor.',
        variant: 'destructive',
      });
    }
  };

  const openDialog = (professor?: Professor) => {
    if (professor) {
      setSelected(professor);
      const courseIds = professor.courses?.map(c => c.id) || [];
      setForm({ 
        name: professor.name, 
        specialty: professor.specialty, 
        bio: professor.bio,
        selectedCourses: courseIds
      });
      setImagePreview(professor.image);
    } else {
      setSelected(null);
      setForm({ name: '', specialty: '', bio: '', selectedCourses: [] });
      setImagePreview('');
    }
    setImageFile(null);
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setSelected(null);
    setForm({ name: '', specialty: '', bio: '', selectedCourses: [] });
    setImageFile(null);
    setImagePreview('');
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Professores</h1>
          <p className="text-muted-foreground">Gerencie os professores dos cursos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-bg text-primary-foreground" onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Professor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selected ? 'Editar' : 'Novo'} Professor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Foto do Professor *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  {imagePreview ? (
                    <div className="space-y-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-full mx-auto"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                        }}
                      >
                        Remover Imagem
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Selecione uma imagem (máx. 100KB)
                        </p>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 100KB
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome do Professor *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Dr. João Silva"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialty">Especialidade *</Label>
                <Input
                  id="specialty"
                  placeholder="Ex: Direito Constitucional"
                  value={form.specialty}
                  onChange={e => setForm({ ...form, specialty: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografia *</Label>
                <Textarea
                  id="bio"
                  placeholder="Descreva a experiência e qualificações do professor..."
                  value={form.bio}
                  onChange={e => setForm({ ...form, bio: e.target.value })}
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="courses">Cursos Vinculados</Label>
                <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                  {courses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum curso ativo disponível</p>
                  ) : (
                    courses.map(course => (
                      <label key={course.id} className="flex items-center gap-2 cursor-pointer hover:bg-secondary/50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={form.selectedCourses.includes(course.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setForm({ ...form, selectedCourses: [...form.selectedCourses, course.id] });
                            } else {
                              setForm({ ...form, selectedCourses: form.selectedCourses.filter(id => id !== course.id) });
                            }
                          }}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{course.title}</span>
                      </label>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selecione os cursos que este professor leciona. Se não houver cursos, o card direcionará para /cursos.
                </p>
              </div>

              <Button
                onClick={save}
                disabled={uploading}
                className="w-full gradient-bg text-primary-foreground"
              >
                {uploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    Fazendo upload...
                  </>
                ) : (
                  'Salvar Professor'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 text-center border border-border/50">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold mb-2">Nenhum professor cadastrado</h3>
          <p className="text-muted-foreground mb-6">
            Adicione professores para exibir no site.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map(item => (
            <div
              key={item.id}
              className="bg-card p-6 rounded-xl border border-border/50 hover:shadow-lg transition-shadow"
            >
              <div className="flex gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 object-cover rounded-full"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                  <p className="text-sm text-primary font-medium mb-2">{item.specialty}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {item.bio}
                  </p>
                  {item.courses && item.courses.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.courses.map(course => (
                        <span key={course.id} className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                          {course.title}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openDialog(item)}
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => del(item.id)}
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

// Tags Page
export function AdminTags() {
  const [items, setItems] = useState<Tag[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', description_tag: '', course_id: '' });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTags();
    loadCourses();
  }, []);

  const loadCourses = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, slug')
        .eq('active', true)
        .order('title', { ascending: true });
      
      if (!error && data) setCourses(data);
    } catch (err) {
      console.error('Error loading courses:', err);
    }
  };

  const loadTags = async () => {
    // Try to load from Supabase first
    if (supabase) {
      try {
        // Carregar tags
        const { data: tagsData, error: tagsError } = await supabase
          .from('tags')
          .select('*')
          .order('name', { ascending: true });
        
        if (tagsError) throw tagsError;

        // Buscar cursos para os course_ids
        const courseIds = tagsData?.filter(t => t.course_id).map(t => t.course_id) || [];
        let coursesMap: { [key: string]: any } = {};
        
        if (courseIds.length > 0) {
          const { data: coursesData } = await supabase
            .from('courses')
            .select('id, title, slug')
            .in('id', courseIds);
          
          if (coursesData) {
            coursesMap = coursesData.reduce((acc, course) => {
              acc[course.id] = course;
              return acc;
            }, {} as { [key: string]: any });
          }
        }

        // Juntar dados
        const tagsWithCourses = tagsData?.map(tag => ({
          ...tag,
          course: tag.course_id ? coursesMap[tag.course_id] : null
        })) || [];
        
        setItems(tagsWithCourses);
        setTags(tagsWithCourses); // Sync with localStorage
        return;
      } catch (err) {
        console.error('Error loading tags from Supabase:', err);
      }
    }
    // Fallback to localStorage
    setItems(getTags());
  };

  const add = async () => {
    if (!form.name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite o nome da tag.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const tagData = {
        name: form.name.trim(),
        description_tag: form.description_tag.trim() || null,
        course_id: form.course_id || null,
      };

      if (supabase) {
        const { error } = await supabase
          .from('tags')
          .insert([tagData]);
        
        if (error) throw error;
      }

      await loadTags();
      setForm({ name: '', description_tag: '', course_id: '' });
      toast({ title: 'Tag criada!' });
    } catch (error) {
      console.error('Error creating tag:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a tag.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta tag?')) return;

    try {
      if (supabase) {
        const { error } = await supabase
          .from('tags')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      }

      await loadTags();
      toast({ title: 'Tag excluída!' });
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a tag.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Matérias / Tags do Site</h1>
        <p className="text-muted-foreground">
          Gerencie as matérias exibidas na página principal
        </p>
      </div>

      {/* Add Tag Form */}
      <div className="bg-card p-6 rounded-xl border border-border/50 mb-6">
        <h2 className="text-lg font-semibold mb-4">Nova Matéria</h2>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="tag-name">Nome da Matéria *</Label>
            <Input
              id="tag-name"
              placeholder="Ex: Português, Matemática, Direito..."
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="tag-description">Descrição</Label>
            <Textarea
              id="tag-description"
              placeholder="Breve descrição sobre a matéria (opcional)"
              value={form.description_tag}
              onChange={e => setForm({ ...form, description_tag: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="tag-course">Vincular a Curso (Opcional)</Label>
            <select
              id="tag-course"
              value={form.course_id}
              onChange={e => setForm({ ...form, course_id: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">Nenhum (redireciona para /cursos)</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Ao clicar na matéria, o usuário será direcionado para este curso
            </p>
          </div>

          <Button
            onClick={add}
            disabled={loading}
            className="gradient-bg text-primary-foreground w-fit"
          >
            <Plus className="w-4 h-4 mr-2" />
            {loading ? 'Criando...' : 'Adicionar Matéria'}
          </Button>
        </div>
      </div>

      {/* Tags List */}
      {items.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 text-center border border-border/50">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">Nenhuma matéria cadastrada</h3>
          <p className="text-muted-foreground">
            Crie sua primeira matéria usando o formulário acima.
          </p>
        </div>
      ) : (
        <div className="bg-card p-6 rounded-xl border border-border/50">
          <h2 className="text-lg font-semibold mb-4">Matérias Cadastradas ({items.length})</h2>
          <div className="grid gap-4">
            {items.map(item => (
              <div
                key={item.id}
                className="flex items-start gap-4 p-4 rounded-lg border border-border/50 hover:shadow-md transition-shadow"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                  {item.description_tag && (
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.description_tag}
                    </p>
                  )}
                  {item.course && (
                    <div className="text-xs text-primary">
                      Vinculado a: {item.course.title}
                    </div>
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => del(item.id)}
                  title="Excluir matéria"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

// Testimonials Page
export function AdminDepoimentos() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Testimonial | null>(null);
  const [form, setForm] = useState({ name: '', text: '' });
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    // Try to load from Supabase first
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (!error && data) {
          setItems(data);
          setTestimonials(data); // Sync with localStorage
          return;
        }
      } catch (err) {
        console.error('Error loading testimonials from Supabase:', err);
      }
    }
    // Fallback to localStorage
    setItems(getTestimonials());
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione um arquivo de imagem.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (100KB)
    const maxSize = 100 * 1024; // 100KB in bytes
    if (file.size > maxSize) {
      toast({
        title: 'Imagem muito grande',
        description: 'A imagem deve ter no máximo 100KB.',
        variant: 'destructive',
      });
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !supabase) return null;

    setUploading(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `testimonials/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível fazer upload da imagem.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.name.trim() || !form.text.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha nome e texto.',
        variant: 'destructive',
      });
      return;
    }

    // Upload image if a new file was selected
    let avatarUrl = selected?.avatar || '';
    if (imageFile) {
      const uploadedUrl = await uploadImage();
      if (uploadedUrl) {
        avatarUrl = uploadedUrl;
      } else {
        return; // Upload failed
      }
    }

    if (!avatarUrl) {
      toast({
        title: 'Imagem obrigatória',
        description: 'Por favor, selecione uma imagem.',
        variant: 'destructive',
      });
      return;
    }

    const testimonialData = {
      name: form.name.trim(),
      text: form.text.trim(),
      avatar: avatarUrl,
    };

    try {
      if (supabase) {
        if (selected) {
          // Update existing
          const { error } = await supabase
            .from('testimonials')
            .update(testimonialData)
            .eq('id', selected.id);
          
          if (error) throw error;
        } else {
          // Insert new
          const { error } = await supabase
            .from('testimonials')
            .insert([testimonialData]);
          
          if (error) throw error;
        }
      }

      // Reload data
      await loadTestimonials();
      
      toast({ title: 'Sucesso!', description: 'Depoimento salvo.' });
      closeDialog();
    } catch (error) {
      console.error('Error saving testimonial:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o depoimento.',
        variant: 'destructive',
      });
    }
  };

  const del = async (id: string) => {
    if (!confirm('Deseja realmente excluir este depoimento?')) return;

    try {
      // Get testimonial data to extract image path
      const testimonial = items.find(t => t.id === id);
      
      if (supabase) {
        // Delete from database first
        const { error } = await supabase
          .from('testimonials')
          .delete()
          .eq('id', id);
        
        if (error) throw error;

        // Delete image from storage if exists
        if (testimonial?.avatar) {
          try {
            // Extract file path from URL
            const urlParts = testimonial.avatar.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const filePath = `testimonials/${fileName}`;

            const { error: storageError } = await supabase.storage
              .from('images')
              .remove([filePath]);

            if (storageError) {
              console.error('Error deleting image from storage:', storageError);
            }
          } catch (storageErr) {
            console.error('Error extracting/deleting image path:', storageErr);
          }
        }
      }

      await loadTestimonials();
      toast({ title: 'Depoimento excluído!' });
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o depoimento.',
        variant: 'destructive',
      });
    }
  };

  const openDialog = (testimonial?: Testimonial) => {
    if (testimonial) {
      setSelected(testimonial);
      setForm({ name: testimonial.name, text: testimonial.text });
      setImagePreview(testimonial.avatar);
    } else {
      setSelected(null);
      setForm({ name: '', text: '' });
      setImagePreview('');
    }
    setImageFile(null);
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setSelected(null);
    setForm({ name: '', text: '' });
    setImageFile(null);
    setImagePreview('');
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Depoimentos</h1>
          <p className="text-muted-foreground">Gerencie os depoimentos de alunos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-bg text-primary-foreground" onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Depoimento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selected ? 'Editar' : 'Novo'} Depoimento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <Label>Foto do Aluno *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  {imagePreview ? (
                    <div className="space-y-3">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-full mx-auto"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                        }}
                      >
                        Remover Imagem
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Selecione uma imagem (máx. 100KB)
                        </p>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: JPG, PNG, GIF. Tamanho máximo: 100KB
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome do Aluno *</Label>
                <Input
                  id="name"
                  placeholder="Ex: João Silva"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="text">Depoimento *</Label>
                <Textarea
                  id="text"
                  placeholder="Digite o depoimento do aluno..."
                  value={form.text}
                  onChange={e => setForm({ ...form, text: e.target.value })}
                  rows={5}
                />
              </div>

              <Button
                onClick={save}
                disabled={uploading}
                className="w-full gradient-bg text-primary-foreground"
              >
                {uploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    Fazendo upload...
                  </>
                ) : (
                  'Salvar Depoimento'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 text-center border border-border/50">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold mb-2">Nenhum depoimento cadastrado</h3>
          <p className="text-muted-foreground mb-6">
            Adicione depoimentos de alunos para exibir no site.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map(item => (
            <div
              key={item.id}
              className="bg-card p-6 rounded-xl border border-border/50 hover:shadow-lg transition-shadow"
            >
              <div className="flex gap-4">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded-full"
                />
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    "{item.text}"
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openDialog(item)}
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => del(item.id)}
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

// FAQ Page
export function AdminFAQ() {
  const [items, setItems] = useState<FAQ[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<FAQ | null>(null);
  const [form, setForm] = useState({ question: '', answer: '', order: '' });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    // Try to load from Supabase first
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('faqs')
          .select('*')
          .order('order', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: true });
        
        if (!error && data) {
          setItems(data);
          setFAQs(data); // Sync with localStorage
          return;
        }
      } catch (err) {
        console.error('Error loading FAQs from Supabase:', err);
      }
    }
    // Fallback to localStorage
    setItems(getFAQs());
  };

  const save = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha pergunta e resposta.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const faqData = {
        question: form.question.trim(),
        answer: form.answer.trim(),
        order: form.order.trim() || null,
      };

      if (supabase) {
        if (selected) {
          // Update existing
          const { error } = await supabase
            .from('faqs')
            .update(faqData)
            .eq('id', selected.id);
          
          if (error) throw error;
        } else {
          // Insert new
          const { error } = await supabase
            .from('faqs')
            .insert([faqData]);
          
          if (error) throw error;
        }
      }

      await loadFAQs();
      toast({ title: 'Sucesso!', description: 'Pergunta salva.' });
      closeDialog();
    } catch (error) {
      console.error('Error saving FAQ:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a pergunta.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta pergunta?')) return;

    try {
      if (supabase) {
        const { error } = await supabase
          .from('faqs')
          .delete()
          .eq('id', id);
        
        if (error) throw error;
      }

      await loadFAQs();
      toast({ title: 'Pergunta excluída!' });
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a pergunta.',
        variant: 'destructive',
      });
    }
  };

  const openDialog = (faq?: FAQ) => {
    if (faq) {
      setSelected(faq);
      setForm({ question: faq.question, answer: faq.answer, order: (faq as any).order || '' });
    } else {
      setSelected(null);
      setForm({ question: '', answer: '', order: '' });
    }
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setSelected(null);
    setForm({ question: '', answer: '', order: '' });
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">FAQ - Perguntas Frequentes</h1>
          <p className="text-muted-foreground">Gerencie as dúvidas mais comuns</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-bg text-primary-foreground" onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Pergunta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selected ? 'Editar' : 'Nova'} Pergunta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Pergunta *</Label>
                <Input
                  id="question"
                  placeholder="Ex: Por quanto tempo tenho acesso ao curso?"
                  value={form.question}
                  onChange={e => setForm({ ...form, question: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="answer">Resposta *</Label>
                <Textarea
                  id="answer"
                  placeholder="Digite a resposta completa..."
                  value={form.answer}
                  onChange={e => setForm({ ...form, answer: e.target.value })}
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Ordem de Exibição (opcional)</Label>
                <Input
                  id="order"
                  type="text"
                  placeholder="Ex: 1, 2, 3 ou A, B, C"
                  value={form.order}
                  onChange={e => setForm({ ...form, order: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Use números ou letras para definir a ordem. Deixe vazio para ordenar por data de criação.
                </p>
              </div>

              <Button
                onClick={save}
                disabled={loading}
                className="w-full gradient-bg text-primary-foreground"
              >
                {loading ? 'Salvando...' : 'Salvar Pergunta'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="bg-card rounded-2xl p-10 text-center border border-border/50">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold mb-2">Nenhuma pergunta cadastrada</h3>
          <p className="text-muted-foreground mb-6">
            Adicione perguntas frequentes para exibir no site.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="bg-card p-6 rounded-xl border border-border/50 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                      {(item as any).order || `#${index + 1}`}
                    </span>
                    <h3 className="font-bold text-lg">{item.question}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.answer}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => openDialog(item)}
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => del(item.id)}
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

// Alunos Page
export function AdminAlunos() {
  const [users, setUsersState] = useState<User[]>([]);
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (supabase) {
        try {
          const { data, error } = await supabase.from('profiles').select('id, full_name, email, purchased_courses').neq('role', 'admin');
          if (!error && data && mounted) {
            const mapped: User[] = data.map((p: any) => ({
              id: p.id,
              name: p.full_name || '',
              email: p.email || '',
              password: '',
              avatar: '',
              purchasedCourses: Array.isArray(p.purchased_courses) ? p.purchased_courses : [],
              progress: {},
              createdAt: new Date().toISOString(),
            }));
            setUsersState(mapped);
            return;
          }
        } catch (e) {
          // fallback to localStorage
        }
      }
      if (mounted) setUsersState(getUsers().filter(u => u.email !== 'admin@admin.com'));
    };
    load();
    return () => { mounted = false; };
  }, []);
  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Alunos</h1>
      <div className="grid gap-4">{users.map(u=><div key={u.id} className="bg-card p-4 rounded-xl border flex gap-4"><div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-primary-foreground font-bold">{u.name.charAt(0)}</div><div className="flex-1"><h3 className="font-bold">{u.name}</h3><p className="text-sm text-muted-foreground">{u.email}</p></div><span className="text-sm text-muted-foreground">{u.purchasedCourses.length} cursos</span></div>)}</div>
    </AdminLayout>
  );
}

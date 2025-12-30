import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Course } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Calendar, Users, DollarSign, Loader2, Tag, CreditCard, Percent, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { DAY_LABELS, formatSessions, validateSessions } from '../../lib/schedules';
import { formatBRDateTime } from '@/lib/dates';

interface TurmaForm {
  name: string;
  course_id: string;
  start_date: string;
  sale_start_date: string;
  sale_end_date: string;
  access_end_date: string;
  presential_slots: string;
  online_slots: string;
  status: string;
  price: string;
  price_online: string;
  original_price: string;
  original_price_online: string;
  allow_credit_card: boolean;
  allow_installments: boolean;
  max_installments: string;
  allow_debit_card: boolean;
  allow_pix: boolean;
  allow_boleto: boolean;
  discount_cash: string;
  discount_pix: string;
  discount_debit: string;
  coupon_code: string;
  coupon_discount: string;
  weekdays?: string[];
  sessions?: { day: string; start: string; end: string }[];
}

interface TurmaPreco {
  id: string;
  turma_id: string;
  label?: string;
  price: string | number;
  channel: string;
  expires_at: string;
  created_at?: string;
  updated_at?: string;
}

interface Turma extends TurmaForm {
  id: string;
  course_title?: string;
  course_image?: string;
  created_at?: string;
  updated_at?: string;
}

export default function AdminTurmas() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Turma | null>(null);
  const [loading, setLoading] = useState(false);
  const [turmaPrecos, setTurmaPrecos] = useState<TurmaPreco[]>([]);
  const [loadingPrecos, setLoadingPrecos] = useState(false);
  const [precoEditingId, setPrecoEditingId] = useState<string | null>(null);
  const [precoForm, setPrecoForm] = useState({ label: '', price: '', expires_at: '', channel: 'both' });
  const [form, setForm] = useState<TurmaForm>({
    name: '',
    course_id: '',
    start_date: '',
    sale_start_date: '',
    sale_end_date: '',
    access_end_date: '',
    presential_slots: '0',
    online_slots: '0',
    status: 'active',
    price: '',
    price_online: '',
    original_price: '',
    original_price_online: '',
    allow_credit_card: true,
    allow_installments: true,
    max_installments: '12',
    allow_debit_card: true,
    allow_pix: true,
    allow_boleto: true,
    discount_cash: '0',
    discount_pix: '0',
    discount_debit: '0',
    coupon_code: '',
    coupon_discount: '0',
    weekdays: [],
    sessions: [],
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // ✨ OTIMIZAÇÃO: Executar courses + turmas em paralelo
      const [coursesResult, turmasResult] = await Promise.all([
        supabase
          .from('courses')
          .select('*')
          .order('title'),
        
        supabase
          .from('turmas')
          .select('*, course:courses (title, image)')
          .order('created_at', { ascending: false })
      ]);

      // Processar courses
      if (!coursesResult.error && coursesResult.data) {
        setCourses(coursesResult.data || []);
      } else if (coursesResult.error) {
        toast({ title: 'Erro ao carregar cursos', description: coursesResult.error.message, variant: 'destructive' });
      }

      // Processar turmas
      if (!turmasResult.error && turmasResult.data) {
        const formatted = turmasResult.data.map((t: any) => ({
          ...t,
          course_title: t.course?.title || '',
          course_image: t.course?.image || '',
          weekdays: t.weekdays || [],
          sessions: typeof t.sessions === 'string' ? JSON.parse(t.sessions) : (t.sessions || []),
        }));
        setTurmas(formatted);
      } else if (turmasResult.error) {
        toast({ title: 'Erro ao carregar turmas', description: turmasResult.error.message, variant: 'destructive' });
      }

    } catch (error: any) {
      toast({ title: 'Erro ao carregar dados', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadPrecos = async (turmaId: string) => {
    setLoadingPrecos(true);
    try {
      const { data, error } = await supabase
        .from('turma_precos_opcionais')
        .select('*')
        .eq('turma_id', turmaId)
        .order('expires_at', { ascending: true });

      if (error) throw error;
      setTurmaPrecos(data || []);
    } catch (err: any) {
      toast({ title: 'Erro ao carregar preços opcionais', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingPrecos(false);
    }
  };

  // Funções antigas removidas - agora tudo carrega em paralelo no loadData
  const loadCourses = async () => { /* deprecated */ };
  const loadTurmas = async () => { /* deprecated */ };

  const resetForm = () => {
    setForm({
      name: '',
      course_id: '',
      start_date: '',
      sale_start_date: '',
      sale_end_date: '',
      access_end_date: '',
      presential_slots: '0',
      online_slots: '0',
      status: 'active',
      price: '',
      price_online: '',
      original_price: '',
      original_price_online: '',
      allow_credit_card: true,
      allow_installments: true,
      max_installments: '12',
      allow_debit_card: true,
      allow_pix: true,
      allow_boleto: true,
      discount_cash: '0',
    discount_pix: '0',
    discount_debit: '0',
    coupon_code: '',
    coupon_discount: '0',
    weekdays: [],
    sessions: [],
  });
  setSelected(null);
};

const resetPrecoForm = () => {
  setPrecoEditingId(null);
  setPrecoForm({ label: '', price: '', expires_at: '', channel: 'both' });
};

const handleSavePreco = async () => {
  if (!selected?.id) {
    toast({ title: 'Salve a turma antes de adicionar preços opcionais', variant: 'destructive' });
    return;
  }

  try {
    setLoading(true);
    const payload = {
      turma_id: selected.id,
      label: precoForm.label || null,
      price: Number(precoForm.price) || 0,
      channel: precoForm.channel || 'both',
      expires_at: precoForm.expires_at || null,
    };

    if (precoEditingId) {
      const { error } = await supabase
        .from('turma_precos_opcionais')
        .update(payload)
        .eq('id', precoEditingId);
      if (error) throw error;
      toast({ title: 'Preço opcional atualizado' });
    } else {
      const { error } = await supabase
        .from('turma_precos_opcionais')
        .insert([payload]);
      if (error) throw error;
      toast({ title: 'Preço opcional criado' });
    }

    await loadPrecos(selected.id);
    resetPrecoForm();
  } catch (err: any) {
    toast({ title: 'Erro ao salvar preço', description: err.message, variant: 'destructive' });
  } finally {
    setLoading(false);
  }
};

const handleEditPreco = (p: TurmaPreco) => {
  setPrecoEditingId(p.id);
  setPrecoForm({ label: p.label || '', price: String(p.price || ''), expires_at: p.expires_at || '', channel: p.channel || 'both' });
};

const handleDeletePreco = async (id: string) => {
  if (!confirm('Deseja realmente excluir este preço opcional?')) return;
  try {
    setLoading(true);
    const { error } = await supabase.from('turma_precos_opcionais').delete().eq('id', id);
    if (error) throw error;
    toast({ title: 'Preço opcional excluído' });
    if (selected?.id) await loadPrecos(selected.id);
  } catch (err: any) {
    toast({ title: 'Erro ao excluir preço', description: err.message, variant: 'destructive' });
  } finally {
    setLoading(false);
  }
};
 

  const handleSave = async () => {
    if (!form.name || !form.course_id) {
      toast({ title: 'Erro', description: 'Preencha nome e curso', variant: 'destructive' });
      return;
    }

    try {
      // Validação básica das sessions
      validateSessions(form.sessions);
      setLoading(true);
      
      const turmaData = {
        name: form.name,
        course_id: form.course_id,
        start_date: form.start_date || null,
        sale_start_date: form.sale_start_date || null,
        sale_end_date: form.sale_end_date || null,
        access_end_date: form.access_end_date || null,
        presential_slots: Number(form.presential_slots) || 0,
        online_slots: Number(form.online_slots) || 0,
        status: form.status,
        price: Number(form.price) || 0,
        price_online: Number(form.price_online) || 0,
        original_price: Number(form.original_price) || 0,
        original_price_online: Number(form.original_price_online) || 0,
        allow_credit_card: form.allow_credit_card,
        allow_installments: form.allow_installments,
        max_installments: Number(form.max_installments) || 12,
        allow_debit_card: form.allow_debit_card,
        allow_pix: form.allow_pix,
        allow_boleto: form.allow_boleto,
        discount_cash: Number(form.discount_cash) || 0,
        discount_pix: Number(form.discount_pix) || 0,
        discount_debit: Number(form.discount_debit) || 0,
        coupon_code: form.coupon_code || null,
        coupon_discount: Number(form.coupon_discount) || 0,
        weekdays: form.weekdays || [],
        sessions: form.sessions || [],
      };

      if (selected?.id) {
        const { data: updatedRow, error } = await supabase
          .from('turmas')
          .update(turmaData)
          .eq('id', selected.id)
          .select()
          .single();
        
        if (error) throw error;
        // Verificar se campos foram persistidos
        if (!updatedRow.weekdays || !Array.isArray(updatedRow.weekdays)) {
          toast({ title: 'Atenção', description: 'Os dias da semana não foram salvos no banco. Verifique a coluna `weekdays`.', variant: 'destructive' });
        }
        if (!updatedRow.sessions) {
          toast({ title: 'Atenção', description: 'Os horários (sessions) não foram salvos no banco. Verifique a coluna `sessions`.', variant: 'destructive' });
        }
        toast({ title: 'Turma atualizada com sucesso!' });
      } else {
        const { data: insertedRow, error } = await supabase
          .from('turmas')
          .insert([turmaData])
          .select()
          .single();
        
        if (error) throw error;
        if (!insertedRow.weekdays || !Array.isArray(insertedRow.weekdays)) {
          toast({ title: 'Atenção', description: 'Os dias da semana não foram salvos no banco. Verifique a coluna `weekdays`.', variant: 'destructive' });
        }
        if (!insertedRow.sessions) {
          toast({ title: 'Atenção', description: 'Os horários (sessions) não foram salvos no banco. Verifique a coluna `sessions`.', variant: 'destructive' });
        }
        toast({ title: 'Turma criada com sucesso!' });
      }

      await loadData();
      setOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ title: 'Erro ao salvar turma', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta turma?')) return;

    try {
      const { error } = await supabase
        .from('turmas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({ title: 'Turma excluída com sucesso' });
      await loadData();
    } catch (error: any) {
      toast({ title: 'Erro ao excluir turma', description: error.message, variant: 'destructive' });
    }
  };

  const handleDuplicate = (turma: Turma) => {
    setSelected(null); // Não é edição, é nova turma
    setForm({
      name: turma.name + ' (Cópia)',
      course_id: turma.course_id,
      start_date: '', // Limpar data para forçar o usuário a definir nova data
      sale_start_date: turma.sale_start_date || '',
      sale_end_date: turma.sale_end_date || '',
      access_end_date: turma.access_end_date || '',
      presential_slots: String(turma.presential_slots || 0),
      online_slots: String(turma.online_slots || 0),
      status: turma.status,
      price: String(turma.price || ''),
      price_online: String(turma.price_online || ''),
      original_price: String(turma.original_price || ''),
      original_price_online: String(turma.original_price_online || ''),
      allow_credit_card: turma.allow_credit_card,
      allow_installments: turma.allow_installments,
      max_installments: String(turma.max_installments || 12),
      allow_debit_card: turma.allow_debit_card,
      allow_pix: turma.allow_pix,
      allow_boleto: turma.allow_boleto,
      discount_cash: String(turma.discount_cash || 0),
      discount_pix: String(turma.discount_pix || 0),
      discount_debit: String(turma.discount_debit || 0),
      coupon_code: turma.coupon_code || '',
      coupon_discount: String(turma.coupon_discount || 0),
      weekdays: turma.weekdays || [],
      sessions: (turma.sessions && typeof turma.sessions === 'string') ? JSON.parse(turma.sessions) : ((turma.sessions as any) || []),
    });
    setOpen(true);
    if (turma.id) loadPrecos(turma.id);
  };

  const handleEdit = (turma: Turma) => {
    setSelected(turma);
    setForm({
      name: turma.name,
      course_id: turma.course_id,
      start_date: turma.start_date || '',
      sale_start_date: turma.sale_start_date || '',
      sale_end_date: turma.sale_end_date || '',
      access_end_date: turma.access_end_date || '',
      presential_slots: String(turma.presential_slots || 0),
      online_slots: String(turma.online_slots || 0),
      status: turma.status,
      price: String(turma.price || ''),
      price_online: String(turma.price_online || ''),
      original_price: String(turma.original_price || ''),
      original_price_online: String(turma.original_price_online || ''),
      allow_credit_card: turma.allow_credit_card,
      allow_installments: turma.allow_installments,
      max_installments: String(turma.max_installments || 12),
      allow_debit_card: turma.allow_debit_card,
      allow_pix: turma.allow_pix,
      allow_boleto: turma.allow_boleto,
      discount_cash: String(turma.discount_cash || 0),
      discount_pix: String(turma.discount_pix || 0),
      discount_debit: String(turma.discount_debit || 0),
      coupon_code: turma.coupon_code || '',
      coupon_discount: String(turma.coupon_discount || 0),
      weekdays: turma.weekdays || [],
      sessions: (turma.sessions && typeof turma.sessions === 'string') ? JSON.parse(turma.sessions) : ((turma.sessions as any) || []),
    });
    setOpen(true);
    if (turma.id) loadPrecos(turma.id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500">Ativa</Badge>;
      case 'coming_soon':
        return <Badge className="bg-orange-500">Em Breve</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inativa</Badge>;
      default:
        return null;
    }
  };

  // DAY_LABELS and formatSessions moved to shared utility in src/lib/schedules.ts

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Turmas</h1>
          <p className="text-muted-foreground">Gerencie as turmas e ofertas de cursos</p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gradient-bg text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              Nova Turma
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-full sm:max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selected ? 'Editar' : 'Nova'} Turma</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Informações Básicas
                </h3>
                <div>
                  <Label>Nome da Turma *</Label>
                  <Input
                    placeholder="Ex: Turma Janeiro 2024"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Curso *</Label>
                  <Select value={form.course_id} onValueChange={(value) => setForm({ ...form, course_id: value })}>
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

                {form.course_id && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      A imagem do curso será exibida automaticamente na página principal
                    </p>
                  </div>
                )}
              </div>

              {/* Datas */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Datas de Controle
                </h3>
                <div className="mb-4">
                  <Label className="text-base font-semibold">Data de Início das Aulas *</Label>
                  <Input
                    type="date"
                    value={form.start_date}
                    onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Data em que as aulas desta turma começam. Será exibida na página do curso.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Início das Vendas</Label>
                    <Input
                      type="date"
                      value={form.sale_start_date}
                      onChange={(e) => setForm({ ...form, sale_start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Fim das Vendas</Label>
                    <Input
                      type="date"
                      value={form.sale_end_date}
                      onChange={(e) => setForm({ ...form, sale_end_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Fim do Acesso Aluno</Label>
                    <Input
                      type="date"
                      value={form.access_end_date}
                      onChange={(e) => setForm({ ...form, access_end_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Dias e Horários */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Dias e Horários
                </h3>

                <div>
                </div>

                <div>
                  <Label className="text-sm">Grade de horários (Escolha um ou mais dias)</Label>
                  <div className="space-y-2 mt-2">
                    {(form.sessions || []).map((s, idx) => (
                      <div key={idx} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <select
                          value={s.day}
                          onChange={(e) => {
                            const next = (form.sessions || []).slice();
                            next[idx] = { ...next[idx], day: e.target.value };
                            setForm({ ...form, sessions: next });
                          }}
                          className="border rounded px-2 py-1 w-20 flex-shrink-0"
                        >
                          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d) => (
                            <option key={d} value={d}>{DAY_LABELS[d]}</option>
                          ))}
                        </select>
                        <Input className="w-28 flex-shrink-0" type="time" value={s.start} onChange={(e) => { const next = (form.sessions || []).slice(); next[idx] = { ...next[idx], start: e.target.value }; setForm({ ...form, sessions: next }); }} />
                        <Input className="w-28 flex-shrink-0" type="time" value={s.end} onChange={(e) => { const next = (form.sessions || []).slice(); next[idx] = { ...next[idx], end: e.target.value }; setForm({ ...form, sessions: next }); }} />
                        <Button className="shrink-0" variant="destructive" size="icon" onClick={() => { const next = (form.sessions || []).slice(); next.splice(idx,1); setForm({ ...form, sessions: next }); }} title="Remover horário">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}

                    <div>
                      <Button onClick={() => setForm({ ...form, sessions: [...(form.sessions || []), { day: (form.weekdays && form.weekdays[0]) || 'Mon', start: '', end: '' }] })} className="mt-2 gradient-bg text-primary-foreground">
                        + Adicionar Horário
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vagas e Status */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Vagas e Status
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Vagas Presenciais</Label>
                    <Input
                      type="number"
                      placeholder="0 = ilimitado"
                      value={form.presential_slots}
                      onChange={(e) => setForm({ ...form, presential_slots: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Vagas Online</Label>
                    <Input
                      type="number"
                      placeholder="0 = ilimitado"
                      value={form.online_slots}
                      onChange={(e) => setForm({ ...form, online_slots: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativa (vende)</SelectItem>
                        <SelectItem value="coming_soon">Em Breve (bloqueia)</SelectItem>
                        <SelectItem value="inactive">Desativada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Preços */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Preços
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label className="font-semibold">Presencial</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label>Preço Original (R$) (Opcional)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={form.original_price}
                          onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Preço de Venda (R$) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={form.price}
                          onChange={(e) => setForm({ ...form, price: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="font-semibold">Online</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <div>
                        <Label>Preço Original (R$) (Opcional)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={form.original_price_online}
                          onChange={(e) => setForm({ ...form, original_price_online: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Preço de Venda (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={form.price_online}
                          onChange={(e) => setForm({ ...form, price_online: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Se não preencher o preço online, apenas a modalidade presencial estará disponível
                </p>
                                <p className="text-xs text-muted-foreground">
                  Se não preencher o preço original, apenas o preço de venda será exibido na página do curso
                </p>

                {selected?.id && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Preços Opcionais (Presencial / Online)
                    </h4>

                    {loadingPrecos ? (
                      <p className="text-sm text-muted-foreground">Carregando preços opcionais...</p>
                    ) : (
                      <div className="space-y-2">
                        {turmaPrecos.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Nenhum preço opcional cadastrado para esta turma.</p>
                        ) : (
                          <div className="space-y-2">
                            {turmaPrecos.map((p) => (
                              <div key={p.id} className="flex items-center justify-between bg-muted/40 p-2 rounded">
                                <div>
                                  <div className="font-medium">{p.label || (p.channel === 'presential' ? 'Presencial' : p.channel === 'online' ? 'Online' : 'Ambos')}</div>
                                  <div className="text-sm text-muted-foreground">
                                    R$ {Number(p.price).toFixed(2)} • expira em {formatBRDateTime(p.expires_at)}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className="text-xs px-2 py-1">
                                    {p.channel === 'both' ? 'Ambos' : p.channel === 'presential' ? 'Presencial' : 'Online'}
                                  </Badge>
                                  <Button variant="outline" size="icon" onClick={() => handleEditPreco(p)} title="Editar preço">
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button variant="destructive" size="icon" onClick={() => handleDeletePreco(p.id)} title="Excluir preço">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                          <div>
                            <Label>Texto curto</Label>
                            <Input value={precoForm.label} onChange={(e) => setPrecoForm({ ...precoForm, label: e.target.value })} placeholder="Ex: Oferta até dia..." />
                          </div>
                          <div>
                            <Label>Valor (R$)</Label>
                            <Input type="number" step="0.01" value={precoForm.price} onChange={(e) => setPrecoForm({ ...precoForm, price: e.target.value })} />
                          </div>
                          <div>
                            <Label>Expira em</Label>
                            <Input type="date" value={precoForm.expires_at} onChange={(e) => setPrecoForm({ ...precoForm, expires_at: e.target.value })} />
                          </div>
                          <div>
                            <Label>Canal</Label>
                            <Select value={precoForm.channel} onValueChange={(v) => setPrecoForm({ ...precoForm, channel: v })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="presential">Presencial</SelectItem>
                                <SelectItem value="online">Online</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={handleSavePreco} className="gradient-bg text-primary-foreground" disabled={loading}>
                            {precoEditingId ? 'Atualizar preço' : 'Adicionar preço'}
                          </Button>
                          <Button variant="ghost" onClick={resetPrecoForm}>Cancelar</Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Formas de Pagamento */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Formas de Pagamento
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Cartão de Crédito à Vista</Label>
                    <Switch
                      checked={form.allow_credit_card}
                      onCheckedChange={(checked) => setForm({ ...form, allow_credit_card: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Parcelamento no Cartão</Label>
                    <Switch
                      checked={form.allow_installments}
                      onCheckedChange={(checked) => setForm({ ...form, allow_installments: checked })}
                    />
                  </div>
                  
                  {form.allow_installments && (
                    <div className="ml-6">
                      <Label>Número Máximo de Parcelas</Label>
                      <Input
                        type="number"
                        min="2"
                        max="24"
                        value={form.max_installments}
                        onChange={(e) => setForm({ ...form, max_installments: e.target.value })}
                      />
                    </div>
                  )}

                  {/*
                  <div className="flex items-center justify-between">
                    <Label>Cartão de Débito</Label>
                    <Switch
                      checked={form.allow_debit_card}
                      onCheckedChange={(checked) => setForm({ ...form, allow_debit_card: checked })}
                    />
                  </div>
                  */}

                  <div className="flex items-center justify-between">
                    <Label>PIX</Label>
                    <Switch
                      checked={form.allow_pix}
                      onCheckedChange={(checked) => setForm({ ...form, allow_pix: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Boleto Bancário</Label>
                    <Switch
                      checked={form.allow_boleto}
                      onCheckedChange={(checked) => setForm({ ...form, allow_boleto: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Descontos */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  Descontos por Forma de Pagamento (R$)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Cartão à Vista</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={form.discount_cash}
                      onChange={(e) => setForm({ ...form, discount_cash: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>PIX</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={form.discount_pix}
                      onChange={(e) => setForm({ ...form, discount_pix: e.target.value })}
                    />
                  </div>
                  {/*
                  <div>
                    <Label>Débito</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={form.discount_debit}
                      onChange={(e) => setForm({ ...form, discount_debit: e.target.value })}
                    />
                  </div>
                  */}
                </div>
              </div>

              {/* Cupom */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Cupom Promocional
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Código do Cupom</Label>
                    <Input
                      placeholder="Ex: PROMO100"
                      value={form.coupon_code}
                      onChange={(e) => setForm({ ...form, coupon_code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div>
                    <Label>Desconto (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={form.coupon_discount}
                      onChange={(e) => setForm({ ...form, coupon_discount: e.target.value })}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Cupom com 100% de desconto = matrícula gratuita
                </p>
              </div>

              <Button 
                onClick={handleSave} 
                className="w-full gradient-bg text-primary-foreground"
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar Turma'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">Carregando turmas...</p>
        </div>
      ) : turmas.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhuma turma cadastrada</h3>
          <p className="text-muted-foreground mb-4">Crie sua primeira turma para organizar as vendas</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {turmas.map((turma) => (
            <div key={turma.id} className="bg-card p-5 rounded-xl border border-border/50">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                {turma.course_image && (
                  <img 
                    src={turma.course_image} 
                    alt={turma.course_title}
                    className="w-full md:w-20 h-40 md:h-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold">{turma.name}</h3>
                    {getStatusBadge(turma.status)}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{turma.course_title}</p>
                  
                  <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    {turma.start_date && (
                      <span className="flex items-center gap-1 font-semibold text-primary">
                        <Calendar className="w-3 h-3" />
                        Início das Aulas: {formatBRDateTime(turma.start_date)}
                      </span>
                    )}
                    {turma.sessions && turma.sessions.length > 0 && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatSessions(turma.sessions)}
                      </span>
                    )}
                    
                    {(turma.sale_start_date || turma.sale_end_date) && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Vendas: {turma.sale_start_date && formatBRDateTime(turma.sale_start_date)}
                        {turma.sale_start_date && turma.sale_end_date && ' - '}
                        {turma.sale_end_date && formatBRDateTime(turma.sale_end_date)}
                      </span>
                    )}
                    
                    {(Number(turma.presential_slots) > 0 || Number(turma.online_slots) > 0) && (
                      <span>
                        Vagas: {Number(turma.presential_slots) || 0} presencial, {Number(turma.online_slots) || 0} online
                      </span>
                    )}
                    
                    {turma.coupon_code && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Cupom: {turma.coupon_code} ({Number(turma.coupon_discount || 0)}%)
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right mt-3 md:mt-0 md:ml-4">
                  {turma.original_price && Number(turma.original_price) > Number(turma.price) && (
                    <p className="text-xs text-muted-foreground line-through">
                      R$ {Number(turma.original_price).toFixed(2)}
                    </p>
                  )}
                  <p className="text-xl font-bold text-primary">
                    R$ {Number(turma.price || 0).toFixed(2)}
                  </p>
                </div>
                
                <div className="flex gap-2 mt-3 md:mt-0">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleDuplicate(turma)}
                    title="Duplicar turma com nova data"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleEdit(turma)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => handleDelete(turma.id)}>
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

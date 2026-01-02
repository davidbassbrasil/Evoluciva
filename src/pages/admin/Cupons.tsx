import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Ticket, User, Users, Calendar, Percent, Loader2, CheckCircle2, XCircle, AlertCircle, Power, Eye, Mail, Phone, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';
import { formatBRDateTime } from '@/lib/dates';

interface TurmaCoupon {
  id: string;
  name: string;
  course_title: string | null;
  coupon_code: string;
  coupon_discount: number;
  coupon_active: boolean;
  created_at: string;
  type: 'turma';
}

interface ProfileCoupon {
  id: string;
  code: string;
  discount_value: number;
  uses_remaining: number;
  active: boolean;
  created_at: string;
  profile: {
    id: string;
    full_name: string;
    email: string;
  };
  type: 'profile';
}

type Coupon = TurmaCoupon | ProfileCoupon;

export default function AdminCupons() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [turmaCoupons, setTurmaCoupons] = useState<TurmaCoupon[]>([]);
  const [profileCoupons, setProfileCoupons] = useState<ProfileCoupon[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'turma' | 'profile'>('all');
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Dialog de visualização do aluno
  const [openStudentView, setOpenStudentView] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentEnrollments, setStudentEnrollments] = useState<any[]>([]);
  const [loadingStudent, setLoadingStudent] = useState(false);

  useEffect(() => {
    loadAllCoupons();
  }, []);

  // Reset página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const loadAllCoupons = async () => {
    if (!supabase) {
      toast({ title: 'Erro', description: 'Supabase não configurado', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);

      // Buscar cupons de turmas
      const { data: turmas, error: turmasError } = await supabase
        .from('turmas')
        .select('id, name, course:courses(title), coupon_code, coupon_discount, coupon_active, created_at')
        .not('coupon_code', 'is', null)
        .neq('coupon_code', '')
        .order('created_at', { ascending: false });

      if (turmasError) throw turmasError;

      const turmasWithType = (turmas || []).map(t => ({
        id: t.id,
        name: t.name,
        course_title: t.course?.title || null,
        coupon_code: t.coupon_code || '',
        coupon_discount: t.coupon_discount || 0,
        coupon_active: t.coupon_active !== false,
        created_at: t.created_at,
        type: 'turma' as const,
      }));

      // Buscar cupons de perfil
      const { data: profiles, error: profilesError } = await supabase
        .from('profile_coupons')
        .select(`
          id,
          code,
          discount_value,
          uses_remaining,
          active,
          created_at,
          profile:profiles(id, full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const profilesWithType = (profiles || []).map(p => ({
        ...p,
        type: 'profile' as const,
      }));

      setTurmaCoupons(turmasWithType);
      setProfileCoupons(profilesWithType as ProfileCoupon[]);
    } catch (err: any) {
      console.error('Erro ao carregar cupons:', err);
      toast({ title: 'Erro', description: err.message || 'Não foi possível carregar cupons', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleProfileCouponStatus = async (id: string, currentStatus: boolean) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('profile_coupons')
        .update({ active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({ 
        title: currentStatus ? 'Cupom desativado' : 'Cupom ativado',
        description: currentStatus ? 'O cupom foi desativado' : 'O cupom foi reativado'
      });
      
      await loadAllCoupons();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Não foi possível alterar status', variant: 'destructive' });
    }
  };

  const toggleTurmaCouponStatus = async (turmaId: string, currentStatus: boolean) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('turmas')
        .update({ coupon_active: !currentStatus })
        .eq('id', turmaId);

      if (error) throw error;

      toast({ 
        title: currentStatus ? 'Cupom da turma desativado' : 'Cupom da turma ativado',
        description: currentStatus ? 'O cupom foi desativado e não poderá ser usado' : 'O cupom foi reativado e está disponível'
      });
      
      await loadAllCoupons();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message || 'Não foi possível alterar status do cupom', variant: 'destructive' });
    }
  };

  const loadStudentDetails = async (profileId: string) => {
    if (!supabase) return;
    
    setLoadingStudent(true);
    setOpenStudentView(true);
    
    try {
      // Buscar perfil do aluno
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email, whatsapp, cpf, city, state, created_at')
        .eq('id', profileId)
        .single();

      if (profileError) throw profileError;
      setSelectedStudent(profile);

      // Buscar matrículas
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          turma_id,
          modality,
          payment_status,
          access_expires_at,
          enrolled_at,
          turmas ( id, name, course_id, course:courses ( id, title ) )
        `)
        .eq('profile_id', profileId)
        .order('enrolled_at', { ascending: false });

      if (enrollmentsError) throw enrollmentsError;
      setStudentEnrollments(enrollments || []);
    } catch (err: any) {
      console.error('Erro ao carregar dados do aluno:', err);
      toast({ title: 'Erro', description: err.message || 'Não foi possível carregar dados do aluno', variant: 'destructive' });
    } finally {
      setLoadingStudent(false);
    }
  };

  // Filtrar cupons
  const filteredCoupons: Coupon[] = (() => {
    let allCoupons: Coupon[] = [];

    if (filterType === 'all' || filterType === 'turma') {
      allCoupons = [...allCoupons, ...turmaCoupons];
    }

    if (filterType === 'all' || filterType === 'profile') {
      allCoupons = [...allCoupons, ...profileCoupons];
    }

    if (!searchTerm.trim()) return allCoupons;

    const term = searchTerm.toLowerCase();
    return allCoupons.filter(c => {
      if (c.type === 'turma') {
        return (
          c.coupon_code.toLowerCase().includes(term) ||
          c.name.toLowerCase().includes(term) ||
          (c.course_title && c.course_title.toLowerCase().includes(term))
        );
      } else {
        return (
          c.code.toLowerCase().includes(term) ||
          c.profile.full_name.toLowerCase().includes(term) ||
          c.profile.email.toLowerCase().includes(term)
        );
      }
    });
  })();

  const totalTurmaCoupons = turmaCoupons.length;
  const activeTurmaCoupons = turmaCoupons.filter(c => c.coupon_active).length;
  const totalProfileCouponsUses = profileCoupons.reduce((sum, c) => sum + c.uses_remaining, 0);
  const activeProfileCoupons = profileCoupons.filter(c => c.active).length;
  const totalUsesRemaining = profileCoupons
    .filter(c => c.active)
    .reduce((sum, c) => sum + c.uses_remaining, 0);
  const totalActiveCoupons = activeTurmaCoupons + totalUsesRemaining;

  // Calcular paginação
  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCoupons = filteredCoupons.slice(startIndex, endIndex);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Ticket className="h-8 w-8 text-primary" />
                Gerenciamento de Cupons
              </h1>
              <p className="text-muted-foreground mt-1">
                Visualize e gerencie todos os cupons de desconto criados <span className="text-red-500">(crie ou exclua novos cupons no menu alunos).</span>
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cupons Ativos</p>
                <p className="text-3xl font-bold mt-1 text-green-600">{totalActiveCoupons}</p>
              </div>
              <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cupons de Turma</p>
                <p className="text-3xl font-bold mt-1">{totalTurmaCoupons}</p>
              </div>
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cupons de Aluno</p>
                <p className="text-3xl font-bold mt-1">{totalProfileCouponsUses}</p>
              </div>
              <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, turma, aluno ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
              >
                Todos
              </Button>
              <Button
                variant={filterType === 'turma' ? 'default' : 'outline'}
                onClick={() => setFilterType('turma')}
              >
                Turmas
              </Button>
              <Button
                variant={filterType === 'profile' ? 'default' : 'outline'}
                onClick={() => setFilterType('profile')}
              >
                Alunos
              </Button>
            </div>
          </div>
        </Card>

        {/* Coupons Table */}
        <Card>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum cupom encontrado</h3>
              <p className="text-muted-foreground mt-2">
                {searchTerm || filterType !== 'all'
                  ? 'Tente ajustar os filtros'
                  : 'Crie cupons em Turmas ou Alunos'}
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Vinculado a</TableHead>
                    <TableHead>Usos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCoupons.map((coupon) => {
                    if (coupon.type === 'turma') {
                      return (
                        <TableRow key={`turma-${coupon.id}`}>
                          <TableCell>
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-600">
                              <Users className="h-3 w-3 mr-1" />
                              Turma
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono font-semibold">
                            {coupon.coupon_code}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-green-600 font-semibold">
                              <Percent className="h-3 w-3" />
                              {coupon.coupon_discount}%
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{coupon.name}</div>
                              {coupon.course_title && (
                                <div className="text-xs text-muted-foreground">{coupon.course_title}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-muted-foreground">Ilimitado</span>
                          </TableCell>
                          <TableCell>
                            {coupon.coupon_active ? (
                              <Badge className="bg-green-500">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Ativo
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="h-3 w-3 mr-1" />
                                Inativo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatBRDateTime(coupon.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleTurmaCouponStatus(coupon.id, coupon.coupon_active)}
                                title={coupon.coupon_active ? 'Desativar' : 'Ativar'}
                                className={coupon.coupon_active ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground hover:text-primary'}
                              >
                                <Power className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/admin/turmas`)}
                                title="Ver Turma"
                              >
                                <Users className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    } else {
                      return (
                        <TableRow key={`profile-${coupon.id}`}>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-600">
                              <User className="h-3 w-3 mr-1" />
                              Aluno
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono font-semibold">
                            {coupon.code}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-green-600 font-semibold">
                              R$ {Number(coupon.discount_value).toFixed(2)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{coupon.profile.full_name}</div>
                              <div className="text-xs text-muted-foreground">{coupon.profile.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {coupon.uses_remaining > 0 ? (
                                <Badge variant="outline">
                                  {coupon.uses_remaining} {coupon.uses_remaining === 1 ? 'uso' : 'usos'}
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Esgotado
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {coupon.active ? (
                              <Badge className="bg-green-500">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Ativo
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="h-3 w-3 mr-1" />
                                Inativo
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatBRDateTime(coupon.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleProfileCouponStatus(coupon.id, coupon.active)}
                                title={coupon.active ? 'Desativar' : 'Ativar'}
                                className={coupon.active ? 'text-green-600 hover:text-green-700' : 'text-muted-foreground hover:text-primary'}
                              >
                                <Power className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => loadStudentDetails(coupon.profile.id)}
                                title="Ver Aluno"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {/* Paginação */}
        {!loading && filteredCoupons.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {startIndex + 1} a {Math.min(endIndex, filteredCoupons.length)} de {filteredCoupons.length} cupons
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              <Select value={String(itemsPerPage)} onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 / pág</SelectItem>
                  <SelectItem value="50">50 / pág</SelectItem>
                  <SelectItem value="100">100 / pág</SelectItem>
                  <SelectItem value="200">200 / pág</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Dialog de Visualização do Aluno */}
        <Dialog open={openStudentView} onOpenChange={setOpenStudentView}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Detalhes do Aluno
              </DialogTitle>
            </DialogHeader>
            
            {loadingStudent ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : selectedStudent ? (
              <div className="space-y-6">
                {/* Informações do Perfil */}
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold text-lg">Informações Pessoais</h3>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Nome Completo</p>
                        <p className="font-medium">{selectedStudent.full_name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{selectedStudent.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">WhatsApp</p>
                          <p className="font-medium">{selectedStudent.whatsapp || '-'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">CPF</p>
                        <p className="font-medium">{selectedStudent.cpf || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cidade/Estado</p>
                        <p className="font-medium">{selectedStudent.city || '-'} / {selectedStudent.state || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cadastrado em</p>
                        <p className="font-medium">{formatBRDateTime(selectedStudent.created_at)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Matrículas */}
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      Matrículas ({studentEnrollments.length})
                    </h3>
                  </CardHeader>
                  <CardContent>
                    {studentEnrollments.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nenhuma matrícula encontrada</p>
                    ) : (
                      <div className="space-y-3">
                        {studentEnrollments.map((enrollment) => (
                          <div key={enrollment.id} className="flex items-start justify-between p-3 border rounded-lg">
                            <div className="flex items-start gap-3">
                              <GraduationCap className="w-5 h-5 text-muted-foreground mt-1" />
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium">{enrollment.turmas?.name || 'Turma'}</span>
                                  {enrollment.modality === 'online' && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                                      Online
                                    </Badge>
                                  )}
                                  {enrollment.modality === 'presential' && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                      Presencial
                                    </Badge>
                                  )}
                                  {enrollment.payment_status === 'free' && (
                                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                                      Cortesia
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Curso: {enrollment.turmas?.course?.title || '-'}
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Matriculado em: {formatBRDateTime(enrollment.enrolled_at)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Ações */}
                <div className="flex gap-2 justify-end pt-4">
                  <Button variant="outline" onClick={() => setOpenStudentView(false)}>
                    Fechar
                  </Button>
                  <Button onClick={() => {
                    setOpenStudentView(false);
                    navigate(`/admin/alunos`);
                  }}>
                    Ir para Admin/Alunos
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-destructive py-12 text-center">Aluno não encontrado</p>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

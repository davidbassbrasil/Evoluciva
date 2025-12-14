import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import ModuleFormDialog from "@/components/admin/ModuleFormDialog";
import { useModules, useStudentsWithModuleStatus, deleteModule, getModuleStats, getTurmasForFilter, toggleDelivery } from "@/lib/moduleService";
import { Module } from "@/types";
import { Plus, Search, MoreVertical, Edit, Trash2, Package, CheckCircle2, AlertCircle, Loader2, PackageCheck, Download, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Componente para exibir entregas inline
function ModuleDeliveriesRow({ module, onRefresh }: { module: Module; onRefresh: () => void }) {
  const { toast } = useToast();
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const STUDENTS_PER_PAGE = 20;
  const { students, loading: loadingStudents, refetch: refetchStudents } = useStudentsWithModuleStatus(module.turma_id || "", module.id);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; name?: string } | null>(null);

  const handleToggleDelivery = async (studentId: string, studentName?: string) => {
    try {
      setProcessingIds(prev => new Set(prev).add(studentId));
      const result = await toggleDelivery(module.id, studentId);
      toast({ 
        title: result.delivered ? "Entrega registrada" : "Entrega removida", 
        description: result.delivered ? "O módulo foi marcado como entregue" : "O registro de entrega foi removido" 
      });
      await refetchStudents();
      onRefresh();
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Erro ao atualizar entrega", variant: "destructive" });
    } finally {
      setProcessingIds(prev => { const newSet = new Set(prev); newSet.delete(studentId); return newSet; });
    }
  };

  const exportToPDF = () => {
    if (!students.length) return;
    
    const deliveredCount = students.filter(s => s.delivered).length;
    const totalCount = students.length;
    const percentage = Math.round((deliveredCount/totalCount)*100);
    
    const normalize = (v: string) => (v || '').toString().replace(/\D/g, '').toLowerCase();
    const normalizeName = (v: string) => (v || '').toString().toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
    const termNorm = normalize(studentSearchTerm);
    const termNameNorm = normalizeName(studentSearchTerm);

    const dataToExport = students.filter(student => 
      normalizeName(student.student_name).includes(termNameNorm) || 
      normalize(student.student_cpf).includes(termNorm)
    );
    
    // Create printable HTML
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório de Entregas - ${module.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; border-bottom: 2px solid #6366f1; padding-bottom: 10px; }
          h2 { color: #666; font-size: 14px; margin-bottom: 20px; }
          .info { margin-bottom: 20px; color: #666; }
          .stats { display: flex; gap: 20px; margin-bottom: 20px; }
          .stat-card { padding: 15px; border-radius: 8px; background: #f3f4f6; }
          .stat-card.delivered { background: #d1fae5; }
          .stat-card.pending { background: #fed7aa; }
          .stat-label { font-size: 12px; color: #666; }
          .stat-value { font-size: 24px; font-weight: bold; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #6366f1; color: white; padding: 10px; text-align: left; font-size: 12px; }
          td { padding: 8px 10px; border-bottom: 1px solid #ddd; font-size: 11px; }
          tr:nth-child(even) { background: #f9f9f9; }
          .badge { padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; }
          .badge.delivered { background: #10b981; color: white; }
          .badge.pending { background: #f59e0b; color: white; }
          .footer { margin-top: 30px; text-align: center; color: #999; font-size: 10px; }
        </style>
      </head>
      <body>
        <h1>Relatório de Entregas de Módulos</h1>
        <h2>Módulo: ${module.name} - Turma: ${module.turma_name || "N/A"}</h2>
        <div class="info">
          Gerado em: ${new Date().toLocaleString('pt-BR')}
        </div>
        <div class="stats">
          <div class="stat-card">
            <div class="stat-label">Total de Alunos</div>
            <div class="stat-value">${totalCount}</div>
          </div>
          <div class="stat-card delivered">
            <div class="stat-label">Entregues</div>
            <div class="stat-value">${deliveredCount}</div>
          </div>
          <div class="stat-card pending">
            <div class="stat-label">Pendentes</div>
            <div class="stat-value">${totalCount - deliveredCount}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Progresso</div>
            <div class="stat-value">${percentage}%</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Nome</th>
              <th>CPF</th>
              <th>Status</th>
              <th>Data de Entrega</th>
            </tr>
          </thead>
          <tbody>
            ${dataToExport.map((student, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${student.student_name}</td>
                <td>${student.student_cpf || '-'}</td>
                <td>
                  <span class="badge ${student.delivered ? 'delivered' : 'pending'}">
                    ${student.delivered ? 'Entregue' : 'Pendente'}
                  </span>
                </td>
                <td>${student.delivered_at ? new Date(student.delivered_at).toLocaleDateString('pt-BR') : '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">Evoluciva - Sistema de Gestão de Cursos</div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const normalize = (v: string) => (v || '').toString().replace(/\D/g, '').toLowerCase();
  const normalizeName = (v: string) => (v || '').toString().toLowerCase()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
  const termNorm = normalize(studentSearchTerm);
  const termNameNorm = normalizeName(studentSearchTerm);

  const filteredStudents = students.filter(student => {
    const nomeNormalizado = normalizeName(student.student_name);
    const cpfNormalizado = normalize(student.student_cpf);
    
    // Buscar por nome (apenas se termNameNorm não estiver vazio)
    const nameMatch = termNameNorm.length > 0 && nomeNormalizado.includes(termNameNorm);
    
    // Buscar por CPF (apenas se termNorm não estiver vazio)
    const cpfMatch = termNorm.length > 0 && cpfNormalizado.includes(termNorm);
    
    // Se o termo de busca estiver vazio, retorna true (mostra todos)
    if (studentSearchTerm.trim() === '') {
      return true;
    }
    
    return nameMatch || cpfMatch;
  });

  const deliveredCount = students.filter(s => s.delivered).length;
  const percentage = students.length > 0 ? Math.round((deliveredCount / students.length) * 100) : 0;

  // Paginação
  const totalStudentsPages = Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE);
  const paginatedStudents = filteredStudents.slice(
    (studentPage - 1) * STUDENTS_PER_PAGE, 
    studentPage * STUDENTS_PER_PAGE
  );

  // Reset página quando buscar
  useEffect(() => {
    setStudentPage(1);
  }, [studentSearchTerm]);

  return (
    <TableRow>
      <TableCell colSpan={8} className="p-0 bg-muted/30">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Controle de Entregas - {module.name}</h3>
            <Button variant="outline" size="sm" onClick={exportToPDF} disabled={!students.length}>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Total de Alunos</div>
              <div className="text-2xl font-bold mt-1">{students.length}</div>
            </Card>
            <Card className="p-4 bg-green-500/10">
              <div className="text-sm text-muted-foreground">Entregues</div>
              <div className="text-2xl font-bold text-green-600 mt-1">{deliveredCount}</div>
            </Card>
            <Card className="p-4 bg-orange-500/10">
              <div className="text-sm text-muted-foreground">Pendentes</div>
              <div className="text-2xl font-bold text-orange-600 mt-1">{students.length - deliveredCount}</div>
            </Card>
          </div>

          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso de entregas</span>
                <span className="font-medium">{percentage}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div className="bg-primary h-3 rounded-full transition-all" style={{ width: `${percentage}%` }} />
              </div>
            </div>
          </Card>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou CPF..." 
              value={studentSearchTerm} 
              onChange={(e) => setStudentSearchTerm(e.target.value)} 
              className="pl-9" 
            />
          </div>

          <Card>
            {loadingStudents ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Aluno</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Confirmação Aluno</TableHead>
                      <TableHead className="text-center">Data Entrega</TableHead>
                      <TableHead className="text-center w-24">Entregue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground h-32">
                          {studentSearchTerm ? "Nenhum aluno encontrado" : "Nenhum aluno matriculado nesta turma"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedStudents.map((student, index) => {
                        const globalIndex = (studentPage - 1) * STUDENTS_PER_PAGE + index;
                        return (
                          <TableRow key={student.student_id}>
                            <TableCell className="font-medium">{globalIndex + 1}</TableCell>
                            <TableCell className="font-medium">{student.student_name}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{student.student_cpf || '-'}</TableCell>
                            <TableCell className="text-center">
                              {student.delivered ? (
                                <Badge className="bg-green-500">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Entregue
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-orange-600 border-orange-600">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Pendente
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {student.delivered && student.student_confirmed ? (
                                <div className="flex flex-col items-center gap-1">
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                    ✓ Confirmado
                                  </Badge>
                                  {student.confirmed_at && (
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(student.confirmed_at).toLocaleDateString("pt-BR")}
                                    </span>
                                  )}
                                </div>
                              ) : student.delivered ? (
                                <span className="text-muted-foreground text-xs">Aguardando</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {student.delivered_at ? new Date(student.delivered_at).toLocaleDateString("pt-BR") : "-"}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <Checkbox 
                                  checked={student.delivered} 
                                  onCheckedChange={() => {
                                    if (student.delivered) {
                                      setConfirmTarget({ id: student.student_id, name: student.student_name });
                                      setConfirmOpen(true);
                                    } else {
                                      handleToggleDelivery(student.student_id, student.student_name);
                                    }
                                  }}
                                  disabled={processingIds.has(student.student_id)} 
                                />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>

          {totalStudentsPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {(studentPage - 1) * STUDENTS_PER_PAGE + 1} a {Math.min(studentPage * STUDENTS_PER_PAGE, filteredStudents.length)} de {filteredStudents.length} alunos
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setStudentPage(p => Math.max(1, p - 1))} 
                      className={studentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                    />
                  </PaginationItem>
                  {Array.from({ length: totalStudentsPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink 
                        onClick={() => setStudentPage(page)} 
                        isActive={studentPage === page} 
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setStudentPage(p => Math.min(totalStudentsPages, p + 1))} 
                      className={studentPage === totalStudentsPages ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </TableCell>
      {/* Confirmation dialog for unchecking delivery */}
      <AlertDialog open={confirmOpen} onOpenChange={(open) => { if (!open) { setConfirmTarget(null); } setConfirmOpen(open); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alteração</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desmarcar a entrega do módulo: "{module.name}" de {confirmTarget?.name || 'este aluno'}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmTarget) return;
                await handleToggleDelivery(confirmTarget.id, confirmTarget.name);
                setConfirmOpen(false);
                setConfirmTarget(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TableRow>
  );
}

export default function AdminModulos() {
  const { toast } = useToast();
  const [selectedTurma, setSelectedTurma] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalStock: 0, delivered: 0, available: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const MODULES_PER_PAGE = 20;

  const { modules, loading, refetch } = useModules(selectedTurma === "all" ? undefined : selectedTurma);

  useEffect(() => {
    const loadTurmas = async () => {
      try {
        const data = await getTurmasForFilter();
        setTurmas(data);
      } catch (error) {
        console.error("Erro ao carregar turmas:", error);
      }
    };
    loadTurmas();
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      setLoadingStats(true);
      const turmaFilter = selectedTurma === "all" ? undefined : selectedTurma;
      const data = await getModuleStats(turmaFilter);
      setStats(data);
      setLoadingStats(false);
    };
    loadStats();
  }, [modules, selectedTurma]);

  useEffect(() => { 
    setCurrentPage(1); 
  }, [searchTerm, selectedTurma]);

  const handleEdit = (module: Module) => { 
    setSelectedModule(module); 
    setFormDialogOpen(true); 
  };

  const handleDelete = async () => {
    if (!selectedModule) return;
    try {
      setDeleting(true);
      await deleteModule(selectedModule.id);
      toast({ title: "Módulo excluído", description: "O módulo foi excluído com sucesso" });
      refetch();
      setDeleteDialogOpen(false);
      setSelectedModule(null);
    } catch (error: any) {
      toast({ title: "Erro", description: error.message || "Erro ao excluir módulo", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleExpand = (moduleId: string) => {
    setExpandedModuleId(expandedModuleId === moduleId ? null : moduleId);
  };

  const handleCloseFormDialog = () => { 
    setFormDialogOpen(false); 
    setSelectedModule(null); 
  };

  const handleSuccess = () => { 
    refetch(); 
  };

  const filteredModules = modules.filter((module) => 
    module.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    module.turma_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    module.course_title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalModulesPages = Math.ceil(filteredModules.length / MODULES_PER_PAGE);
  const paginatedModules = filteredModules.slice((currentPage - 1) * MODULES_PER_PAGE, currentPage * MODULES_PER_PAGE);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Módulos</h1>
            <p className="text-muted-foreground">Controle de estoque e entregas de módulos por turma</p>
          </div>
          <Button onClick={() => setFormDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Módulo
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Registro em Estoque</p>
                {loadingStats ? (
                  <Loader2 className="h-6 w-6 animate-spin mt-2" />
                ) : (
                  <p className="text-3xl font-bold mt-1">{stats.totalStock}</p>
                )}
              </div>
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Módulos Entregues</p>
                {loadingStats ? (
                  <Loader2 className="h-6 w-6 animate-spin mt-2" />
                ) : (
                  <p className="text-3xl font-bold mt-1 text-green-600">{stats.delivered}</p>
                )}
              </div>
              <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disponíveis</p>
                {loadingStats ? (
                  <Loader2 className="h-6 w-6 animate-spin mt-2" />
                ) : (
                  <p className="text-3xl font-bold mt-1 text-orange-600">{stats.available}</p>
                )}
              </div>
              <div className="h-12 w-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar módulos..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-9" 
              />
            </div>
            <Select value={selectedTurma} onValueChange={setSelectedTurma}>
              <SelectTrigger className="w-full md:w-[280px]">
                <SelectValue placeholder="Filtrar por turma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as turmas</SelectItem>
                {turmas.map((turma) => (
                  <SelectItem key={turma.id} value={turma.id}>
                    {turma.name}{turma.course?.title && ` - ${turma.course.title}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredModules.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum módulo encontrado</h3>
              <p className="text-muted-foreground mt-2">
                {searchTerm || selectedTurma !== "all" ? "Tente ajustar os filtros" : "Comece criando um novo módulo"}
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead className="text-center">Estoque</TableHead>
                    <TableHead className="text-center">Entregues</TableHead>
                    <TableHead className="text-center">Alunos</TableHead>
                    <TableHead className="text-center">Progresso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedModules.map((module) => {
                    const percentage = module.total_students && module.total_students > 0 
                      ? Math.round(((module.delivered_count || 0) / module.total_students) * 100) 
                      : 0;
                    const isExpanded = expandedModuleId === module.id;

                    return (
                      <>
                        <TableRow key={module.id} className={isExpanded ? "bg-muted/50" : ""}>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleToggleExpand(module.id)}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">{module.name}</TableCell>
                          <TableCell>{module.turma_name}</TableCell>
                          <TableCell className="text-muted-foreground">{module.course_title}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{module.stock_quantity}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-green-500">{module.delivered_count || 0}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary">{module.total_students || 0}</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <div className="w-20 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all" 
                                  style={{ width: `${percentage}%` }} 
                                />
                              </div>
                              <span className="text-sm text-muted-foreground min-w-[40px]">
                                {percentage}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEdit(module)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => { setSelectedModule(module); setDeleteDialogOpen(true); }} 
                                    className="text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <ModuleDeliveriesRow module={module} onRefresh={refetch} />
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        {totalModulesPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {(currentPage - 1) * MODULES_PER_PAGE + 1} a {Math.min(currentPage * MODULES_PER_PAGE, filteredModules.length)} de {filteredModules.length} módulos
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                  />
                </PaginationItem>
                {Array.from({ length: totalModulesPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink 
                      onClick={() => setCurrentPage(page)} 
                      isActive={currentPage === page} 
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(p => Math.min(totalModulesPages, p + 1))} 
                    className={currentPage === totalModulesPages ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      <ModuleFormDialog 
        open={formDialogOpen} 
        onOpenChange={handleCloseFormDialog} 
        module={selectedModule} 
        turmas={turmas} 
        onSuccess={handleSuccess} 
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o módulo "{selectedModule?.name}"? Esta ação também removerá todos os registros de entrega relacionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              disabled={deleting} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

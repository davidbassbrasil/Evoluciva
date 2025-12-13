import { useState } from 'react';
import { Module } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useStudentsWithModuleStatus, toggleDelivery } from '@/lib/moduleService';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, Search, CheckCircle2, XCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ModuleDeliveriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module: Module | null;
  onUpdate: () => void;
}

// Extender o tipo do jsPDF para incluir autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export default function ModuleDeliveriesDialog({
  open,
  onOpenChange,
  module,
  onUpdate,
}: ModuleDeliveriesDialogProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  
  const { students, loading, refetch } = useStudentsWithModuleStatus(
    module?.turma_id || '',
    module?.id
  );

  const handleToggleDelivery = async (studentId: string) => {
    if (!module) return;

    try {
      setProcessingIds(prev => new Set(prev).add(studentId));
      
      const result = await toggleDelivery(module.id, studentId);
      
      toast({
        title: result.delivered ? 'Entrega registrada' : 'Entrega removida',
        description: result.delivered
          ? 'O módulo foi marcado como entregue'
          : 'O registro de entrega foi removido',
      });

      await refetch();
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar entrega',
        variant: 'destructive',
      });
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });
    }
  };

  const exportToPDF = () => {
    if (!module || !students.length) return;

    const doc = new jsPDF();

    // Título
    doc.setFontSize(18);
    doc.text('Relatório de Entregas de Módulos', 14, 20);

    // Informações do módulo
    doc.setFontSize(12);
    doc.text(`Módulo: ${module.name}`, 14, 30);
    doc.text(`Turma: ${module.turma_name || 'N/A'}`, 14, 37);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 44);

    // Estatísticas
    const deliveredCount = students.filter(s => s.delivered).length;
    const totalCount = students.length;
    doc.text(`Entregas: ${deliveredCount}/${totalCount} (${Math.round((deliveredCount/totalCount)*100)}%)`, 14, 51);

    // Tabela
    const tableData = filteredStudents.map((student, index) => [
      index + 1,
      student.student_name,
      student.student_email,
      student.delivered ? 'Sim' : 'Não',
      student.delivered_at
        ? new Date(student.delivered_at).toLocaleDateString('pt-BR')
        : '-',
    ]);

    doc.autoTable({
      startY: 58,
      head: [['#', 'Nome', 'Email', 'Entregue', 'Data Entrega']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 50 },
        2: { cellWidth: 60 },
        3: { cellWidth: 20 },
        4: { cellWidth: 30 },
      },
    });

    // Salvar PDF
    const fileName = `modulo_${module.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    toast({
      title: 'PDF exportado',
      description: 'O relatório foi baixado com sucesso',
    });
  };

  const filteredStudents = students.filter(student =>
    student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deliveredCount = students.filter(s => s.delivered).length;
  const percentage = students.length > 0 ? Math.round((deliveredCount / students.length) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Controle de Entregas</span>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToPDF}
              disabled={!students.length}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          </DialogTitle>
          <DialogDescription>
            {module?.name} - {module?.turma_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Total de Alunos</div>
              <div className="text-2xl font-bold">{students.length}</div>
            </div>
            <div className="bg-green-500/10 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Entregues</div>
              <div className="text-2xl font-bold text-green-600">{deliveredCount}</div>
            </div>
            <div className="bg-orange-500/10 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground">Pendentes</div>
              <div className="text-2xl font-bold text-orange-600">
                {students.length - deliveredCount}
              </div>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso de entregas</span>
              <span className="font-medium">{percentage}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Tabela de alunos */}
          <div className="flex-1 overflow-auto border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Aluno</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Data Entrega</TableHead>
                    <TableHead className="text-center w-24">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        {searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno matriculado'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student, index) => (
                      <TableRow key={student.student_id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{student.student_name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {student.student_email}
                        </TableCell>
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
                          {student.delivered_at
                            ? new Date(student.delivered_at).toLocaleDateString('pt-BR')
                            : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Checkbox
                              checked={student.delivered}
                              onCheckedChange={() => handleToggleDelivery(student.student_id)}
                              disabled={processingIds.has(student.student_id)}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

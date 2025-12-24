import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStudentModules, confirmModuleReceipt } from "@/lib/moduleService";
import { Package, CheckCircle2, Clock, Loader2, Settings, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, logout, getPreviewStudentId, clearPreviewStudentId } from '@/lib/localStorage';
import { exitPreviewAndCloseWindow } from '@/lib/previewUtils';
import { supabase } from '@/lib/supabaseClient';
import logoPng from "@/assets/logo_.png";

export default function AlunoModulos() {
  const { toast } = useToast();
  const previewId = getPreviewStudentId();
  const { modules, loading, refetch } = useStudentModules(previewId);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const previewId = getPreviewStudentId();
    const user = getCurrentUser();
    if (!user && !previewId) {
      navigate('/aluno/login');
      return;
    }

    if (previewId) {
      // Fetch profile for preview name
      (async () => {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', previewId)
            .single();
          setUserName(profile?.full_name || 'Aluno');
        } catch (e) {
          setUserName('Aluno');
        }
      })();
    } else {
      setUserName(user.name);
    }
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate('/aluno/login');
  };

  const handleConfirm = async (deliveryId: string) => {
    try {
      setConfirmingId(deliveryId);
      await confirmModuleReceipt(deliveryId);
      toast({
        title: "Confirmação registrada",
        description: "Você confirmou o recebimento do módulo com sucesso",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao confirmar recebimento",
        variant: "destructive",
      });
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {previewId && (
        <div className="bg-yellow-50 border-b border-yellow-200 text-yellow-900 py-2 px-4 text-sm flex items-center justify-between">
          <div>Visualizando como aluno — <strong>MODO ADMIN</strong></div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => { clearPreviewStudentId(); exitPreviewAndCloseWindow(); }}>Sair do modo visualização</Button>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-foreground text-primary-foreground py-4 px-6 sticky top-0 z-50">
        <div className="w-full md:container md:mx-auto flex items-center justify-between">
          <Link to="/aluno/dashboard" className="flex items-center gap-2">
            <img src={logoPng} alt="Logo" className="h-10" />
          </Link>

          <div className="flex items-center gap-4">
            <span className="text-sm hidden md:block">Olá, {userName.split(' ')[0]}</span>
            <Link to="/aluno/configuracoes">
              <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/10">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/10"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Meus Módulos</h1>
            <p className="text-muted-foreground">
              Confirme o recebimento dos módulos que foram entregues para você
            </p>
          </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : modules.length === 0 ? (
          <Card className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Package className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Nenhum módulo entregue</h3>
              <p className="text-muted-foreground mt-2">
                Quando módulos forem entregues para você, eles aparecerão aqui
              </p>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead>Curso</TableHead>
                    <TableHead className="text-center">Data de Entrega</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modules.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {delivery.module.name}
                        </div>
                      </TableCell>
                      <TableCell>{delivery.module.turma?.name || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {delivery.module.turma?.course?.title || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {formatBRDateTime(delivery.delivered_at)}
                      </TableCell>
                      <TableCell className="text-center">
                        {delivery.student_confirmed ? (
                          <Badge className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Confirmado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            <Clock className="h-3 w-3 mr-1" />
                            Aguardando Confirmação
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {delivery.student_confirmed ? (
                          <div className="text-sm text-muted-foreground">
                            Confirmado em{" "}
                            {formatBRDateTime(delivery.confirmed_at)}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleConfirm(delivery.id)}
                            disabled={confirmingId === delivery.id}
                          >
                            {confirmingId === delivery.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Confirmando...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Confirmar Recebimento
                              </>
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {modules.length > 0 && (
          <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100">
                  Por que confirmar o recebimento?
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  A confirmação garante que você recebeu o material físico do módulo.
                  Isso ajuda a administração a ter controle sobre as entregas realizadas.
                </p>
              </div>
            </div>
          </Card>
        )}
        </div>
      </main>
    </div>
  );
}

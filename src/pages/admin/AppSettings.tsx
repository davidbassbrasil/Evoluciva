import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

export default function AppSettings() {
  const { toast } = useToast();
  const [financeEnabled, setFinanceEnabled] = useState<boolean>(true);
  const [modulesEnabled, setModulesEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadFlags = async () => {
      if (!supabase) return;
      try {
        const results: any[] = await Promise.allSettled([
          supabase.from('app_settings').select('value').eq('key', 'active_aluno_financeiro').single(),
          supabase.from('app_settings').select('value').eq('key', 'active_aluno_modulos').single(),
        ]);

        const fRes = results[0].status === 'fulfilled' ? results[0].value : null;
        const mRes = results[1].status === 'fulfilled' ? results[1].value : null;

        if (fRes && fRes.data && fRes.data.value !== undefined) {
          const v = fRes.data.value;
          setFinanceEnabled(Boolean(v === true || v === 'true' || v === '"true"' || v === '1' || v === 1));
        }

        if (mRes && mRes.data && mRes.data.value !== undefined) {
          const v = mRes.data.value;
          setModulesEnabled(Boolean(v === true || v === 'true' || v === '"true"' || v === '1' || v === 1));
        }
      } catch (err) {
        console.error('Erro ao carregar app settings:', err);
      }
    };

    loadFlags();
  }, []);

  const toggleFlag = async (key: string, value: boolean, setter: (v: boolean) => void, label: string) => {
    if (!supabase) return;
    // Optimistic update
    const previous = (key === 'active_aluno_financeiro') ? financeEnabled : modulesEnabled;
    setter(value);
    setLoading(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({ key, value }, { onConflict: ['key'] });

      if (error) {
        // revert on error
        setter(previous);
        throw error;
      }
      toast({ title: 'Sucesso', description: `${label} ${value ? 'ativado' : 'desativado'}.` });
    } catch (err: any) {
      console.error(`Erro ao atualizar ${key}:`, err);
      toast({ title: 'Erro', description: err.message || 'Não foi possível atualizar a configuração.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">App Settings</h1>
          <p className="text-muted-foreground">Configurações globais do aplicativo</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Financeiro (alunos)</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="font-medium">Mostrar menu Financeiro para alunos</div>
                <div className="text-sm text-muted-foreground">Ativa ou desativa o menu financeiro na dashboard do aluno.</div>
              </div>
              <div>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Switch
                    checked={financeEnabled}
                    disabled={loading}
                    onCheckedChange={(v) => toggleFlag('active_aluno_financeiro', Boolean(v), setFinanceEnabled, 'Financeiro')}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Módulos (alunos)</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="font-medium">Mostrar menu Módulos para alunos</div>
                <div className="text-sm text-muted-foreground">Habilita/desabilita o acesso aos módulos na dashboard do aluno.</div>
              </div>
              <div>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Switch
                    checked={modulesEnabled}
                    disabled={loading}
                    onCheckedChange={(v) => toggleFlag('active_aluno_modulos', Boolean(v), setModulesEnabled, 'Módulos')}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

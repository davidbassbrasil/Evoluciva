import { useState, useEffect } from 'react';
import { Module } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createModule, updateModule } from '@/lib/moduleService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface ModuleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module?: Module | null;
  turmas: { id: string; name: string; course?: { title: string } }[];
  onSuccess: () => void;
}

export default function ModuleFormDialog({
  open,
  onOpenChange,
  module,
  turmas,
  onSuccess,
}: ModuleFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    turma_id: '',
    stock_quantity: 0,
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: module?.name || '',
        turma_id: module?.turma_id || '',
        stock_quantity: module?.stock_quantity || 0,
      });
    }
  }, [module, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.turma_id) {
      toast({
        title: 'Erro',
        description: 'Nome e turma são obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);

      if (module?.id) {
        await updateModule(module.id, formData);
        toast({
          title: 'Módulo atualizado',
          description: 'O módulo foi atualizado com sucesso',
        });
      } else {
        await createModule(formData);
        toast({
          title: 'Módulo criado',
          description: 'O módulo foi criado com sucesso',
        });
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar módulo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {module ? 'Editar Módulo' : 'Novo Módulo'}
          </DialogTitle>
          <DialogDescription>
            {module
              ? 'Atualize as informações do módulo'
              : 'Cadastre um novo módulo para controle de entregas'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Módulo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Módulo 1 - Introdução"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="turma">Turma *</Label>
            <Select
              value={formData.turma_id}
              onValueChange={(value) => setFormData({ ...formData, turma_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a turma" />
              </SelectTrigger>
              <SelectContent>
                {turmas.map((turma) => (
                  <SelectItem key={turma.id} value={turma.id}>
                    {turma.name}
                    {turma.course?.title && ` - ${turma.course.title}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock_quantity">Quantidade em Estoque</Label>
            <Input
              id="stock_quantity"
              type="number"
              min="0"
              value={formData.stock_quantity}
              onChange={(e) =>
                setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {module ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

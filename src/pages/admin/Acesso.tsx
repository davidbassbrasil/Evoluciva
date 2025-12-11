import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Search, UserCog, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabaseClient';

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface Permission {
  key: string;
  label: string;
  description: string;
}

const AVAILABLE_PERMISSIONS: Permission[] = [
  { key: 'dashboard', label: 'Dashboard', description: 'Visualizar estatísticas gerais' },
  { key: 'banners', label: 'Banners', description: 'Gerenciar banners da home' },
  { key: 'cursos', label: 'Cursos', description: 'Criar e editar cursos' },
  { key: 'turmas', label: 'Turmas', description: 'Gerenciar turmas e matrículas' },
  { key: 'aulas', label: 'Aulas', description: 'Adicionar e editar aulas' },
  { key: 'professores', label: 'Professores', description: 'Gerenciar professores' },
  { key: 'tags', label: 'Tags', description: 'Gerenciar tags de cursos' },
  { key: 'depoimentos', label: 'Depoimentos', description: 'Gerenciar depoimentos' },
  { key: 'faq', label: 'FAQ', description: 'Gerenciar perguntas frequentes' },
  { key: 'alunos', label: 'Alunos', description: 'Gerenciar alunos e matrículas' },
  { key: 'financeiro', label: 'Financeiro', description: 'Visualizar e gerenciar pagamentos' },
];

export default function AdminAcesso() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('role', ['admin', 'moderator'])
        .order('full_name');

      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserPermissions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('permission_key')
        .eq('user_id', userId);

      if (error) throw error;
      setUserPermissions(data?.map(p => p.permission_key) || []);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as permissões.',
        variant: 'destructive',
      });
    }
  };

  const openPermissionsDialog = async (user: Profile) => {
    setSelectedUser(user);
    await loadUserPermissions(user.id);
    setOpenDialog(true);
  };

  const togglePermission = (permissionKey: string) => {
    if (userPermissions.includes(permissionKey)) {
      setUserPermissions(userPermissions.filter(p => p !== permissionKey));
    } else {
      setUserPermissions([...userPermissions, permissionKey]);
    }
  };

  const savePermissions = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      // Deletar todas as permissões antigas
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', selectedUser.id);

      // Inserir novas permissões
      if (userPermissions.length > 0) {
        const permissionsToInsert = userPermissions.map(key => ({
          user_id: selectedUser.id,
          permission_key: key,
        }));

        const { error } = await supabase
          .from('user_permissions')
          .insert(permissionsToInsert);

        if (error) throw error;
      }

      toast({
        title: 'Sucesso!',
        description: 'Permissões atualizadas com sucesso.',
      });

      setOpenDialog(false);
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as permissões.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const changeUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      // Se mudar para admin, remover todas as permissões (admin tem tudo)
      if (newRole === 'admin') {
        await supabase
          .from('user_permissions')
          .delete()
          .eq('user_id', userId);
      }

      toast({
        title: 'Sucesso!',
        description: 'Função do usuário atualizada.',
      });

      loadUsers();
    } catch (error) {
      console.error('Erro ao alterar função:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar a função do usuário.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Controle de Acesso</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie permissões de administradores e moderadores
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <div className="bg-card rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-semibold">Usuário</th>
                    <th className="text-left p-4 font-semibold">E-mail</th>
                    <th className="text-left p-4 font-semibold">Função</th>
                    <th className="text-left p-4 font-semibold">Permissões</th>
                    <th className="text-right p-4 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-muted-foreground">
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="p-4">
                          <div className="font-medium">{user.full_name}</div>
                        </td>
                        <td className="p-4 text-muted-foreground">{user.email}</td>
                        <td className="p-4">
                          <Select
                            value={user.role}
                            onValueChange={(value) => changeUserRole(user.id, value)}
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-4 h-4 text-red-500" />
                                  <span>Administrador</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="moderator">
                                <div className="flex items-center gap-2">
                                  <UserCog className="w-4 h-4 text-blue-500" />
                                  <span>Moderador</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-4">
                          {user.role === 'admin' ? (
                            <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">
                              Acesso Total
                            </Badge>
                          ) : (
                            <Badge variant="outline">Personalizado</Badge>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {user.role === 'moderator' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openPermissionsDialog(user)}
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              Gerenciar
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Permissions Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Permissões de {selectedUser?.full_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="text-sm text-muted-foreground mb-4">
                Selecione quais módulos este moderador pode acessar:
              </div>

              {AVAILABLE_PERMISSIONS.map((permission) => (
                <div
                  key={permission.key}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium mb-1">{permission.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {permission.description}
                    </div>
                  </div>
                  <Switch
                    checked={userPermissions.includes(permission.key)}
                    onCheckedChange={() => togglePermission(permission.key)}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOpenDialog(false)}
                disabled={saving}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={savePermissions} disabled={saving}>
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Permissões
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

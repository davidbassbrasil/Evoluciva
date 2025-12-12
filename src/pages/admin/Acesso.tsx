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
  { key: 'tags', label: 'Matérias', description: 'Gerenciar tags de cursos' },
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
  const [openNewUserDialog, setOpenNewUserDialog] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'moderator' as 'admin' | 'moderator',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
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

  const createNewUser = async () => {
    if (!newUserForm.full_name || !newUserForm.email || !newUserForm.password) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos',
        variant: 'destructive',
      });
      return;
    }

    if (newUserForm.password.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    try {
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserForm.email,
        password: newUserForm.password,
        options: {
          data: {
            full_name: newUserForm.full_name,
          },
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error('Usuário não foi criado');
      }

      // Aguardar profile ser criado pelo trigger do Supabase
      let profileExists = false;
      let attempts = 0;
      
      while (!profileExists && attempts < 15) {
        await new Promise(resolve => setTimeout(resolve, 400));
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('id', authData.user.id)
          .single();
        
        if (profile) {
          profileExists = true;
          console.log('Profile criado:', profile);
        }
        attempts++;
      }

      if (!profileExists) {
        throw new Error('Timeout ao aguardar criação do perfil');
      }

      // DELETAR o profile criado automaticamente e criar um novo com o role correto
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', authData.user.id);

      if (deleteError) {
        console.error('Erro ao deletar profile:', deleteError);
      }

      // Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 500));

      // Criar profile com o role correto
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: newUserForm.email,
          full_name: newUserForm.full_name,
          role: newUserForm.role
        })
        .select()
        .single();

      console.log('Profile criado:', { newProfile, insertError });

      if (insertError) {
        console.error('Erro ao criar profile:', insertError);
        throw new Error(`Erro ao criar perfil: ${insertError.message || JSON.stringify(insertError)}`);
      }

      // Se for moderador, criar permissões padrão (dashboard apenas)
      if (newUserForm.role === 'moderator') {
        const { error: permError } = await supabase
          .from('user_permissions')
          .insert({
            user_id: authData.user.id,
            permission_key: 'dashboard'
          });

        if (permError) {
          console.error('Erro ao criar permissão padrão:', permError);
          // Não bloqueia a criação, apenas avisa
        }
      }

      toast({
        title: 'Sucesso!',
        description: `${newUserForm.role === 'admin' ? 'Administrador' : 'Moderador'} criado com sucesso!${newUserForm.role === 'moderator' ? ' Configure as permissões clicando em "Configurar Permissões".' : ''}`,
      });

      setOpenNewUserDialog(false);
      setNewUserForm({
        full_name: '',
        email: '',
        password: '',
        role: 'moderator',
      });
      loadUsers();
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      
      let errorMessage = 'Não foi possível criar o usuário.';
      
      if (error.message?.includes('already registered')) {
        errorMessage = 'Este e-mail já está cadastrado no sistema.';
      } else if (error.message?.includes('Timeout')) {
        errorMessage = 'O perfil está demorando para ser criado. Aguarde um momento e recarregue a página.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
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
          <Button onClick={() => setOpenNewUserDialog(true)}>
            <UserCog className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
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

        {/* New User Dialog */}
        <Dialog open={openNewUserDialog} onOpenChange={setOpenNewUserDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Novo Usuário Admin/Moderador</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nome completo</Label>
                <Input
                  id="full_name"
                  placeholder="Digite o nome completo"
                  value={newUserForm.full_name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select
                  value={newUserForm.role}
                  onValueChange={(value: 'admin' | 'moderator') => 
                    setNewUserForm({ ...newUserForm, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-red-500" />
                        <span>Administrador (Acesso Total)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="moderator">
                      <div className="flex items-center gap-2">
                        <UserCog className="w-4 h-4 text-blue-500" />
                        <span>Moderador (Permissões Personalizadas)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
                <p>
                  {newUserForm.role === 'admin' 
                    ? '✓ Terá acesso completo a todas as áreas do sistema'
                    : '⚠️ Você poderá configurar as permissões após criar o usuário'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setOpenNewUserDialog(false);
                  setNewUserForm({
                    full_name: '',
                    email: '',
                    password: '',
                    role: 'moderator',
                  });
                }}
                disabled={creating}
              >
                Cancelar
              </Button>
              <Button onClick={createNewUser} disabled={creating}>
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </>
                ) : (
                  <>
                    <UserCog className="w-4 h-4 mr-2" />
                    Criar Usuário
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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

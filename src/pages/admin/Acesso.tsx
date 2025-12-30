import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Search, UserCog, Save, X, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
  { key: 'dashboard', label: 'Dashboard', description: 'Estatísticas gerais - O botão não pode ser desabilitado!' },
  { key: 'banners', label: 'Banners', description: 'Gerenciar banners da home' },
  { key: 'popups', label: 'Popups', description: 'Gerenciar popup da homepage' },
  { key: 'cursos', label: 'Cursos', description: 'Criar e editar cursos' },
  { key: 'turmas', label: 'Turmas', description: 'Gerenciar turmas e matrículas' },
  { key: 'aulas', label: 'Aulas', description: 'Adicionar e editar aulas' },
  { key: 'professores', label: 'Professores', description: 'Gerenciar professores' },
  { key: 'tags', label: 'Matérias', description: 'Gerenciar tags de cursos' },
  { key: 'depoimentos', label: 'Depoimentos', description: 'Gerenciar depoimentos' },
  { key: 'faq', label: 'FAQ', description: 'Gerenciar perguntas frequentes' },
  { key: 'alunos', label: 'Alunos', description: 'Gerenciar alunos e matrículas' },
  { key: 'financeiro', label: 'Financeiro', description: 'Visualizar e gerenciar pagamentos' },
  { key: 'modulos', label: 'Módulos', description: 'Controle de estoque e entregas de módulos' },
  { key: 'app_settings', label: 'App Settings', description: 'Acesso à página de configurações globais do aplicativo' },
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState(false);
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
      // Garantir que a permissão 'dashboard' sempre exista e fique marcada
      const permsRaw = data?.map(p => p.permission_key) || [];
      // Remover duplicatas vindas do banco (se houver) e garantir dashboard
      const perms = Array.from(new Set(permsRaw));
      if (!perms.includes('dashboard')) {
        // Coloca 'dashboard' no começo para consistência
        perms.unshift('dashboard');
      }
      setUserPermissions(perms);
    } catch (error) {
      console.error('Erro ao carregar permissões:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as permissões.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleting(true);
    try {
      // Remove permissions associated with the user first
      await supabase.from('user_permissions').delete().eq('user_id', deletingUser.id);

      // Remove profile
      const { error } = await supabase.from('profiles').delete().eq('id', deletingUser.id);
      if (error) throw error;

      toast({ title: 'Usuário excluído', description: 'O usuário foi removido com sucesso.' });
      setDeleteDialogOpen(false);
      setDeletingUser(null);
      loadUsers();
    } catch (error: any) {
      console.error('Erro ao excluir usuário:', error);
      toast({ title: 'Erro', description: error.message || 'Não foi possível excluir o usuário.', variant: 'destructive' });
    } finally {
      setDeleting(false);
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

      // Inserir novas permissões (deduplicando para evitar chaves duplicadas)
      const uniqueKeys = Array.from(new Set(userPermissions));
      // Garantir que dashboard esteja presente
      if (!uniqueKeys.includes('dashboard')) uniqueKeys.unshift('dashboard');

      if (uniqueKeys.length > 0) {
        const permissionsToInsert = uniqueKeys.map(key => ({
          user_id: selectedUser.id,
          permission_key: key,
        }));

        // Usar upsert com onConflict para tolerar possíveis duplicatas e evitar 23505
        const { error } = await supabase
          .from('user_permissions')
          .upsert(permissionsToInsert, { onConflict: ['user_id', 'permission_key'] });

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

      // Atualizar o profile criado automaticamente com o role correto
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          email: newUserForm.email,
          full_name: newUserForm.full_name,
          role: newUserForm.role
        })
        .eq('id', authData.user.id)
        .select()
        .single();

      console.log('Profile atualizado:', { updatedProfile, updateError });

      if (updateError) {
        // Caso raro: se update falhar por conflito/perm, tentar upsert (insere ou atualiza)
        const { data: upsertProfile, error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: newUserForm.email,
            full_name: newUserForm.full_name,
            role: newUserForm.role
          })
          .select()
          .single();

        if (upsertError) {
          console.error('Erro ao upsert profile:', upsertError);
          throw new Error(`Erro ao criar perfil: ${upsertError.message || JSON.stringify(upsertError)}`);
        }
      }

      // Se for moderador, criar permissões padrão (dashboard apenas)
      if (newUserForm.role === 'moderator') {
        // Usar upsert para evitar tentativa de inserir duplicata (23505)
        const { error: permError } = await supabase
          .from('user_permissions')
          .upsert({
            user_id: authData.user.id,
            permission_key: 'dashboard'
          }, { onConflict: ['user_id', 'permission_key'] });

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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Controle de Acesso</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie permissões de administradores e moderadores
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <Button onClick={() => setOpenNewUserDialog(true)} className="w-full sm:w-auto mt-3 sm:mt-0">
              <UserCog className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
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
              className="pl-10 w-full"
            />
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : (
          <>
            {/* Mobile users cards (hidden on md+) */}
            <div className="md:hidden space-y-3">
              {filteredUsers.map((user) => (
                <div key={user.id} className="p-4 bg-card rounded-lg border">
                  <div className="font-medium">{user.full_name}</div>
                  <div className="text-sm text-muted-foreground">{user.email}</div>

                  <div className="mt-3">
                    <Select
                      value={user.role}
                      onValueChange={(value) => changeUserRole(user.id, value)}
                    >
                      <SelectTrigger className="w-full">
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
                  </div>

                  <div className="mt-3 flex flex-col gap-2">
                    <div>
                      {user.role === 'admin' ? (
                        <Badge className="bg-red-500/10 text-red-600">Acesso Total</Badge>
                      ) : (
                        <Badge variant="outline">Personalizado</Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {user.role === 'moderator' && (
                        <Button size="sm" variant="outline" onClick={() => openPermissionsDialog(user)} className="flex-1">
                          <Shield className="w-4 h-4 mr-2" />
                          Gerenciar
                        </Button>
                      )}

                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { setDeletingUser(user); setDeleteDialogOpen(true); }}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table (hidden on small screens) */}
            <div className="hidden md:block bg-card rounded-lg border">
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
                            <SelectTrigger className="w-full md:w-[180px]">
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
                          <div className="flex items-center justify-end gap-2">
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

                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => { setDeletingUser(user); setDeleteDialogOpen(true); }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
            </>
        )}

        {/* New User Dialog */}
        <Dialog open={openNewUserDialog} onOpenChange={setOpenNewUserDialog}>
            <DialogContent className="w-full max-w-full sm:max-w-md">
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

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
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
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button onClick={createNewUser} disabled={creating} className="w-full sm:w-auto">
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
            <DialogContent className="w-full max-w-full sm:max-w-2xl max-h-[80vh] overflow-y-auto">
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
                        checked={userPermissions.includes(permission.key) || permission.key === 'dashboard'}
                        onCheckedChange={() => { if (permission.key !== 'dashboard') togglePermission(permission.key); }}
                        disabled={permission.key === 'dashboard'}
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setOpenDialog(false)}
                disabled={saving}
                className="w-full sm:w-auto"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={savePermissions} disabled={saving} className="w-full sm:w-auto">
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

        {/* Delete confirmation dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o usuário "{deletingUser?.full_name}"? Esta ação é irreversível.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleting}>
                {deleting ? 'Excluindo...' : 'Confirmar exclusão'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Plus, Key, Users, Trash2, Shield, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ManagedUser {
  id: string;
  email: string;
  created_at: string;
  role?: string;
  display_password?: string | null;
}

interface UserManagerPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UserManagerPopup: React.FC<UserManagerPopupProps> = ({ open, onOpenChange }) => {
  const { isEditor } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'editor' | 'readonly'>('readonly');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const getFunctionErrorMessage = async (error: any) => {
    if (error?.context?.json) {
      try {
        const payload = await error.context.json();
        if (payload?.error) return payload.error as string;
      } catch {
      }
    }
    return error?.message || 'Erro ao processar solicitação';
  };

  const ensureValidPassword = (password: string) => {
    if (password.length === 0) {
      toast({ description: 'Digite uma senha', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-users', {
        body: { action: 'list_users' },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.users) setUsers(data.users);
    } catch (err: any) {
      toast({ description: await getFunctionErrorMessage(err), variant: 'destructive' });
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open && isEditor) fetchUsers();
  }, [open, isEditor]);

  const invoke = async (body: any, successMsg: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-users', { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ description: successMsg });
      return true;
    } catch (err: any) {
      toast({ description: await getFunctionErrorMessage(err), variant: 'destructive' });
      return false;
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    if (!ensureValidPassword(newPassword)) return;

    const email = `${newName.trim().toLowerCase().replace(/\s+/g, '')}@wemerson.app`;
    const ok = await invoke({ action: 'create_user', email, password: newPassword }, `Usuário ${newName} criado`);
    if (ok) {
      if (newRole === 'editor') {
        const { data } = await supabase.functions.invoke('manage-users', { body: { action: 'list_users' } });
        const newUser = data?.users?.find((u: any) => u.email === email);
        if (newUser) {
          await invoke({ action: 'update_role', user_id: newUser.id, role: 'editor' }, 'Permissão definida');
        }
      }
      setNewName('');
      setNewPassword('');
      setNewRole('readonly');
      fetchUsers();
    }
  };

  const handleUpdatePassword = async (userId: string) => {
    if (!editPassword.trim()) return;
    if (!ensureValidPassword(editPassword)) return;

    const ok = await invoke({ action: 'update_password', user_id: userId, password: editPassword }, 'Senha atualizada');
    if (ok) { setExpandedId(null); setEditPassword(''); }
  };

  const handleUpdateEmail = async (userId: string) => {
    if (!editEmail.trim()) return;
    const email = editEmail.includes('@') ? editEmail : `${editEmail.trim().toLowerCase().replace(/\s+/g, '')}@wemerson.app`;
    const ok = await invoke({ action: 'update_email', user_id: userId, email }, 'Email atualizado');
    if (ok) { setEditEmail(''); fetchUsers(); }
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    await invoke({ action: 'update_role', user_id: userId, role }, `Permissão alterada para ${role}`);
    fetchUsers();
  };

  const handleDeleteUser = async (userId: string) => {
    const ok = await invoke({ action: 'delete_user', user_id: userId }, 'Usuário excluído permanentemente');
    if (ok) fetchUsers();
  };

  if (!isEditor) return null;

  const getDisplayName = (email: string) => email.replace('@wemerson.app', '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-xl h-[85vh] max-h-[85vh] flex flex-col overflow-hidden p-0 gap-0">
        <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-base"><Users className="h-5 w-5" /> Gerenciar Usuários</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 h-full">
          <div className="px-4 pb-4 space-y-3">
            {/* Create user */}
            <div className="space-y-2 border-b border-border pb-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Novo usuário</p>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome (ex: FERNANDA)"
                className="h-8 text-sm"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Senha"
                  className="h-8 text-sm flex-1"
                  type="text"
                />
                <Select value={newRole} onValueChange={(v: 'editor' | 'readonly') => setNewRole(v)}>
                  <SelectTrigger className="h-8 text-xs w-full sm:w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="readonly">Visualizador</SelectItem>
                    <SelectItem value="editor">Editor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} size="sm" className="h-8 w-full text-xs"><Plus className="h-4 w-4 mr-1" /> Criar usuário</Button>
              {newName && (
                <p className="text-[10px] text-muted-foreground">
                  Login: {newName.trim().toLowerCase().replace(/\s+/g, '')}
                </p>
              )}
            </div>

            {/* Users list */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Usuários ({users.length})</p>
                <Button variant="ghost" size="sm" onClick={fetchUsers} className="h-6 text-[10px]">Atualizar</Button>
              </div>
              {loading && <p className="text-xs text-muted-foreground">Carregando...</p>}
              {users.map(u => {
                const isExpanded = expandedId === u.id;
                const displayName = getDisplayName(u.email);
                return (
                  <div key={u.id} className="rounded-lg border border-border/50 bg-secondary/20 overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 cursor-pointer" onClick={() => { setExpandedId(isExpanded ? null : u.id); setEditPassword(''); setEditEmail(''); }}>
                      <span className="text-sm text-foreground flex-1 truncate font-medium">{displayName}</span>
                      {u.display_password ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono whitespace-nowrap">
                          {u.display_password}
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400 whitespace-nowrap">
                          sem senha
                        </span>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap ${u.role === 'editor' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {u.role === 'editor' ? 'editor' : 'visualizador'}
                      </span>
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-2 border-t border-border/30 pt-2">
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> Usuário</label>
                          <div className="flex gap-1.5">
                            <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder={displayName} className="h-7 text-xs flex-1 min-w-0" />
                            <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 shrink-0" onClick={() => handleUpdateEmail(u.id)} disabled={!editEmail.trim()}>Salvar</Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground flex items-center gap-1"><Key className="h-3 w-3" /> Senha</label>
                          <div className="flex gap-1.5">
                            <Input value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Nova senha" className="h-7 text-xs flex-1 min-w-0" type="text" />
                            <Button size="sm" variant="outline" className="h-7 text-[10px] px-2 shrink-0" onClick={() => handleUpdatePassword(u.id)} disabled={!editPassword.length}>Salvar</Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground flex items-center gap-1"><Shield className="h-3 w-3" /> Permissão</label>
                          <Select value={u.role || 'readonly'} onValueChange={(v) => handleUpdateRole(u.id, v)}>
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="readonly">Visualizador</SelectItem>
                              <SelectItem value="editor">Editor</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-full h-7 text-[10px] text-destructive hover:bg-destructive/10 mt-1">
                              <Trash2 className="h-3 w-3 mr-1" /> Excluir permanentemente
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir {displayName}?</AlertDialogTitle>
                              <AlertDialogDescription>Todos os dados deste usuário serão apagados permanentemente.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteUser(u.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default UserManagerPopup;

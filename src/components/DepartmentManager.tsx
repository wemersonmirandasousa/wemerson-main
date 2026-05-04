import React, { useState } from 'react';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { createDepartment, updateDepartment, deleteDepartment } from '@/lib/departments';
import type { Department } from '@/lib/departments';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface DepartmentManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  departments: Department[];
  onUpdated: () => void;
}

const DepartmentManager: React.FC<DepartmentManagerProps> = ({ open, onOpenChange, departments, onUpdated }) => {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await createDepartment(name.trim());
      setName('');
      onUpdated();
      toast({ description: `Departamento "${name.trim()}" criado` });
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
    setCreating(false);
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await updateDepartment(id, editName.trim());
      setEditingId(null);
      onUpdated();
      toast({ description: 'Departamento atualizado' });
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDepartment(deleteId);
      setDeleteId(null);
      onUpdated();
      toast({ description: 'Departamento removido' });
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] border-border" style={{ background: 'hsl(220 20% 9%)' }}>
          <DialogHeader>
            <DialogTitle className="text-foreground">Gerenciar departamentos</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {departments.map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-xl px-3 py-2 border border-border/50" style={{ background: 'hsl(0 0% 100% / 0.03)' }}>
                {editingId === d.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 text-sm bg-secondary/50 border-border flex-1"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleEdit(d.id)}
                    />
                    <button onClick={() => handleEdit(d.id)} className="text-primary hover:text-primary/80">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-foreground">{d.name}</span>
                    <button onClick={() => { setEditingId(d.id); setEditName(d.name); }} className="text-muted-foreground hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(d.id)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}

            {departments.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum departamento cadastrado</p>
            )}
          </div>

          <div className="border-t border-border/50 pt-4 space-y-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Novo departamento</p>
            <div className="flex gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do departamento" className="h-9 text-sm bg-secondary/50 border-border flex-1" onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
              <Button onClick={handleCreate} disabled={!name.trim() || creating} size="sm">
                <Plus className="h-4 w-4 mr-1" /> {creating ? '...' : 'Adicionar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir departamento?</AlertDialogTitle>
            <AlertDialogDescription>Ferramentas vinculadas manterão o valor atual no campo setor.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DepartmentManager;

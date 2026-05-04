import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArchiveRestore, Trash2, Archive, CheckSquare, Square } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { fetchArchivedTools, bulkArchiveTools, bulkSoftDeleteTools } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
}

const ArchivedToolsDialog: React.FC<Props> = ({ open, onOpenChange, userId }) => {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: archived = [], isLoading, refetch } = useQuery({
    queryKey: ['tools-archived'],
    queryFn: fetchArchivedTools,
    enabled: open,
  });

  // Reset selection when dialog opens or data changes
  useEffect(() => {
    if (!open) {
      setSelectedIds([]);
    }
  }, [open]);

  const handleUnarchive = async (id: string) => {
    try {
      await bulkArchiveTools([id], userId, false);
      toast({ description: 'Ferramenta restaurada' });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir definitivamente esta ferramenta arquivada?')) return;
    try {
      await bulkSoftDeleteTools([id], userId);
      toast({ description: 'Ferramenta excluída' });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
  };

  const handleBulkUnarchive = async () => {
    if (selectedIds.length === 0) return;
    try {
      await bulkArchiveTools(selectedIds, userId, false);
      toast({ description: `${selectedIds.length} ferramentas restauradas` });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      setSelectedIds([]);
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Excluir definitivamente as ${selectedIds.length} ferramentas selecionadas?`)) return;
    try {
      await bulkSoftDeleteTools(selectedIds, userId);
      toast({ description: `${selectedIds.length} ferramentas excluídas` });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      setSelectedIds([]);
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === archived.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(archived.map(t => t.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[80vh] flex flex-col border-border" style={{ background: 'hsl(220 20% 9%)' }}>
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <div>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <Archive className="h-4 w-4" /> Ferramentas arquivadas
              </DialogTitle>
              <DialogDescription>
                Visíveis apenas para editores. Restaure ou exclua definitivamente.
              </DialogDescription>
            </div>
            
            {archived.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleSelectAll}
                className="text-xs h-8 gap-2"
              >
                {selectedIds.length === archived.length ? (
                  <><CheckSquare className="h-3.5 w-3.5" /> Desmarcar tudo</>
                ) : (
                  <><Square className="h-3.5 w-3.5" /> Marcar tudo</>
                )}
              </Button>
            )}
          </div>
        </DialogHeader>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 px-1 py-2 border-b border-border/40 mb-2">
            <span className="text-xs text-muted-foreground ml-2">
              {selectedIds.length} selecionada(s)
            </span>
            <div className="ml-auto flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkUnarchive}
                className="h-7 text-xs gap-1.5"
              >
                <ArchiveRestore className="h-3 w-3" /> Restaurar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                className="h-7 text-xs gap-1.5"
              >
                <Trash2 className="h-3 w-3" /> Excluir
              </Button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Carregando...</p>
          ) : archived.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma ferramenta arquivada</p>
          ) : (
            archived.map((t) => (
              <div
                key={t.id}
                className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors ${
                  selectedIds.includes(t.id) ? 'border-primary/50 bg-primary/5' : 'border-border/60 bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Checkbox 
                    checked={selectedIds.includes(t.id)} 
                    onCheckedChange={() => toggleSelect(t.id)}
                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleSelect(t.id)}>
                    <p className="text-sm font-medium text-foreground truncate">{t.titulo}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {t.categoria || '—'} • {t.setores || '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUnarchive(t.id)}
                    className="h-8 gap-1.5"
                  >
                    <ArchiveRestore className="h-3.5 w-3.5" /> Restaurar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(t.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    aria-label="Excluir definitivamente"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ArchivedToolsDialog;

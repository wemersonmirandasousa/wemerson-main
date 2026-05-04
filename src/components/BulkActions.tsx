import React, { useState } from 'react';
import { Tag, Building2, Layers, Copy, Archive, Palette, Activity, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { duplicateTool, bulkArchiveTools, fetchTools } from '@/lib/api';
import { exportSystemData } from '@/utils/exportSystem';
import { CATEGORIAS, categoriaToToolType, STATUS_OPTIONS, Tool } from '@/types/tool';
import type { Company } from './CompanyFilter';
import type { Department } from '@/lib/departments';

interface BulkActionsProps {
  selectedIds: Set<string>;
  tools: Tool[];
  companies: Company[];
  departments: Department[];
  userId: string;
  onUpdated: () => void;
}

const PRESET_COLORS = [
  { name: 'Padrão', value: '_none' },
  { name: 'Azul', value: '#3b82f6' },
  { name: 'Verde', value: '#10b981' },
  { name: 'Roxo', value: '#8b5cf6' },
  { name: 'Vermelho', value: '#ef4444' },
  { name: 'Laranja', value: '#f59e0b' },
  { name: 'Rosa', value: '#ec4899' },
  { name: 'Ciano', value: '#06b6d4' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Esmeralda', value: '#10b981' },
];

const BulkActions: React.FC<BulkActionsProps> = ({ selectedIds, tools, companies, departments, userId, onUpdated }) => {
  const [dialog, setDialog] = useState<'empresa' | 'setor' | 'categoria' | 'cor' | 'status' | null>(null);
  const [value, setValue] = useState('');
  const [duplicating, setDuplicating] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (selectedIds.size === 0 || exporting) return;
    setExporting(true);
    const selectedTools = tools.filter(t => selectedIds.has(t.id));
    try {
      await exportSystemData(selectedTools);
    } finally {
      setExporting(false);
    }
  };

  const handleDuplicate = async () => {
    if (selectedIds.size === 0 || duplicating) return;
    const ids = Array.from(selectedIds);
    setDuplicating(true);
    console.log('[BulkActions:duplicate]', { count: ids.length });

    let success = 0;
    for (const id of ids) {
      try {
        await duplicateTool(id, userId, '*');
        success++;
      } catch (err: any) {
        console.error('[BulkActions:duplicate:error]', id, err);
      }
    }

    setDuplicating(false);
    toast({ description: `${success} ferramenta(s) duplicada(s) com prefixo *` });
    onUpdated();
  };

  const handleApply = async () => {
    if (!value || selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    let updates: any = { atualizado_por: userId };

    if (dialog === 'empresa') {
      updates.empresa_id = value === '_none' ? null : value;
    } else if (dialog === 'setor') {
      updates.setores = value === '_none' ? 'Todas as ferramentas' : value;
    } else if (dialog === 'categoria') {
      updates.categoria = value;
      updates.tool_type = categoriaToToolType(value);
    } else if (dialog === 'cor') {
      updates.cor_cartao = value === '_none' ? null : value;
    } else if (dialog === 'status') {
      updates.status = value;
    }

    try {
      const { error } = await supabase.from('tools').update(updates).in('id', ids);
      if (error) throw error;
      onUpdated();
      toast({ description: `${ids.length} ferramenta(s) atualizada(s)` });
      setDialog(null);
      setValue('');
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
  };

  const btnClass = "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-medium transition-all hover:bg-accent";
  const btnStyle = { background: 'hsl(0 0% 100% / 0.06)', border: '1px solid hsl(0 0% 100% / 0.10)', color: 'hsl(0 0% 75%)' };

  return (
    <>
      <button onClick={() => { setDialog('status'); setValue(''); }} className={btnClass} style={btnStyle}>
        <Activity className="h-3.5 w-3.5" /> Status
      </button>
      <button onClick={() => { setDialog('categoria'); setValue(''); }} className={btnClass} style={btnStyle}>
        <Layers className="h-3.5 w-3.5" /> Categoria
      </button>
      <button onClick={() => { setDialog('empresa'); setValue(''); }} className={btnClass} style={btnStyle}>
        <Building2 className="h-3.5 w-3.5" /> Empresa
      </button>
      <button onClick={() => { setDialog('setor'); setValue(''); }} className={btnClass} style={btnStyle}>
        <Tag className="h-3.5 w-3.5" /> Setor
      </button>
      <button onClick={() => { setDialog('cor'); setValue(''); }} className={btnClass} style={btnStyle}>
        <Palette className="h-3.5 w-3.5" /> Cor
      </button>
      <button
        onClick={handleExport}
        disabled={exporting}
        className={btnClass}
        style={{ background: 'hsl(217 91% 60% / 0.12)', border: '1px solid hsl(217 91% 60% / 0.25)', color: 'hsl(217 91% 65%)' }}
        aria-label="Exportar ferramentas selecionadas"
      >
        <Download className="h-3.5 w-3.5" /> {exporting ? 'Exportando...' : `Exportar (${selectedIds.size})`}
      </button>
      <button
        onClick={handleDuplicate}
        disabled={duplicating}
        className={btnClass}
        style={{ background: 'hsl(142 71% 45% / 0.12)', border: '1px solid hsl(142 71% 45% / 0.25)', color: 'hsl(142 71% 60%)' }}
        aria-label="Duplicar ferramentas selecionadas"
      >
        <Copy className="h-3.5 w-3.5" /> {duplicating ? 'Duplicando...' : `Duplicar (${selectedIds.size})`}
      </button>
      <button
        onClick={async () => {
          if (selectedIds.size === 0) return;
          try {
            await bulkArchiveTools(Array.from(selectedIds), userId, true);
            toast({ description: `${selectedIds.size} ferramenta(s) arquivada(s)` });
            onUpdated();
          } catch (err: any) {
            toast({ description: err.message, variant: 'destructive' });
          }
        }}
        className={btnClass}
        style={{ background: 'hsl(38 92% 50% / 0.12)', border: '1px solid hsl(38 92% 50% / 0.25)', color: 'hsl(38 92% 60%)' }}
        aria-label="Arquivar ferramentas selecionadas"
      >
        <Archive className="h-3.5 w-3.5" /> Arquivar ({selectedIds.size})
      </button>

      <Dialog open={!!dialog} onOpenChange={() => setDialog(null)}>
        <DialogContent className="sm:max-w-[400px] border-border" style={{ background: 'hsl(220 20% 9%)' }}>
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {dialog === 'categoria' && 'Alterar categoria'}
              {dialog === 'empresa' && 'Definir empresa'}
              {dialog === 'setor' && 'Alterar setor / departamento'}
              {dialog === 'cor' && 'Alterar cor dos cartões'}
              {dialog === 'status' && 'Alterar status'}
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">{selectedIds.size} ferramenta(s) selecionada(s)</p>

          <Select value={value} onValueChange={setValue}>
            <SelectTrigger className="h-9 text-sm bg-secondary/50 border-border">
              <SelectValue placeholder="Selecionar..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {dialog === 'status' && (
                <>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                  <SelectItem value="outdated">Desatualizado</SelectItem>
                </>
              )}
              {dialog === 'categoria' && (
                <>
                  {CATEGORIAS.map(c => <SelectItem key={c.nome} value={c.nome}>{c.nome}</SelectItem>)}
                </>
              )}
              {dialog === 'empresa' && (
                <>
                  <SelectItem value="_none">Sem empresa</SelectItem>
                  {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </>
              )}
              {dialog === 'setor' && (
                <>
                  <SelectItem value="_none">Todas as ferramentas</SelectItem>
                  {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                </>
              )}
              {dialog === 'cor' && (
                <>
                  {PRESET_COLORS.map(c => (
                    <SelectItem key={c.value} value={c.value}>
                      <div className="flex items-center gap-2">
                        {c.value !== '_none' && (
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.value }} />
                        )}
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>

          <DialogFooter>
            <Button onClick={handleApply} disabled={!value} className="w-full">
              Aplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BulkActions;

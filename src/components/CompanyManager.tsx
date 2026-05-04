import React, { useState } from 'react';
import { Plus, Trash2, Upload, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Company } from './CompanyFilter';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CompanyManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companies: Company[];
  onUpdated: () => void;
}

const CompanyManager: React.FC<CompanyManagerProps> = ({ open, onOpenChange, companies, onUpdated }) => {
  const [name, setName] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    if (password && (password.length !== 2 || !/^\d{2}$/.test(password))) {
      toast({ description: 'Senha deve ter exatamente 2 dígitos numéricos', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      let logo_url: string | null = null;
      const slug = name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      if (logoFile) {
        const path = `${slug}/${Date.now()}_${logoFile.name}`;
        const { error: upErr } = await supabase.storage.from('company-logos').upload(path, logoFile);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from('company-logos').getPublicUrl(path);
        logo_url = urlData.publicUrl;
      }

      const { error } = await (supabase.from('companies' as any).insert({ name: name.trim(), logo_url, slug, access_password: password || null } as any) as any);
      if (error) throw error;

      setName('');
      setLogoFile(null);
      setPassword('');
      onUpdated();
      toast({ description: `Empresa "${name.trim()}" criada` });
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await (supabase.from('companies' as any).delete().eq('id', deleteId) as any);
      if (error) throw error;
      setDeleteId(null);
      onUpdated();
      toast({ description: 'Empresa removida' });
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px] border-border" style={{ background: 'hsl(220 20% 9%)' }}>
          <DialogHeader>
            <DialogTitle className="text-foreground">Gerenciar empresas</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {companies.map((c) => (
              <div key={c.id} className="flex items-center gap-3 rounded-xl px-3 py-2 border border-border/50" style={{ background: 'hsl(0 0% 100% / 0.03)' }}>
                {c.logo_url ? (
                  <img src={c.logo_url} alt={c.name} className="h-7 object-contain max-w-[80px]" />
                ) : (
                  <div className="h-7 w-7 rounded bg-secondary flex items-center justify-center text-xs font-bold text-foreground/60">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="flex-1 text-sm text-foreground">{c.name}</span>
                {(c as any).access_password && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="h-3 w-3" /> ••</span>
                )}
                <button onClick={() => setDeleteId(c.id)} className="text-destructive hover:text-destructive/80">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {companies.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma empresa cadastrada</p>
            )}

            <div className="border-t border-border/50 pt-4 space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Nova empresa</p>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da empresa" className="h-9 text-sm bg-secondary/50 border-border" />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground flex-1">
                  <Upload className="h-3.5 w-3.5" />
                  {logoFile ? logoFile.name : 'Logo (opcional)'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                </label>
                <div className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={password}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                      setPassword(v);
                    }}
                    placeholder="Senha 2 dígitos"
                    maxLength={2}
                    inputMode="numeric"
                    className="h-8 w-[120px] text-sm bg-secondary/50 border-border text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleCreate} disabled={!name.trim() || creating} className="w-full">
              <Plus className="h-4 w-4 mr-1" /> {creating ? 'Criando...' : 'Adicionar empresa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
            <AlertDialogDescription>Ferramentas vinculadas perderão a associação.</AlertDialogDescription>
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

export default CompanyManager;

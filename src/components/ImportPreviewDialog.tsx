import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { Tool } from '@/types/tool';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText } from 'lucide-react';
import { parseTxtImport, txtToToolData } from '@/lib/txtTemplates';
import { createTool } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface ImportRow {
  titulo: string;
  empresa: string;
  categoria: string;
  link: string;
  status: 'novo' | 'duplicado' | 'ignorado';
  finalTitulo?: string;
}

interface ImportPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingTools: Tool[];
  onImportComplete: () => void;
}

const ImportPreviewDialog: React.FC<ImportPreviewDialogProps> = ({ open, onOpenChange, existingTools, onImportComplete }) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');
  const [result, setResult] = useState<{ criadas: number; duplicadas: number; ignoradas: number } | null>(null);
  const [importMode, setImportMode] = useState<'xlsx' | 'xlsx-bulk' | 'txt' | 'txt-bulk'>('xlsx');

  const handleXlsxFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fs = Array.from(e.target.files || []);
    if (!fs.length) return;
    setFiles(fs);
    setImportMode(fs.length > 1 ? 'xlsx-bulk' : 'xlsx');

    const allRows: ImportRow[] = [];
    const existingTitles = new Set(existingTools.map(t => t.titulo.toLowerCase().trim()));

    for (const f of fs) {
      const buffer = await f.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data: any[] = XLSX.utils.sheet_to_json(sheet);

      if (data.length > 500) {
        toast({ description: `Arquivo "${f.name}" excedeu o limite de 500 linhas`, variant: 'destructive' });
        continue;
      }

      const parsed: ImportRow[] = data.map((row) => {
        const titulo = (row.NOME || row.titulo || row.Titulo || row.TITULO || '').toString().trim();
        const empresa = (row.EMPRESA || row.empresa || '').toString().trim();
        const categoria = (row.CATEGORIA || row.categoria || '').toString().trim();
        const link = (row['LINK DA FERRAMENTA'] || row['LINK DE ACESSO'] || row.link || row.Link || row.LINK || '').toString().trim();

        if (!titulo) return { titulo: '(vazio)', empresa, categoria, link, status: 'ignorado' as const };

        const isDuplicate = existingTitles.has(titulo.toLowerCase());
        return {
          titulo, empresa, categoria, link,
          status: isDuplicate ? 'duplicado' as const : 'novo' as const,
          finalTitulo: isDuplicate ? `COPIA - ${titulo}` : titulo,
        };
      });
      allRows.push(...parsed);
    }

    setRows(allRows);
    setStep('preview');
  }, [existingTools]);


  const handleTxtFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fs = Array.from(e.target.files || []);
    if (!fs.length) return;
    setFiles(fs);
    setImportMode(fs.length > 1 ? 'txt-bulk' : 'txt');


    const existingTitles = new Set(existingTools.map(t => t.titulo.toLowerCase().trim()));
    const allRows: ImportRow[] = [];

    for (let i = 0; i < Math.min(files.length, 500); i++) {
      const content = await files[i].text();
      const parsed = parseTxtImport(content);
      const toolData = txtToToolData(parsed);
      const titulo = toolData.titulo || files[i].name.replace('.txt', '');
      const isDuplicate = existingTitles.has(titulo.toLowerCase().trim());

      allRows.push({
        titulo,
        empresa: toolData.empresa_nome || '',
        categoria: toolData.categoria || '',
        link: toolData.link_acesso_original || '',
        status: isDuplicate ? 'duplicado' : 'novo',
        finalTitulo: isDuplicate ? `COPIA - ${titulo}` : titulo,
      });
    }

    setRows(allRows);
    setStep('preview');
  }, [existingTools]);

  const handleImport = async () => {
    if ((importMode === 'xlsx' || importMode === 'xlsx-bulk') && files.length > 0) {
      setImporting(true);
      let totalCriadas = 0, totalDuplicadas = 0, totalIgnoradas = 0;
      try {
        const session = (await supabase.auth.getSession()).data.session;
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        
        for (const f of files) {
          const formData = new FormData();
          formData.append('file', f);
          const resp = await fetch(`https://${projectId}.supabase.co/functions/v1/import-tools`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session?.access_token}` },
            body: formData,
          });
          const data = await resp.json();
          if (!resp.ok) continue;
          totalCriadas += data.criadas || 0;
          totalDuplicadas += data.duplicadas || 0;
          totalIgnoradas += data.ignoradas || 0;
        }
        
        setResult({ criadas: totalCriadas, duplicadas: totalDuplicadas, ignoradas: totalIgnoradas });
        setStep('done');
        onImportComplete();
        toast({ description: `Importação concluída: ${totalCriadas} criadas` });
      } catch (err: any) {
        toast({ description: err.message, variant: 'destructive' });
      }
      setImporting(false);
    } else {

      // TXT import — create directly
      if (!user) return;
      setImporting(true);
      let criadas = 0, duplicadas = 0, ignoradas = 0;
      // Re-parse from stored rows isn't enough — we need full data. For simplicity, create from rows.
      for (const row of rows) {
        if (row.status === 'ignorado') { ignoradas++; continue; }
        try {
          await createTool({
            titulo: (row.finalTitulo || row.titulo).toUpperCase(),
            categoria: row.categoria || null,
            link_acesso_original: row.link || null,
            status: 'draft',
          } as any, user.id);
          if (row.status === 'duplicado') duplicadas++;
          else criadas++;
        } catch { ignoradas++; }
      }
      setResult({ criadas, duplicadas, ignoradas });
      setStep('done');
      onImportComplete();
      toast({ description: `Importação concluída: ${criadas} criadas` });
      setImporting(false);
    }
  };

  const handleClose = () => {
    setRows([]);
    setFiles([]);
    setStep('upload');
    setResult(null);
    onOpenChange(false);
  };

  const statusColor: Record<string, string> = {
    novo: 'text-emerald-400 bg-emerald-500/20',
    duplicado: 'text-amber-400 bg-amber-500/20',
    ignorado: 'text-zinc-400 bg-zinc-500/20',
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto border-border" style={{ background: 'hsl(220 20% 9%)' }}>
        <DialogHeader>
          <DialogTitle className="text-foreground">Importar ferramentas</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-6 py-4">
            <Tabs defaultValue="xlsx">
              <TabsList className="w-full bg-secondary/50">
                <TabsTrigger value="xlsx" className="flex-1 text-xs">Planilha</TabsTrigger>
                <TabsTrigger value="txt" className="flex-1 text-xs">TXT</TabsTrigger>
              </TabsList>
              <TabsContent value="xlsx" className="pt-6">
                <div className="flex flex-col items-center gap-4">
                  <p className="text-sm text-muted-foreground">Selecione um arquivo .xlsx ou .csv (máx. 500 linhas)</p>
                  <label className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium cursor-pointer transition-all hover:bg-accent" style={{ background: 'hsl(0 0% 100% / 0.06)', border: '1px solid hsl(0 0% 100% / 0.10)', color: 'hsl(0 0% 85%)' }}>
                    <Upload className="h-4 w-4" /> Escolher arquivo
                    <input type="file" accept=".xlsx,.csv" multiple className="hidden" onChange={handleXlsxFile} />
                  </label>
                </div>
              </TabsContent>
              <TabsContent value="txt" className="pt-6">
                <div className="flex flex-col items-center gap-4">
                  <p className="text-sm text-muted-foreground">Selecione um ou mais arquivos .txt</p>
                  <label className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium cursor-pointer transition-all hover:bg-accent" style={{ background: 'hsl(0 0% 100% / 0.06)', border: '1px solid hsl(0 0% 100% / 0.10)', color: 'hsl(0 0% 85%)' }}>
                    <FileText className="h-4 w-4" /> Escolher arquivo(s) TXT
                    <input type="file" accept=".txt" multiple className="hidden" onChange={handleTxtFile} />
                  </label>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {step === 'preview' && (
          <>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'hsl(0 0% 100% / 0.04)' }}>
                    <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Título</th>
                    <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Empresa</th>
                    <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Categoria</th>
                    <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-t border-border/50">
                      <td className="px-3 py-2 text-foreground">{row.status === 'duplicado' ? row.finalTitulo : row.titulo}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.empresa || '-'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{row.categoria || '-'}</td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${statusColor[row.status]}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground">
              {rows.filter(r => r.status === 'novo').length} novas · {rows.filter(r => r.status === 'duplicado').length} duplicadas · {rows.filter(r => r.status === 'ignorado').length} ignoradas
            </p>
          </>
        )}

        {step === 'done' && result && (
          <div className="py-8 text-center space-y-2">
            <p className="text-lg font-semibold text-foreground">Importação concluída</p>
            <p className="text-sm text-muted-foreground">
              {result.criadas} criadas · {result.duplicadas} duplicadas · {result.ignoradas} ignoradas
            </p>
          </div>
        )}

        <DialogFooter>
          {step === 'preview' && (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={handleClose} className="flex-1">Cancelar</Button>
              <Button onClick={handleImport} disabled={importing} className="flex-1">
                {importing ? 'Importando...' : 'Confirmar importação'}
              </Button>
            </div>
          )}
          {step === 'done' && (
            <Button onClick={handleClose} className="w-full">Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportPreviewDialog;

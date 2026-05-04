import { supabase } from "@/integrations/supabase/client";
import { toolsToConsolidatedTxt } from "@/lib/txtTemplates";
import { toast } from "@/hooks/use-toast";
import { Tool } from "@/types/tool";

export const handleExportXlsx = async () => {
  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    const session = (await supabase.auth.getSession()).data.session;
    if (!session) {
      toast({ description: 'Sessão expirada. Faça login novamente.', variant: 'destructive' });
      return;
    }
    
    const resp = await fetch(`https://${projectId}.supabase.co/functions/v1/export-tools`, {
      headers: { 'Authorization': `Bearer ${session.access_token}` }
    });
    
    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({ error: 'Erro na exportação' }));
      throw new Error(errorData.error || 'Erro na exportação');
    }
    
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ferramentas_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ description: 'Excel exportado com sucesso' });
  } catch (err: any) {
    console.error('[ExportXlsx Error]', err);
    toast({ description: err.message, variant: 'destructive' });
  }
};

export const handleExportTxtConsolidated = (tools: Tool[], empresaNome?: string) => {
  const activeTools = tools.filter((t) => t.status === 'active');
  if (activeTools.length === 0) {
    toast({ description: 'Nenhuma ferramenta ativa para exportar em TXT' });
    return;
  }
  const content = toolsToConsolidatedTxt(activeTools, empresaNome);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ferramentas_${empresaNome ? empresaNome.replace(/\s+/g, '_') + '_' : ''}${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  toast({ description: 'TXT consolidado exportado' });
};

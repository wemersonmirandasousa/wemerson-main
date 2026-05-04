import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolExportData } from '@/types/tool';
import { buildToolExportData } from '@/lib/tool-export';
import { toast } from '@/hooks/use-toast';

interface ExportToolButtonProps {
  toolData: Partial<ToolExportData>;
  fileName?: string;
  className?: string;
  variant?: "outline" | "default" | "secondary" | "ghost" | "link" | "destructive";
}

export const ExportToolButton: React.FC<ExportToolButtonProps> = ({ 
  toolData, 
  fileName, 
  className,
  variant = "outline" 
}) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportPayload = buildToolExportData(toolData);
      
      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      const safeFileName = (fileName || toolData.nome || 'ferramenta')
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-");

      a.href = url;
      a.download = `ferramenta-${safeFileName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('[ExportToolButton:export]', exportPayload);
      toast({ description: 'Ferramenta exportada com sucesso!' });
    } catch (error) {
      console.error('[ExportToolButton:error]', error);
      toast({ 
        description: 'Erro ao exportar ferramenta.', 
        variant: 'destructive' 
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button 
      onClick={handleExport} 
      variant={variant} 
      className={className}
      disabled={exporting}
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {exporting ? 'Exportando...' : 'Exportar JSON'}
    </Button>
  );
};

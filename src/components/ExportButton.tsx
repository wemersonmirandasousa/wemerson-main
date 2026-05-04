import React, { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { Tool } from '@/types/tool';
import { exportSystemData } from '@/utils/exportSystem';

interface ExportButtonProps {
  tools: Tool[];
}

const ExportButton: React.FC<ExportButtonProps> = ({ tools }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      // The button always uses the tools passed as props, ensuring reactivity
      await exportSystemData(tools);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center justify-center h-10 w-10 rounded-xl transition-all hover:scale-110 active:scale-95 disabled:opacity-70"
      style={{ 
        background: '#22C55E', 
        border: '1px solid rgba(0,0,0,0.1)', 
        color: '#fff',
        boxShadow: '0 2px 10px rgba(34, 197, 94, 0.2)'
      }}
      title="Exportar Sistema (JSON)"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <FileText className="h-5 w-5" />
      )}
    </button>
  );
};

export default ExportButton;

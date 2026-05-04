import React from 'react';
import { Clipboard } from 'lucide-react';
import { copyToClipboard } from '@/lib/clipboard';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  alwaysVisible?: boolean;
}

const CopyButton: React.FC<CopyButtonProps> = ({ text, label = 'Copiar', className = '', alwaysVisible = false }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); copyToClipboard(text, label); }}
          className={`${alwaysVisible ? '' : 'copy-btn'} inline-flex items-center justify-center h-7 w-7 rounded-md transition-colors hover:bg-accent ${className}`}
        >
          <Clipboard className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );
};

export default CopyButton;


import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ZoomIn, ZoomOut, Maximize } from "lucide-react";

interface WorkflowToolbarProps {
  onAddNode: () => void;
  onClear: () => void;
  className?: string;
}

export const WorkflowToolbar: React.FC<WorkflowToolbarProps> = ({
  onAddNode,
  onClear,
  className,
}) => {
  return (
    <div className={`absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 rounded-full bg-card/80 backdrop-blur-md border border-border shadow-2xl z-20 ${className}`}>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onAddNode} 
        className="rounded-full gap-2 px-4 hover:bg-primary/10 hover:text-primary transition-all"
      >
        <Plus className="h-4 w-4" /> 
        <span className="text-xs font-semibold">Adicionar módulo</span>
      </Button>
      
      <div className="w-px h-4 bg-border mx-1" />
      
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" aria-label="Aproximar">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" aria-label="Afastar">
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" aria-label="Ajustar tela">
        <Maximize className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-4 bg-border mx-1" />
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={onClear} 
        className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
        aria-label="Limpar fluxo"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

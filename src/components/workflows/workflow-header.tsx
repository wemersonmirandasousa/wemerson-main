
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Copy, Send } from "lucide-react";
import { WorkflowTypeSwitcher } from "./workflow-type-switcher";
import { WorkflowStatus } from "@/types/workflow";

interface WorkflowHeaderProps {
  title: string;
  status: WorkflowStatus;
  typeId: string;
  onTypeChange: (typeId: string) => void;
  onBack: () => void;
  onSave: () => void;
  onDuplicate: () => void;
  onPublish: () => void;
}

const statusConfig: Record<WorkflowStatus, { label: string; class: string }> = {
  rascunho: { label: "Rascunho", class: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  ativo: { label: "Ativo", class: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  pausado: { label: "Pausado", class: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  arquivado: { label: "Arquivado", class: "bg-muted text-muted-foreground border-border" },
};

export const WorkflowHeader: React.FC<WorkflowHeaderProps> = ({
  title,
  status,
  typeId,
  onTypeChange,
  onBack,
  onSave,
  onDuplicate,
  onPublish,
}) => {
  return (
    <header className="h-20 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between px-6 z-20">
      <div className="flex items-center gap-6">
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Voltar ao painel">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">{title}</h1>
            <Badge variant="secondary" className={statusConfig[status].class}>
              {statusConfig[status].label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">ID do Fluxo: {Math.random().toString(36).substring(7).toUpperCase()}</p>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <WorkflowTypeSwitcher currentTypeId={typeId} onTypeChange={onTypeChange} />
        
        <div className="h-8 w-px bg-border mx-2" />
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onDuplicate} className="gap-2">
            <Copy className="h-4 w-4" /> Duplicar
          </Button>
          <Button variant="outline" size="sm" onClick={onSave} className="gap-2">
            <Save className="h-4 w-4" /> Salvar
          </Button>
          <Button size="sm" onClick={onPublish} className="gap-2 bg-primary hover:bg-primary/90">
            <Send className="h-4 w-4" /> Publicar
          </Button>
        </div>
      </div>
    </header>
  );
};

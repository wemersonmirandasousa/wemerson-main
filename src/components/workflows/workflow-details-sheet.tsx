
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Workflow, WorkflowStatus } from "@/types/workflow";
import { workflowTypes } from "@/lib/workflow/workflow-types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ExternalLink, Copy, Play, Pause, Archive, Trash2, Calendar, User, Zap } from "lucide-react";

interface WorkflowDetailsSheetProps {
  workflow: Workflow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction: (action: string, workflow: Workflow) => void;
}

const statusConfig: Record<WorkflowStatus, { label: string; class: string }> = {
  rascunho: { label: "Rascunho", class: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  ativo: { label: "Ativo", class: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  pausado: { label: "Pausado", class: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  arquivado: { label: "Arquivado", class: "bg-muted text-muted-foreground border-border" },
};

export const WorkflowDetailsSheet: React.FC<WorkflowDetailsSheetProps> = ({
  workflow,
  open,
  onOpenChange,
  onAction,
}) => {
  if (!workflow) return null;

  const type = workflowTypes.find(t => t.id === workflow.type);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-l border-border/50">
        <SheetHeader className="pb-6 border-b border-border/50 text-left">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className={`text-[10px] py-0 ${statusConfig[workflow.status].class}`}>
              {statusConfig[workflow.status].label}
            </Badge>
            <Badge variant="outline" className="font-normal text-[10px] py-0">
              {type?.label || workflow.type}
            </Badge>
          </div>
          <SheetTitle className="text-2xl font-bold">{workflow.name}</SheetTitle>
          <SheetDescription className="text-sm leading-relaxed pt-2">
            {workflow.description}
          </SheetDescription>
        </SheetHeader>

        <div className="py-8 space-y-8 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <Calendar className="h-3 w-3" /> Criado em
              </div>
              <p className="text-sm font-medium">
                {format(new Date(workflow.createdAt), "dd 'de' MMMM, yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                <User className="h-3 w-3" /> Responsável
              </div>
              <p className="text-sm font-medium">{workflow.owner}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Zap className="h-3 w-3 text-primary" /> Estatísticas do Fluxo
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50 flex flex-col gap-1">
                <span className="text-2xl font-bold text-primary">{(workflow as any).nodesCount || 0}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Módulos</span>
              </div>
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50 flex flex-col gap-1">
                <span className="text-2xl font-bold text-blue-500">{(workflow as any).connectionsCount || 0}</span>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Conexões</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border/50">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ações Rápidas</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="justify-start gap-2 h-10 font-medium text-xs" 
                onClick={() => onAction('open', workflow)}
              >
                <ExternalLink className="h-3.5 w-3.5" /> Abrir no construtor
              </Button>
              <Button 
                variant="outline" 
                className="justify-start gap-2 h-10 font-medium text-xs" 
                onClick={() => onAction('duplicate', workflow)}
              >
                <Copy className="h-3.5 w-3.5" /> Duplicar fluxo
              </Button>
            </div>
          </div>
        </div>

        <SheetFooter className="flex-col sm:flex-col gap-2 mt-auto pt-6 border-t border-border/50">
          <div className="grid grid-cols-2 gap-2 w-full">
            {workflow.status !== 'ativo' && (
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700 gap-2 h-11 text-xs" 
                onClick={() => onAction('activate', workflow)}
              >
                <Play className="h-4 w-4" /> Ativar Fluxo
              </Button>
            )}
            {workflow.status === 'ativo' && (
              <Button 
                className="bg-blue-600 hover:bg-blue-700 gap-2 h-11 text-xs" 
                onClick={() => onAction('pause', workflow)}
              >
                <Pause className="h-4 w-4" /> Pausar Fluxo
              </Button>
            )}
            <Button 
              variant="outline" 
              className="gap-2 h-11 text-xs" 
              onClick={() => onAction('archive', workflow)}
            >
              <Archive className="h-4 w-4" /> Arquivar
            </Button>
          </div>
          <Button 
            variant="destructive" 
            className="w-full gap-2 h-11 opacity-80 hover:opacity-100 text-xs" 
            onClick={() => onAction('delete', workflow)}
          >
            <Trash2 className="h-4 w-4" /> Excluir Permanentemente
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};


import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreVertical, ExternalLink, Play, Pause, Archive, Trash2, Copy } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Workflow, WorkflowStatus } from "@/types/workflow";
import { workflowTypes } from "@/lib/workflow/workflow-types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WorkflowListProps {
  workflows: Workflow[];
  onSelect: (workflow: Workflow) => void;
  onAction: (action: string, workflow: Workflow) => void;
}

const statusConfig: Record<WorkflowStatus, { label: string; class: string }> = {
  rascunho: { label: "Rascunho", class: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  ativo: { label: "Ativo", class: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  pausado: { label: "Pausado", class: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  arquivado: { label: "Arquivado", class: "bg-muted text-muted-foreground border-border" },
};

export const WorkflowList: React.FC<WorkflowListProps> = ({
  workflows,
  onSelect,
  onAction,
}) => {
  return (
    <div className="rounded-xl border bg-card/50 overflow-hidden backdrop-blur-sm">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[40%] text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nome do Fluxo</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tipo</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Status</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Módulos</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Última Atualização</TableHead>
            <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {workflows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                Nenhum fluxo encontrado com os filtros selecionados.
              </TableCell>
            </TableRow>
          ) : (
            workflows.map((workflow) => {
              const type = workflowTypes.find(t => t.id === workflow.type);
              return (
                <TableRow 
                  key={workflow.id} 
                  className="group cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => onSelect(workflow)}
                >
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                        {workflow.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground line-clamp-1">
                        {workflow.description}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal text-[10px] py-0">
                      {type?.label || workflow.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`text-[10px] py-0 ${statusConfig[workflow.status].class}`}>
                      {statusConfig[workflow.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-[11px] font-medium">
                      <span className="px-1.5 py-0 rounded-md bg-muted">{(workflow as any).nodesCount || 0}</span>
                      <span className="text-muted-foreground">módulos</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[11px] text-muted-foreground">
                    {format(new Date(workflow.updatedAt), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => onAction('open', workflow)} className="gap-2 text-xs">
                          <ExternalLink className="h-3.5 w-3.5" /> Abrir no construtor
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAction('duplicate', workflow)} className="gap-2 text-xs">
                          <Copy className="h-3.5 w-3.5" /> Duplicar fluxo
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onAction('activate', workflow)} className="gap-2 text-xs text-emerald-500 focus:text-emerald-500">
                          <Play className="h-3.5 w-3.5" /> Ativar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAction('pause', workflow)} className="gap-2 text-xs text-blue-500 focus:text-blue-500">
                          <Pause className="h-3.5 w-3.5" /> Pausar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAction('archive', workflow)} className="gap-2 text-xs text-muted-foreground">
                          <Archive className="h-3.5 w-3.5" /> Arquivar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onAction('delete', workflow)} className="gap-2 text-xs text-destructive focus:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

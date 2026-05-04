
import React from "react";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { WorkflowStatus, WorkflowFilters as IWorkflowFilters } from "@/types/workflow";
import { workflowTypes } from "@/lib/workflow/workflow-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface WorkflowFiltersProps {
  filters: IWorkflowFilters;
  onFilterChange: (filters: IWorkflowFilters) => void;
}

export const WorkflowFilters: React.FC<WorkflowFiltersProps> = ({
  filters,
  onFilterChange,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleStatusToggle = (status: WorkflowStatus) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];
    onFilterChange({ ...filters, status: newStatus });
  };

  const clearFilters = () => {
    onFilterChange({
      search: "",
      status: [],
      type: [],
      sortBy: "updatedAt",
    });
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-card/30 backdrop-blur-sm border rounded-xl">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome ou descrição..." 
            className="pl-9 h-10"
            value={filters.search}
            onChange={handleSearchChange}
          />
        </div>
        
        <Select 
          value={filters.sortBy} 
          onValueChange={(val) => onFilterChange({ ...filters, sortBy: val as any })}
        >
          <SelectTrigger className="w-full md:w-[200px] h-10">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nome</SelectItem>
            <SelectItem value="updatedAt">Data de atualização</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="nodesCount">Quantidade de módulos</SelectItem>
          </SelectContent>
        </Select>

        {(filters.search || filters.status.length > 0 || filters.type.length > 0) && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-2 h-10 px-4 text-muted-foreground">
            <X className="h-4 w-4" /> Limpar filtros
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-6 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status:</span>
          <div className="flex gap-1.5">
            {(['rascunho', 'ativo', 'pausado', 'arquivado'] as WorkflowStatus[]).map((s) => (
              <Badge
                key={s}
                variant={filters.status.includes(s) ? "default" : "outline"}
                className="cursor-pointer capitalize text-[10px] px-2 py-0.5 transition-all hover:scale-105"
                onClick={() => handleStatusToggle(s)}
              >
                {s}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tipo:</span>
          <div className="flex gap-1.5">
            {workflowTypes.map((t) => (
              <Badge
                key={t.id}
                variant={filters.type.includes(t.id) ? "secondary" : "outline"}
                className="cursor-pointer text-[10px] px-2 py-0.5 transition-all hover:scale-105"
                onClick={() => {
                  const newTypes = filters.type.includes(t.id)
                    ? filters.type.filter((id) => id !== t.id)
                    : [...filters.type, t.id];
                  onFilterChange({ ...filters, type: newTypes });
                }}
              >
                {t.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

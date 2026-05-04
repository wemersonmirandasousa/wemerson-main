
import React, { useState, useMemo } from "react";
import { WorkflowList } from "./workflow-list";
import { WorkflowFilters } from "./workflow-filters";
import { WorkflowDetailsSheet } from "./workflow-details-sheet";
import { Workflow, WorkflowFilters as IWorkflowFilters } from "@/types/workflow";
import { mockWorkflows } from "@/lib/workflow/workflow-mock-data";
import { Button } from "@/components/ui/button";
import { Plus, LayoutDashboard, Settings, FileText, Activity } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const WorkflowAdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>(mockWorkflows as any[]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [filters, setFilters] = useState<IWorkflowFilters>({
    search: "",
    status: [],
    type: [],
    sortBy: "updatedAt",
  });

  const filteredWorkflows = useMemo(() => {
    console.log('[WorkflowAdmin:filter]', filters);
    let result = [...workflows];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      result = result.filter(
        (w) => w.name.toLowerCase().includes(search) || w.description.toLowerCase().includes(search)
      );
    }

    if (filters.status.length > 0) {
      result = result.filter((w) => filters.status.includes(w.status));
    }

    if (filters.type.length > 0) {
      result = result.filter((w) => filters.type.includes(w.type));
    }

    result.sort((a, b) => {
      if (filters.sortBy === "name") return a.name.localeCompare(b.name);
      if (filters.sortBy === "updatedAt") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (filters.sortBy === "status") return a.status.localeCompare(b.status);
      if (filters.sortBy === "nodesCount") return ((b as any).nodesCount || 0) - ((a as any).nodesCount || 0);
      return 0;
    });

    return result;
  }, [workflows, filters]);

  const handleAction = (action: string, workflow: Workflow) => {
    console.log('[WorkflowAdmin:action]', { action, workflowId: workflow.id });
    
    switch (action) {
      case 'open':
        navigate(`/fluxos?id=${workflow.id}`);
        break;
      case 'activate':
      case 'pause':
      case 'archive':
        const newStatus = action === 'activate' ? 'ativo' : action === 'pause' ? 'pausado' : 'arquivado';
        setWorkflows(prev => prev.map(w => w.id === workflow.id ? { ...w, status: newStatus as any } : w));
        console.log('[WorkflowAdmin:status-change]', { workflowId: workflow.id, newStatus });
        toast.success(`Fluxo "${workflow.name}" agora está ${newStatus}.`);
        break;
      case 'delete':
        if (confirm(`Deseja realmente excluir o fluxo "${workflow.name}"? Esta ação não pode ser desfeita.`)) {
          setWorkflows(prev => prev.filter(w => w.id !== workflow.id));
          toast.success("Fluxo excluído com sucesso.");
          setIsDetailsOpen(false);
        }
        break;
      case 'duplicate':
        const duplicated: Workflow = {
          ...workflow,
          id: `copy-${Date.now()}`,
          name: `${workflow.name} (Cópia)`,
          status: 'rascunho',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any;
        setWorkflows(prev => [duplicated, ...prev]);
        toast.success("Fluxo duplicado com sucesso!");
        break;
      default:
        toast.info("Ação em desenvolvimento");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <header className="px-8 py-8 border-b border-border/50 bg-card/20 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-7xl mx-auto">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Administração de Fluxos
            </h1>
            <p className="text-muted-foreground text-sm">Gerencie, monitore e organize suas automações visuais em um único lugar.</p>
          </div>
          <Button onClick={() => navigate('/fluxos')} className="gap-2 h-12 px-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            <Plus className="h-5 w-5" /> Novo Fluxo
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 max-w-7xl mx-auto">
          {[
            { label: 'Total de Fluxos', value: workflows.length, icon: FileText, color: 'text-primary' },
            { label: 'Fluxos Ativos', value: workflows.filter(w => w.status === 'ativo').length, icon: Activity, color: 'text-emerald-500' },
            { label: 'Aguardando', value: workflows.filter(w => w.status === 'rascunho').length, icon: Settings, color: 'text-amber-500' },
            { label: 'Taxa de Execução', value: '98.5%', icon: LayoutDashboard, color: 'text-blue-500' },
          ].map((stat, i) => (
            <div key={i} className="p-4 rounded-2xl bg-card/40 border border-border/50 backdrop-blur-md flex items-center gap-4 transition-all hover:border-primary/30">
              <div className={`p-3 rounded-xl bg-background/50 ${stat.color} shadow-inner`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold tracking-tight">{stat.value}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      </header>

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full flex flex-col gap-8">
        <WorkflowFilters filters={filters} onFilterChange={setFilters} />
        
        <WorkflowList 
          workflows={filteredWorkflows} 
          onSelect={(w) => {
            setSelectedWorkflow(w);
            setIsDetailsOpen(true);
          }}
          onAction={handleAction}
        />
      </main>

      <WorkflowDetailsSheet 
        workflow={selectedWorkflow} 
        open={isDetailsOpen} 
        onOpenChange={setIsDetailsOpen}
        onAction={handleAction}
      />
    </div>
  );
};

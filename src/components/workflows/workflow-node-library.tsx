
import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, Plus, HelpCircle } from "lucide-react";
import { workflowModules } from "@/lib/workflow/workflow-modules";
import { WorkflowModuleCategory } from "@/types/workflow";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as LucideIcons from "lucide-react";

interface WorkflowNodeLibraryProps {
  onAddModule: (moduleId: string) => void;
  allowedCategories?: WorkflowModuleCategory[];
}

const categoryLabels: Record<WorkflowModuleCategory, string> = {
  gatilhos: "Gatilhos",
  acoes: "Ações",
  condicoes: "Condições",
  comunicacao: "Comunicação",
  dados: "Dados",
  integracoes: "Integrações",
  controle: "Controle",
};

export const WorkflowNodeLibrary: React.FC<WorkflowNodeLibraryProps> = ({
  onAddModule,
  allowedCategories,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<WorkflowModuleCategory | "all">("all");

  const filteredModules = useMemo(() => {
    console.log('[WorkflowNodeLibrary:search]', searchTerm);
    return workflowModules.filter((m) => {
      const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           m.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || m.category === selectedCategory;
      const isAllowed = !allowedCategories || allowedCategories.includes(m.category);
      return matchesSearch && matchesCategory && isAllowed;
    });
  }, [searchTerm, selectedCategory, allowedCategories]);

  const modulesByCategory = useMemo(() => {
    const groups: Partial<Record<WorkflowModuleCategory, typeof workflowModules>> = {};
    filteredModules.forEach((m) => {
      if (!groups[m.category]) groups[m.category] = [];
      groups[m.category]!.push(m);
    });
    return groups;
  }, [filteredModules]);

  return (
    <div className="flex flex-col h-full bg-card/30 backdrop-blur-md border-r border-border shadow-inner">
      <div className="p-4 flex flex-col gap-4 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar módulo..."
            className="pl-9 h-10 bg-background/50 border-muted-foreground/20 focus-visible:ring-primary/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          <Badge 
            variant={selectedCategory === "all" ? "default" : "outline"}
            className="cursor-pointer transition-all hover:scale-105"
            onClick={() => setSelectedCategory("all")}
          >
            Todos
          </Badge>
          {Object.entries(categoryLabels).map(([id, label]) => (
            (!allowedCategories || allowedCategories.includes(id as WorkflowModuleCategory)) && (
              <Badge 
                key={id}
                variant={selectedCategory === id ? "default" : "outline"}
                className="cursor-pointer transition-all hover:scale-105"
                onClick={() => setSelectedCategory(id as WorkflowModuleCategory)}
              >
                {label}
              </Badge>
            )
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {filteredModules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted/30 mb-4">
              <Search className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Nenhum módulo encontrado</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {Object.entries(modulesByCategory).map(([category, modules]) => (
              <div key={category} className="flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 pl-1">
                  {categoryLabels[category as WorkflowModuleCategory]}
                </h3>
                <div className="grid gap-2">
                  {modules!.map((module) => {
                    const IconComponent = (LucideIcons as any)[module.icon] || HelpCircle;
                    return (
                      <button
                        key={module.id}
                        onClick={() => {
                          console.log('[WorkflowNodeLibrary:add-module]', module.id);
                          onAddModule(module.id);
                        }}
                        className="group flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-background/40 hover:bg-background/80 hover:border-primary/50 hover:shadow-lg transition-all text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                        aria-label={`Adicionar módulo ${module.title}`}
                      >
                        <div className={`p-2 rounded-lg bg-${module.color}-500/10 text-${module.color}-500 border border-${module.color}-500/20 group-hover:scale-110 transition-transform`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col gap-0.5 overflow-hidden">
                          <span className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                            {module.title}
                          </span>
                          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {module.description}
                          </p>
                        </div>
                        <Plus className="h-3 w-3 ml-auto text-muted-foreground/30 group-hover:text-primary transition-colors" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

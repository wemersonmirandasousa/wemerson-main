
import React, { useState, useEffect } from "react";
import { WorkflowHeader } from "./workflow-header";
import { WorkflowNodeLibrary } from "./workflow-node-library";
import { WorkflowCanvas } from "./workflow-canvas";
import { WorkflowStatus, WorkflowType } from "@/types/workflow";
import { workflowTypes } from "@/lib/workflow/workflow-types";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Library } from "lucide-react";

interface WorkflowBuilderProps {
  workflowId?: string;
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  workflowId = "novo-fluxo",
}) => {
  const [currentType, setCurrentType] = useState<WorkflowType>(workflowTypes[0]);
  const [status, setStatus] = useState<WorkflowStatus>("rascunho");
  const [title, setTitle] = useState("Meu Novo Fluxo");

  useEffect(() => {
    console.log('[WorkflowBuilder:init]', workflowId);
  }, [workflowId]);

  const handleTypeChange = (typeId: string) => {
    const newType = workflowTypes.find(t => t.id === typeId);
    if (newType) {
      console.log('[WorkflowBuilder:change-flow-type]', typeId);
      setCurrentType(newType);
      toast.success(`Tipo de fluxo alterado para: ${newType.label}`);
    }
  };

  const handleSave = () => {
    toast.success("Fluxo salvo com sucesso!");
    console.log('[WorkflowBuilder:save]', { title, type: currentType.id, status });
  };

  const handlePublish = () => {
    setStatus("ativo");
    toast.success("Fluxo publicado com sucesso!");
    console.log('[WorkflowBuilder:publish]');
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden text-foreground">
      <WorkflowHeader 
        title={title}
        status={status}
        typeId={currentType.id}
        onTypeChange={handleTypeChange}
        onBack={() => window.history.back()}
        onSave={handleSave}
        onDuplicate={() => toast.info("Funcionalidade de duplicação em breve")}
        onPublish={handlePublish}
      />
      
      <div className="flex flex-1 overflow-hidden relative">
        <aside className="hidden lg:flex w-80 h-full flex-col z-10 shadow-2xl border-r border-border/50">
          <WorkflowNodeLibrary 
            onAddModule={(moduleId) => {
              console.log('[WorkflowBuilder:add-module]', moduleId);
              toast.info(`Módulo adicionado: ${moduleId}`);
            }}
            allowedCategories={currentType.allowedCategories}
          />
        </aside>
        
        <main className="flex-1 relative h-full">
          <div className="lg:hidden absolute bottom-6 left-6 z-20">
            <Sheet>
              <SheetTrigger asChild>
                <Button size="icon" className="h-12 w-12 rounded-full shadow-2xl bg-primary hover:bg-primary/90">
                  <Library className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <WorkflowNodeLibrary 
                  onAddModule={(moduleId) => {
                    console.log('[WorkflowBuilder:add-module]', moduleId);
                    toast.info(`Módulo adicionado: ${moduleId}`);
                  }}
                  allowedCategories={currentType.allowedCategories}
                />
              </SheetContent>
            </Sheet>
          </div>

          <WorkflowCanvas 
            onAddNode={() => {
              console.log('[WorkflowBuilder:toolbar-add-node]');
            }}
          />
        </main>
      </div>
    </div>
  );
};

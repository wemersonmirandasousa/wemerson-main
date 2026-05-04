
import React from "react";
import { N8nWorkflowBlock } from "@/components/ui/n8n-workflow-block-shadcnui";
import { WorkflowToolbar } from "./workflow-toolbar";

interface WorkflowCanvasProps {
  onAddNode: () => void;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  onAddNode,
}) => {
  return (
    <div className="relative flex-1 bg-background overflow-hidden">
      <WorkflowToolbar 
        onAddNode={onAddNode}
        onClear={() => {
          if (confirm("Tem certeza que deseja limpar todo o fluxo?")) {
            console.log('[WorkflowBuilder:clear]');
          }
        }}
      />
      <div className="w-full h-full">
        {/* Reusing the existing visual block logic but it will be better integrated later */}
        <N8nWorkflowBlock />
      </div>
    </div>
  );
};


import React from "react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { workflowTypes } from "@/lib/workflow/workflow-types";
import { Label } from "@/components/ui/label";

interface WorkflowTypeSwitcherProps {
  currentTypeId: string;
  onTypeChange: (typeId: string) => void;
}

export const WorkflowTypeSwitcher: React.FC<WorkflowTypeSwitcherProps> = ({
  currentTypeId,
  onTypeChange,
}) => {
  return (
    <div className="flex flex-col gap-1.5 min-w-[200px]">
      <Label htmlFor="flow-type" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Tipo de fluxo
      </Label>
      <Select value={currentTypeId} onValueChange={(val) => {
        console.log('[WorkflowBuilder:change-flow-type]', val);
        onTypeChange(val);
      }}>
        <SelectTrigger id="flow-type" className="h-9 bg-background/50 backdrop-blur-sm border-muted-foreground/20">
          <SelectValue placeholder="Selecione o tipo" />
        </SelectTrigger>
        <SelectContent>
          {workflowTypes.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-sm">{type.label}</span>
                <span className="text-[10px] text-muted-foreground line-clamp-1">{type.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

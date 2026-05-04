
export type WorkflowStatus = 'rascunho' | 'ativo' | 'pausado' | 'arquivado';

export type WorkflowModuleCategory = 
  | 'gatilhos' 
  | 'acoes' 
  | 'condicoes' 
  | 'comunicacao' 
  | 'dados' 
  | 'integracoes' 
  | 'controle';

export type WorkflowTriggerType = 'webhook' | 'schedule' | 'event' | 'manual';

export type WorkflowExecutionMode = 'parallel' | 'sequential';

export interface WorkflowModuleDefinition {
  id: string;
  type: 'trigger' | 'action' | 'condition';
  category: WorkflowModuleCategory;
  title: string;
  description: string;
  icon: string; // lucide icon name
  color: string;
  supportedFlowTypes: string[];
  defaultConfig?: Record<string, any>;
}

export interface WorkflowNode {
  id: string;
  moduleId: string;
  position: { x: number; y: number };
  config?: Record<string, any>;
  title?: string; // override title
  description?: string; // override description
}

export interface WorkflowConnection {
  from: string;
  to: string;
}

export interface WorkflowType {
  id: string;
  label: string;
  description: string;
  allowedCategories: WorkflowModuleCategory[];
  recommendedModules: string[];
  accentStyle: string;
}

export interface WorkflowSummary {
  id: string;
  name: string;
  description: string;
  type: string;
  status: WorkflowStatus;
  nodesCount: number;
  connectionsCount: number;
  owner: string;
  updatedAt: string;
  createdAt: string;
}

export interface WorkflowFilters {
  search: string;
  status: WorkflowStatus[];
  type: string[];
  sortBy: 'name' | 'updatedAt' | 'status' | 'nodesCount';
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  type: string;
  status: WorkflowStatus;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  owner: string;
  updatedAt: string;
  createdAt: string;
}

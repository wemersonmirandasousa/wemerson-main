
import { motion, type PanInfo } from "framer-motion";
import type React from "react";
import { useRef, useState, useMemo } from "react";
// ... keep existing code

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Database,
  Mail,
  Plus,
  Settings,
  Webhook,
  Zap,
} from "lucide-react";
import { useWorkflowTheme } from "@/contexts/WorkflowThemeContext";
import { workflowThemes } from "@/lib/theme/workflow-theme-config";

// Interfaces
interface WorkflowNode {
  id: string;
  type: "trigger" | "action" | "condition";
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  position: { x: number; y: number };
}

interface WorkflowConnection {
  from: string;
  to: string;
}

// Constants
const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;

const nodeTemplates: Omit<WorkflowNode, "id" | "position">[] = [
  {
    type: "trigger",
    title: "Webhook",
    description: "Receber dados de serviço externo",
    icon: Webhook,
    color: "emerald",
  },
  {
    type: "action",
    title: "Database Query",
    description: "Buscar registros de usuários",
    icon: Database,
    color: "blue",
  },
  {
    type: "condition",
    title: "Condition",
    description: "Verificar status do usuário",
    icon: Settings,
    color: "amber",
  },
  {
    type: "action",
    title: "Send Email",
    description: "Notify user",
    icon: Mail,
    color: "purple",
  },
  {
    type: "action",
    title: "Log Event",
    description: "Record activity",
    icon: Zap,
    color: "indigo",
  },
];

const initialNodes: WorkflowNode[] = [
  {
    id: "node-1",
    type: "trigger",
    title: "Webhook",
    description: "Receber dados de serviço externo",
    icon: Webhook,
    color: "emerald",
    position: { x: 50, y: 100 },
  },
  {
    id: "node-2",
    type: "action",
    title: "Database Query",
    description: "Buscar registros de usuários",
    icon: Database,
    color: "blue",
    position: { x: 300, y: 100 },
  },
  {
    id: "node-3",
    type: "condition",
    title: "Condition",
    description: "Verificar status do usuário",
    icon: Settings,
    color: "amber",
    position: { x: 550, y: 100 },
  },
];

const initialConnections: WorkflowConnection[] = [
  { from: "node-1", to: "node-2" },
  { from: "node-2", to: "node-3" },
];

const colorClasses: Record<string, string> = {
  emerald: "border-emerald-400/40 bg-emerald-400/10 text-emerald-400",
  blue: "border-blue-400/40 bg-blue-400/10 text-blue-400",
  amber: "border-amber-400/40 bg-amber-400/10 text-amber-400",
  purple: "border-purple-400/40 bg-purple-400/10 text-purple-400",
  indigo: "border-indigo-400/40 bg-indigo-400/10 text-indigo-400",
};

// Connection Line Component
function WorkflowConnectionLine({
  from,
  to,
  nodes,
  colorClass,
}: {
  from: string;
  to: string;
  nodes: WorkflowNode[];
  colorClass: string;
}) {
  const fromNode = nodes.find((n) => n.id === from);
  const toNode = nodes.find((n) => n.id === to);
  if (!fromNode || !toNode) return null;

  const startX = fromNode.position.x + NODE_WIDTH;
  const startY = fromNode.position.y + NODE_HEIGHT / 2;
  const endX = toNode.position.x;
  const endY = toNode.position.y + NODE_HEIGHT / 2;

  const cp1X = startX + (endX - startX) * 0.5;
  const cp2X = endX - (endX - startX) * 0.5;

  const path = `M${startX},${startY} C${cp1X},${startY} ${cp2X},${endY} ${endX},${endY}`;

  return (
    <motion.path
      d={path}
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      className={colorClass}
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.5 }}
    />
  );
}

// Main Component
export function N8nWorkflowBlock() {
  const { theme } = useWorkflowTheme();
  const tokens = workflowThemes[theme];

  const [nodes, setNodes] = useState(initialNodes);
  const [connections, setConnections] = useState(initialConnections);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartPosition = useRef<{ x: number; y: number } | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [contentSize, setContentSize] = useState(() => {
    const maxX = Math.max(...initialNodes.map((n) => n.position.x + NODE_WIDTH));
    const maxY = Math.max(...initialNodes.map((n) => n.position.y + NODE_HEIGHT));
    return { width: maxX + 100, height: maxY + 100 };
  });

  // Drag Handlers
  const handleDragStart = (nodeId: string) => {
    setDraggingNodeId(nodeId);
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      dragStartPosition.current = { x: node.position.x, y: node.position.y };
    }
  };

  const handleDrag = (nodeId: string, { offset }: PanInfo) => {
    if (draggingNodeId !== nodeId || !dragStartPosition.current) return;

    const newX = dragStartPosition.current.x + offset.x;
    const newY = dragStartPosition.current.y + offset.y;

    const constrainedX = Math.max(0, newX);
    const constrainedY = Math.max(0, newY);

    setNodes((prev) =>
      prev.map((node) =>
        node.id === nodeId
          ? { ...node, position: { x: constrainedX, y: constrainedY } }
          : node
      )
    );


    setContentSize((prev) => ({
      width: Math.max(prev.width, constrainedX + NODE_WIDTH + 100),
      height: Math.max(prev.height, constrainedY + NODE_HEIGHT + 100),
    }));
  };

  const handleDragEnd = () => {
    setDraggingNodeId(null);
    dragStartPosition.current = null;
  };

  const handleNodeDoubleClick = (nodeId: string) => {
    console.log('[WorkflowNode:double-click]', nodeId);
    // In a real app, this would open a configuration panel or modal
    // For now we'll just show a toast or a log
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      alert(`Configurando módulo: ${node.title}\nID: ${node.id}`);
    }
  };

  // Add Node Handler
  const addNode = () => {
    const template = nodeTemplates[Math.floor(Math.random() * nodeTemplates.length)];
    const lastNode = nodes[nodes.length - 1];
    const newPosition = lastNode
      ? { x: lastNode.position.x + 250, y: lastNode.position.y }
      : { x: 50, y: 100 };

    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      ...template,
      position: newPosition,
    };

    setNodes((prev) => [...prev, newNode]);
    if (lastNode) {
      setConnections((prev) => [...prev, { from: lastNode.id, to: newNode.id }]);
    }


    setContentSize((prev) => ({
      width: Math.max(prev.width, newPosition.x + NODE_WIDTH + 100),
      height: Math.max(prev.height, newPosition.y + NODE_HEIGHT + 100),
    }));

    // Scroll to new node
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.scrollTo({
        left: newPosition.x + NODE_WIDTH - canvas.clientWidth + 150,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className={`flex flex-col w-full h-full border rounded-xl overflow-hidden transition-all duration-200 ${tokens.background} ${tokens.border} shadow-2xl`}>
      {/* Canvas */}
      <div 
        ref={canvasRef} 
        className={`flex-1 overflow-auto relative p-10 transition-all duration-200 ${tokens.canvas} ${
          theme === 'escuro' 
          ? 'bg-[radial-gradient(#1f2937_1px,transparent_1px)]' 
          : theme === 'claro'
          ? 'bg-[radial-gradient(#e5e7eb_1px,transparent_1px)]'
          : 'bg-[radial-gradient(#818cf8_1px,transparent_1px)]'
        } [background-size:20px_20px]`}
        role="region"
        aria-label="Workflow construction canvas"
        tabIndex={0}
      >
        {/* Content Wrapper */}
        <div style={{ width: contentSize.width, height: contentSize.height }} className="relative">
          {/* SVG Connections */}
          <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible">
            {connections.map((c, i) => (
              <WorkflowConnectionLine 
                key={`${c.from}-${c.to}-${i}`} 
                from={c.from} 
                to={c.to} 
                nodes={nodes} 
                colorClass={tokens.connection}
              />
            ))}
          </svg>

          {/* Nodes */}
          {nodes.map((node) => {
            const Icon = node.icon;
            const isDragging = draggingNodeId === node.id;

            return (
              <motion.div
                key={node.id}
                drag
                dragMomentum={false}
                onDragStart={() => handleDragStart(node.id)}
                onDrag={(_, info) => handleDrag(node.id, info)}
                onDragEnd={handleDragEnd}
                onDoubleClick={() => handleNodeDoubleClick(node.id)}
                style={{
                  x: node.position.x,
                  y: node.position.y,
                  width: NODE_WIDTH,
                  transformOrigin: "0 0",
                }}
                className="absolute cursor-grab active:cursor-grabbing z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                tabIndex={0}
                role="button"
                aria-label={`${node.type} node: ${node.title}. ${node.description}`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.02 }}
                whileDrag={{ scale: 1.05, zIndex: 50 }}
              >
                <Card className={`p-4 border-2 transition-all duration-200 ${isDragging ? "border-primary shadow-xl" : tokens.border + " shadow-sm"} hover:shadow-md ${tokens.node} ${tokens.textPrimary}`}>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${colorClasses[node.color] || "bg-muted"}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className={`text-[10px] uppercase font-bold tracking-wider opacity-60 ${tokens.textSecondary}`}>
                            {node.type === 'trigger' ? 'GATILHO' : node.type === 'action' ? 'AÇÃO' : 'CONDIÇÃO'}
                          </span>
                          <span className="text-sm font-bold truncate">
                            {node.title}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNodeDoubleClick(node.id);
                        }}
                        title="Configurações"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className={`text-xs line-clamp-2 ${tokens.textSecondary}`}>
                      {node.description}
                    </p>
                    <div className={`flex items-center justify-between pt-2 border-t mt-1 ${tokens.border}`}>
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className={`text-[10px] font-medium ${tokens.textSecondary}`}>Conectado</span>
                      </div>
                      <ArrowRight className={`h-3 w-3 opacity-30 ${tokens.textSecondary}`} />
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}

          {/* Floating Add Button in Canvas */}
          <div className="fixed bottom-20 right-10 z-50">
            <Button 
              onClick={addNode} 
              className="h-14 w-14 rounded-full shadow-2xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all hover:scale-110 active:scale-95 group"
              aria-label="Adicionar módulo"
            >
              <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
            </Button>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div 
        className={`px-6 py-3 border-t flex items-center justify-between text-[11px] font-medium transition-all duration-200 ${tokens.backgroundSecondary} ${tokens.textSecondary} ${tokens.border}`}
        aria-live="polite"
      >
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${tokens.accent}`} />
            <span>{nodes.length} {nodes.length === 1 ? "Módulo" : "Módulos"}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
            <span>{connections.length} {connections.length === 1 ? "Conexão" : "Conexões"}</span>
          </div>
        </div>
        <div>Arraste os módulos para reposicionar • Use o botão de engrenagem para configurações</div>
      </div>
    </div>
  );
}

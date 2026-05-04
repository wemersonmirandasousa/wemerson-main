
import { WorkflowType } from "@/types/workflow";

export const workflowTypes: WorkflowType[] = [
  {
    id: 'automacao',
    label: 'Automação',
    description: 'Fluxos de tarefas automáticas disparados por eventos.',
    allowedCategories: ['gatilhos', 'acoes', 'condicoes', 'comunicacao', 'dados', 'integracoes', 'controle'],
    recommendedModules: ['webhook', 'enviar-email', 'se-entao'],
    accentStyle: 'emerald',
  },
  {
    id: 'aprovacao',
    label: 'Aprovação',
    description: 'Processos que requerem revisão e aprovação humana ou automática.',
    allowedCategories: ['gatilhos', 'acoes', 'condicoes', 'controle'],
    recommendedModules: ['evento-formulario', 'aprovacao-manual', 'verificacao-status'],
    accentStyle: 'blue',
  },
  {
    id: 'notificacao',
    label: 'Notificação',
    description: 'Alertas e mensagens para canais internos e externos.',
    allowedCategories: ['gatilhos', 'acoes', 'comunicacao'],
    recommendedModules: ['agendamento', 'enviar-whatsapp', 'notificacao-interna'],
    accentStyle: 'purple',
  },
  {
    id: 'integracao',
    label: 'Integração',
    description: 'Sincronização de dados entre diferentes plataformas.',
    allowedCategories: ['gatilhos', 'acoes', 'dados', 'integracoes', 'controle'],
    recommendedModules: ['webhook', 'chamar-api', 'supabase'],
    accentStyle: 'indigo',
  },
  {
    id: 'atendimento',
    label: 'Atendimento',
    description: 'Fluxos de suporte e interação com clientes.',
    allowedCategories: ['gatilhos', 'acoes', 'comunicacao', 'dados', 'controle'],
    recommendedModules: ['recebimento-email', 'criar-protocolo', 'roteamento-prioridade'],
    accentStyle: 'orange',
  },
  {
    id: 'dados',
    label: 'Processamento de Dados',
    description: 'Transformação, limpeza e consolidação de grandes volumes de dados.',
    allowedCategories: ['gatilhos', 'acoes', 'dados', 'integracoes', 'controle'],
    recommendedModules: ['upload-arquivo', 'transformar-dados', 'consolidar-dados'],
    accentStyle: 'amber',
  },
];

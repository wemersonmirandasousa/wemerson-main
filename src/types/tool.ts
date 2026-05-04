import { Tables } from '@/integrations/supabase/types';

// Base type from DB
type ToolRow = Tables<'tools'>;

// Extended type with new columns
export type Tool = ToolRow & {
  link_contexto?: string | null;
  link_criacao_prompt?: string | null;
  link_gpt_criacao_prompt?: string | null;
  link_gpt_transformacao_contexto?: string | null;
  link_gpt_transformacao_base_conhecimento?: string | null;
  link_contexto_transformacao_base_conhecimento?: string | null;
  link_gpt_pronto?: string | null;
  funcao?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
  categoria?: string | null;
  print_processo_url?: string | null;
  print_resultado_url?: string | null;
  empresa_id?: string | null;
  origem?: string | null;
  origem_detalhe?: string | null;
  imported_from_file_name?: string | null;
  version_number?: number | null;
  cor_cartao?: string | null;
};

export type KnowledgeFile = Tables<'knowledge_files'>;

export interface SocialCard {
  id: string;
  titulo: string;
  descricao: string;
  button_label: string;
  url: string;
  icon: string;
  image_url?: string | null;
  ordem: number;
  ativo: boolean;
  criado_em: string;
  criado_por: string | null;
  atualizado_em: string;
  atualizado_por: string | null;
}

export interface ToolBlock {
  id: string;
  tool_id: string;
  block_type: string;
  titulo: string;
  descricao: string | null;
  conteudo: string | null;
  ordem: number;
  aba: string;
  visibility_visitor: boolean;
  visibility_reader: boolean;
  visibility_editor: boolean;
  storage_path: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface ToolAccessLog {
  id: string;
  tool_id: string;
  event_type: string;
  access_profile: string;
  user_id: string | null;
  user_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_name: string | null;
  os_name: string | null;
  browser_name: string | null;
  created_at: string;
}

export interface ToolRecursos {
  webSearch: boolean;
  appsBeta: boolean;
  lousa: boolean;
  imagens: boolean;
  codeInterpreter: boolean;
}

export interface ToolAcao {
  id: string;
  titulo: string;
  descricao: string;
}

export interface ToolLinksProducao {
  gptDefinicaoPromptUrl: string | null;
  gptDefinicaoBaseUrl: string | null;
  chatDefinicaoContextoUrl: string | null;
  chatDefinicaoPromptUrl: string | null;
}

export interface ToolVersion {
  id: string;
  tool_id: string;
  version_number: number;
  snapshot: any;
  changed_by: string | null;
  changed_fields: string[] | null;
  change_summary: string | null;
  created_at: string;
}

export interface ToolFavorite {
  id: string;
  user_id: string;
  tool_id: string;
  created_at: string;
}

export interface AdminActionLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action_type: string;
  target_type: string;
  target_id: string | null;
  target_name: string | null;
  summary: string | null;
  created_at: string;
}

export interface ToolExportData {
  nome: string;
  funcao: string;
  descricao: string;
  instrucoes: string;
  credenciais: {
    login: string;
    email: string;
    senha: string;
    url: string;
    keys: {
      anon_public: string;
      publish_key: string;
      secret_key: string;
      service_role: string;
      project_id: string;
    };
    apis: Array<{
      nome: string;
      valor: string;
      ordem: number;
    }>;
  };
  links: {
    acesso: string;
    blueprint: string;
    gerador: string;
  };
  gpts: {
    criacao_prompt: Array<{
      nome: string;
      url: string;
    }>;
    usados: Array<{
      nome: string;
      url: string;
    }>;
  };
  base_conhecimento: {
    arquivos: Array<{
      nome: string;
      tipo: string;
      tamanho: number;
      url: string;
      path: string;
      uploadedAt?: string;
    }>;
  };
  prompt: string;
  modelo_recomendado: string;
  features: {
    busca_web: boolean;
    apps_beta: boolean;
    lousa: boolean;
    geracao_imagens: boolean;
    interprete_codigo: boolean;
  };
  quebra_gelos: string[];
  ferramentas_vinculadas: Array<{
    id: string;
    nome: string;
  }>;
  status: string;
  historico: Array<{
    id: string;
    titulo: string;
    descricao: string;
  }>;
}

// CATEGORIAS — primary classification (defines tool type)

export const CATEGORIAS = [
  { nome: "GPT's", icon: 'Bot', cor: 'from-emerald-500/20 to-emerald-500/5', toolType: 'gpt' },
  { nome: 'Automações', icon: 'Zap', cor: 'from-amber-500/20 to-amber-500/5', toolType: 'automacao' },
  { nome: 'Designs', icon: 'Palette', cor: 'from-pink-500/20 to-pink-500/5', toolType: 'artes' },
  { nome: 'Documentos', icon: 'FileText', cor: 'from-blue-500/20 to-blue-500/5', toolType: 'documento' },
  { nome: 'Sistemas', icon: 'Monitor', cor: 'from-purple-500/20 to-purple-500/5', toolType: 'site' },
  { nome: 'Assistentes', icon: 'Headphones', cor: 'from-cyan-500/20 to-cyan-500/5', toolType: 'assistentes' },
  { nome: "DataBase's", icon: 'Database', cor: 'from-teal-500/20 to-teal-500/5', toolType: 'database' },
  { nome: 'Android', icon: 'Smartphone', cor: 'from-green-500/20 to-green-500/5', toolType: 'android' },
  { nome: 'iOS', icon: 'Apple', cor: 'from-gray-500/20 to-gray-500/5', toolType: 'ios' },
  { nome: 'Agentes', icon: 'Bot', cor: 'from-orange-500/20 to-orange-500/5', toolType: 'agentes' },
] as const;

// Map categoria name → internal tool_type value
export function categoriaToToolType(categoria: string): string {
  const found = CATEGORIAS.find(c => c.nome === categoria);
  return found?.toolType || 'gpt';
}

// Map tool_type → categoria name
export function toolTypeToCategoria(toolType: string): string {
  const found = CATEGORIAS.find(c => c.toolType === toolType);
  return found?.nome || "GPT's";
}

// Setor / Departamento — secondary classification
export const SETORES = [
  'Todas as ferramentas',
  'Contábil',
  'Fiscal',
  'RH',
  'Comercial',
  'Jurídico',
  'Operações',
  'Setor de Desenvolvimento',
  'Departamento Pessoal',
  'Departamento Fiscal',
  'Departamento Contábil',
  'Departamento De Marketing',
  'Departamento Financeiro',
] as const;

export const STATUS_OPTIONS = ['active', 'draft', 'archived', 'outdated'] as const;

// Kept for backward compat in some places
export const TOOL_TYPES = [
  { value: 'gpt', label: "GPT's" },
  { value: 'site', label: 'Sistemas' },
  { value: 'automacao', label: 'Automações' },
  { value: 'artes', label: 'Designs' },
  { value: 'documento', label: 'Documentos' },
  { value: 'assistentes', label: 'Assistentes' },
  { value: 'database', label: "DataBase's" },
  { value: 'android', label: 'Android' },
  { value: 'ios', label: 'iOS' },
  { value: 'agentes', label: 'Agentes' },
] as const;

export const BLOCK_TYPES = [
  { value: 'short_text', label: 'Texto curto' },
  { value: 'long_text', label: 'Texto longo' },
  { value: 'url', label: 'URL' },
  { value: 'image_upload', label: 'Upload de imagem' },
  { value: 'file_upload', label: 'Upload de arquivo' },
  { value: 'list', label: 'Lista' },
  { value: 'credential', label: 'Credencial' },
  { value: 'print_gallery', label: 'Galeria de prints' },
  { value: 'prompt', label: 'Prompt' },
  { value: 'attachment_group', label: 'Anexos' },
] as const;

export const MODELOS_RECOMENDADOS = [
  'Nenhum modelo recomendado',
  'GPT-4o',
  'GPT-4o mini',
  'GPT-4',
  'GPT-3.5 Turbo',
  'o1-preview',
  'o1-mini',
] as const;

// Map AÇÕES status values from import/export
export function acoesStatusToToolStatus(acoes: string): string {
  const upper = acoes.trim().toUpperCase();
  if (upper === 'ATIVAR') return 'active';
  if (upper === 'RASCUNHO') return 'draft';
  if (upper === 'DESATIVAR') return 'archived';
  return 'draft';
}

export function toolStatusToAcoes(status: string): string {
  if (status === 'active') return 'ATIVAR';
  if (status === 'archived') return 'DESATIVAR';
  return 'RASCUNHO';
}

export function parseRecursos(json: unknown): ToolRecursos {
  const defaults: ToolRecursos = { webSearch: false, appsBeta: false, lousa: false, imagens: false, codeInterpreter: false };
  if (!json || typeof json !== 'object') return defaults;
  return { ...defaults, ...(json as Record<string, boolean>) };
}

export function parseAcoes(json: unknown): ToolAcao[] {
  if (!Array.isArray(json)) return [];
  return json as ToolAcao[];
}

export function parseLinksProducao(json: unknown): ToolLinksProducao {
  const defaults: ToolLinksProducao = { gptDefinicaoPromptUrl: null, gptDefinicaoBaseUrl: null, chatDefinicaoContextoUrl: null, chatDefinicaoPromptUrl: null };
  if (!json || typeof json !== 'object') return defaults;
  return { ...defaults, ...(json as Record<string, string | null>) };
}

export function parseUserAgent(ua: string): { device: string; os: string; browser: string } {
  let os = 'Desconhecido';
  let browser = 'Desconhecido';
  let device = 'Desktop';

  if (/iPhone/i.test(ua)) { device = 'iPhone'; os = 'iOS'; }
  else if (/iPad/i.test(ua)) { device = 'iPad'; os = 'iOS'; }
  else if (/Android/i.test(ua)) { device = 'Android'; os = 'Android'; }
  else if (/Mac/i.test(ua)) { os = 'macOS'; }
  else if (/Windows/i.test(ua)) { os = 'Windows'; }
  else if (/Linux/i.test(ua)) { os = 'Linux'; }

  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';

  return { device, os, browser };
}

// Category name migration helpers — map old names to new
export const CATEGORY_MIGRATION_MAP: Record<string, string> = {
  'GPT': "GPT's",
  'Automação': 'Automações',
  'Sistema': 'Sistemas',
  'Documento': 'Documentos',
  'Arte': 'Designs',
  'Database': "DataBase's",
};

export function migrateCategoryName(name: string): string {
  return CATEGORY_MIGRATION_MAP[name] || name;
}

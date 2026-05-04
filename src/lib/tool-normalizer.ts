import { ToolExportData } from "@/types/tool";
import { defaultToolData } from "./tool-defaults";

export const normalizeString = (val: any): string => (typeof val === 'string' ? val : '');
export const normalizeBoolean = (val: any): boolean => (typeof val === 'boolean' ? val : false);
export const normalizeArray = (val: any): any[] => (Array.isArray(val) ? val : []);

export const normalizeToolData = (data: Partial<ToolExportData>): ToolExportData => {
  return {
    nome: normalizeString(data.nome),
    funcao: normalizeString(data.funcao),
    descricao: normalizeString(data.descricao),
    instrucoes: normalizeString(data.instrucoes),
    credenciais: {
      login: normalizeString(data.credenciais?.login),
      email: normalizeString(data.credenciais?.email),
      senha: normalizeString(data.credenciais?.senha),
      url: normalizeString(data.credenciais?.url),
      keys: {
        anon_public: normalizeString(data.credenciais?.keys?.anon_public),
        publish_key: normalizeString(data.credenciais?.keys?.publish_key),
        secret_key: normalizeString(data.credenciais?.keys?.secret_key),
        service_role: normalizeString(data.credenciais?.keys?.service_role),
        project_id: normalizeString(data.credenciais?.keys?.project_id),
      },
      apis: normalizeArray(data.credenciais?.apis).map(api => ({
        nome: normalizeString(api.nome),
        valor: normalizeString(api.valor),
        ordem: typeof api.ordem === 'number' ? api.ordem : 0
      })),
    },
    links: {
      acesso: normalizeString(data.links?.acesso),
      blueprint: normalizeString(data.links?.blueprint),
      gerador: normalizeString(data.links?.gerador),
    },
    gpts: {
      criacao_prompt: normalizeArray(data.gpts?.criacao_prompt).map(gpt => ({
        nome: normalizeString(gpt.nome),
        url: normalizeString(gpt.url),
      })),
      usados: normalizeArray(data.gpts?.usados).map(gpt => ({
        nome: normalizeString(gpt.nome),
        url: normalizeString(gpt.url),
      })),
    },
    base_conhecimento: {
      arquivos: normalizeArray(data.base_conhecimento?.arquivos).map(file => ({
        nome: normalizeString(file.nome),
        tipo: normalizeString(file.tipo),
        tamanho: typeof file.tamanho === 'number' ? file.tamanho : 0,
        url: normalizeString(file.url),
        path: normalizeString(file.path),
        uploadedAt: normalizeString(file.uploadedAt),
      })),
    },
    prompt: normalizeString(data.prompt),
    modelo_recomendado: normalizeString(data.modelo_recomendado),
    features: {
      busca_web: normalizeBoolean(data.features?.busca_web),
      apps_beta: normalizeBoolean(data.features?.apps_beta),
      lousa: normalizeBoolean(data.features?.lousa),
      geracao_imagens: normalizeBoolean(data.features?.geracao_imagens),
      interprete_codigo: normalizeBoolean(data.features?.interprete_codigo),
    },
    quebra_gelos: normalizeArray(data.quebra_gelos).map(q => normalizeString(q)),
    ferramentas_vinculadas: normalizeArray(data.ferramentas_vinculadas).map(link => ({
      id: normalizeString(link.id),
      nome: normalizeString(link.nome),
    })),
    status: normalizeString(data.status) || 'draft',
    historico: normalizeArray(data.historico).map(h => ({
      id: normalizeString(h.id),
      titulo: normalizeString(h.titulo),
      descricao: normalizeString(h.descricao),
    })),
  };
};

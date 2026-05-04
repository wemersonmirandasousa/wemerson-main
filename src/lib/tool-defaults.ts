import { ToolExportData } from "@/types/tool";

export const defaultToolData: ToolExportData = {
  nome: "",
  funcao: "",
  descricao: "",
  instrucoes: "",
  credenciais: {
    login: "",
    email: "",
    senha: "",
    url: "",
    keys: {
      anon_public: "",
      publish_key: "",
      secret_key: "",
      service_role: "",
      project_id: "",
    },
    apis: [],
  },
  links: {
    acesso: "",
    blueprint: "",
    gerador: "",
  },
  gpts: {
    criacao_prompt: [],
    usados: [],
  },
  base_conhecimento: {
    arquivos: [],
  },
  prompt: "",
  modelo_recomendado: "",
  features: {
    busca_web: false,
    apps_beta: false,
    lousa: false,
    geracao_imagens: false,
    interprete_codigo: false,
  },
  quebra_gelos: [],
  ferramentas_vinculadas: [],
  status: "draft",
  historico: [],
};

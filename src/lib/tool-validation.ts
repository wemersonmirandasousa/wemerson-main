import { ToolExportData } from "@/types/tool";

export function validateToolExportCompleteness(data: any): data is ToolExportData {
  const requiredKeys: (keyof ToolExportData)[] = [
    "nome", "funcao", "descricao", "instrucoes", "credenciais", "links", "gpts", 
    "base_conhecimento", "prompt", "modelo_recomendado", "features", 
    "quebra_gelos", "ferramentas_vinculadas", "status", "historico"
  ];

  const missingKeys = requiredKeys.filter(key => !(key in data));
  
  if (missingKeys.length > 0) {
    console.error('[ToolExport:validation] Missing keys:', missingKeys);
    return false;
  }

  // Check nested structures
  if (!data.credenciais.keys) return false;
  if (!Array.isArray(data.credenciais.apis)) return false;
  if (!Array.isArray(data.gpts.criacao_prompt)) return false;
  if (!Array.isArray(data.gpts.usados)) return false;
  if (!Array.isArray(data.base_conhecimento.arquivos)) return false;
  if (!data.features) return false;
  if (!Array.isArray(data.quebra_gelos)) return false;
  if (!Array.isArray(data.ferramentas_vinculadas)) return false;
  if (!Array.isArray(data.historico)) return false;

  return true;
}

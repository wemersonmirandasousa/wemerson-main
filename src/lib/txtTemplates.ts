// TXT templates for each tool type - export & import

export const TXT_TEMPLATES: Record<string, string> = {
  gpt: `GPT

{
EMPRESA : 

CATEGORIA : GPT

NOME : 

FUNÇÃO : 

INSTRUÇÕES : 

LINK DE CONTEXTO COM PROMPT FINAL : 

LINK DO GPT DE CRIAÇÃO DO PROMPT : 

LINK DO CONTEXTO DE TRANSFORMAÇÃO DA BASE DE CONHECIMENTO : 

LINK DO GPT PARA CONVERSÃO DE BASE DE CONHECIMENTO : 

ARQUIVOS BASE DE CONHECIMENTO : 

LINK DA FERRAMENTA : 

PROMPT : 

MODELO RECOMENDADO : 

ITENS MARCADOS NO GPT :
Busca na web
Aplicativos (beta)
Lousa
Geração de imagens
Intérprete de código

DATA_ULTIMA_ATUALIZACAO : 

AÇÕES : ATIVAR
}`,

  assistentes: `ASSISTENTES

{
EMPRESA : 

CATEGORIA : Assistentes

NOME : 

FUNÇÃO : 

INSTRUÇÕES : 

LINK DE CONTEXTO COM PROMPT FINAL : 

LINK DO GPT DE CRIAÇÃO DO PROMPT : 

LINK DO CONTEXTO DE TRANSFORMAÇÃO DA BASE DE CONHECIMENTO : 

LINK DO GPT PARA CONVERSÃO DE BASE DE CONHECIMENTO : 

ARQUIVOS BASE DE CONHECIMENTO : 

LINK DA FERRAMENTA : 

PROMPT : 

MODELO RECOMENDADO : 

DATA_ULTIMA_ATUALIZACAO : 

AÇÕES : ATIVAR
}`,

  site: `SISTEMA

{
EMPRESA : 

CATEGORIA : Sistema

NOME : 

EMAIL : 

SENHA : 

LINK DA FERRAMENTA :

GERADOR : 

LINK DE CONTEXTO COM PROMPT :

FUNÇÃO :

LINK DO GPT USADO :

PROMPT :

DATA_ULTIMA_ATUALIZACAO : 

AÇÕES : ATIVAR
}`,

  automacao: `AUTOMAÇÃO

{
EMPRESA : 

CATEGORIA : Automação

NOME : 

EMAIL : 

SENHA : 

LINK DO BLUEPRINT :

PROMPT 1 :

PROMPT 2 :

PROMPT 3 :

FUNÇÃO :

LINK DO GPT USADO :

DATA_ULTIMA_ATUALIZACAO : 

AÇÕES : ATIVAR
}`,

  artes: `ARTES

{
EMPRESA : 

CATEGORIA : Arte

NOME : 

LINK DE ACESSO :

DATA_ULTIMA_ATUALIZACAO : 

AÇÕES : ATIVAR
}`,

  documento: `DOCUMENTO

{
EMPRESA : 

CATEGORIA : Documento

NOME : 

LINK DE ACESSO :

DATA_ULTIMA_ATUALIZACAO : 

AÇÕES : ATIVAR
}`,
};

// Parse a TXT file content into a partial tool object
export function parseTxtImport(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  
  // Detect type from first line
  const firstLine = content.trim().split('\n')[0].trim().toUpperCase();
  if (firstLine.includes('ASSISTENTE')) result._type = 'assistentes';
  else if (firstLine.includes('GPT')) result._type = 'gpt';
  else if (firstLine.includes('SISTEMA')) result._type = 'site';
  else if (firstLine.includes('AUTOMAÇÃO') || firstLine.includes('AUTOMACAO')) result._type = 'automacao';
  else if (firstLine.includes('ARTE')) result._type = 'artes';
  else if (firstLine.includes('DOCUMENTO')) result._type = 'documento';

  // Parse key : value pairs
  const lines = content.split('\n');
  let currentKey = '';
  let currentValue = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '{' || trimmed === '}' || trimmed === '') continue;
    
    // Check if this is a key: value line
    const colonIndex = trimmed.indexOf(' : ');
    if (colonIndex > 0) {
      // Save previous
      if (currentKey) {
        result[currentKey] = currentValue.trim();
      }
      currentKey = trimmed.substring(0, colonIndex).trim();
      currentValue = trimmed.substring(colonIndex + 3).trim();
    } else if (currentKey) {
      // Continuation of previous value
      if (currentValue) currentValue += '\n';
      currentValue += trimmed;
    }
  }
  // Save last
  if (currentKey) {
    result[currentKey] = currentValue.trim();
  }

  return result;
}

export function txtToToolData(parsed: Record<string, string>) {
  const toolType = parsed._type || 'gpt';
  
  // Map AÇÕES to status
  let status: 'active' | 'draft' | 'archived' = 'draft';
  const acoes = parsed['AÇÕES'] || parsed['ACOES'] || '';
  if (acoes) {
    const upper = acoes.trim().toUpperCase();
    if (upper === 'ATIVAR') status = 'active';
    else if (upper === 'DESATIVAR') status = 'archived';
    else if (upper === 'RASCUNHO') status = 'draft';
  }

  // Map CATEGORIA to the new primary classification
  const categoriaRaw = parsed['CATEGORIA'] || '';
  let categoria = '';
  if (categoriaRaw) {
    const upper = categoriaRaw.trim();
    const map: Record<string, string> = {
      'GPT': 'GPT', 'AUTOMAÇÃO': 'Automação', 'AUTOMACAO': 'Automação',
      'SISTEMA': 'Sistema', 'DOCUMENTO': 'Documento', 'ARTE': 'Arte', 'ARTES': 'Arte',
      'ASSISTENTES': 'Assistentes', 'ASSISTENTE': 'Assistentes',
    };
    categoria = map[upper.toUpperCase()] || upper;
  }

  return {
    titulo: parsed['NOME'] || '',
    tool_type: toolType,
    categoria,
    empresa_nome: parsed['EMPRESA'] || '',
    funcao: parsed['FUNÇÃO'] || parsed['FUNCAO'] || '',
    instrucoes: parsed['INSTRUÇÕES'] || parsed['INSTRUCOES'] || '',
    link_contexto: parsed['LINK DE CONTEXTO COM PROMPT FINAL'] || parsed['LINK DE CONTEXTO COM PROMPT'] || '',
    link_criacao_prompt: parsed['LINK DO GPT DE CRIAÇÃO DO PROMPT'] || parsed['LINK DO GPT DE CRIACAO DO PROMPT'] || '',
    link_contexto_transformacao_base_conhecimento: parsed['LINK DO CONTEXTO DE TRANSFORMAÇÃO DA BASE DE CONHECIMENTO'] || '',
    link_gpt_transformacao_base_conhecimento: parsed['LINK DO GPT PARA CONVERSÃO DE BASE DE CONHECIMENTO'] || '',
    link_acesso_original: parsed['LINK DA FERRAMENTA'] || parsed['LINK DE ACESSO'] || parsed['LINK DO BLUEPRINT'] || '',
    prompt_final: parsed['PROMPT'] || parsed['PROMPT 1'] || '',
    modelo_recomendado: parsed['MODELO RECOMENDADO'] || '',
    credential_email: parsed['EMAIL'] || '',
    credential_senha: parsed['SENHA'] || '',
    data_ultima_atualizacao: parsed['DATA_ULTIMA_ATUALIZACAO'] || '',
    status,
  };
}

export function toolToTxt(tool: any, empresaNome?: string): string {
  const cat = tool.categoria || 'GPT';
  const tt = tool.tool_type || 'gpt';
  
  let header = 'GPT';
  if (tt === 'assistentes') header = 'ASSISTENTES';
  else if (tt === 'site') header = 'SISTEMA';
  else if (tt === 'automacao') header = 'AUTOMAÇÃO';
  else if (tt === 'artes') header = 'ARTES';
  else if (tt === 'documento') header = 'DOCUMENTO';

  const lines: string[] = [header, '', '{'];
  lines.push(`EMPRESA : ${empresaNome || ''}`);
  lines.push(`CATEGORIA : ${cat}`);
  lines.push('');
  lines.push(`NOME : ${tool.titulo || ''}`);

  if (tt === 'gpt' || tt === 'assistentes') {
    lines.push(`FUNÇÃO : ${tool.funcao || ''}`);
    lines.push(`INSTRUÇÕES : ${tool.instrucoes || ''}`);
    lines.push(`LINK DE CONTEXTO COM PROMPT FINAL : ${tool.link_contexto || ''}`);
    lines.push(`LINK DO GPT DE CRIAÇÃO DO PROMPT : ${tool.link_criacao_prompt || ''}`);
    lines.push(`LINK DO CONTEXTO DE TRANSFORMAÇÃO DA BASE DE CONHECIMENTO : ${tool.link_contexto_transformacao_base_conhecimento || ''}`);
    lines.push(`LINK DO GPT PARA CONVERSÃO DE BASE DE CONHECIMENTO : ${tool.link_gpt_transformacao_base_conhecimento || ''}`);
    lines.push(`ARQUIVOS BASE DE CONHECIMENTO : `);
    lines.push(`LINK DA FERRAMENTA : ${tool.link_acesso_original || ''}`);
    lines.push(`PROMPT : ${tool.prompt_final || ''}`);
    lines.push(`MODELO RECOMENDADO : ${tool.modelo_recomendado || ''}`);
    if (tt === 'gpt') {
      lines.push(`ITENS MARCADOS NO GPT :`);
      const r = tool.recursos || {};
      if (r.webSearch) lines.push('Busca na web');
      if (r.appsBeta) lines.push('Aplicativos (beta)');
      if (r.lousa) lines.push('Lousa');
      if (r.imagens) lines.push('Geração de imagens');
      if (r.codeInterpreter) lines.push('Intérprete de código');
    }
    lines.push(`QUEBRA-GELOS : ${(tool.quebra_gelos || []).join('; ')}`);
  } else if (tt === 'site') {
    lines.push(`EMAIL : ${tool.credential_email || ''}`);
    lines.push(`SENHA : ${tool.credential_senha || ''}`);
    lines.push(`LINK DA FERRAMENTA : ${tool.link_acesso_original || ''}`);
    lines.push(`GERADOR : `);
    lines.push(`LINK DE CONTEXTO COM PROMPT : ${tool.link_contexto || ''}`);
    lines.push(`FUNÇÃO : ${tool.funcao || ''}`);
    lines.push(`LINK DO GPT USADO : ${tool.link_gpt_pronto || ''}`);
    lines.push(`PROMPT : ${tool.prompt_final || ''}`);
  } else if (tt === 'automacao') {
    lines.push(`EMAIL : ${tool.credential_email || ''}`);
    lines.push(`SENHA : ${tool.credential_senha || ''}`);
    lines.push(`LINK DO BLUEPRINT : ${tool.link_acesso_original || ''}`);
    lines.push(`PROMPT 1 : ${tool.prompt_final || ''}`);
    lines.push(`FUNÇÃO : ${tool.funcao || ''}`);
    lines.push(`LINK DO GPT USADO : ${tool.link_gpt_pronto || ''}`);
  } else if (tt === 'artes' || tt === 'documento') {
    lines.push(`LINK DE ACESSO : ${tool.link_acesso_original || ''}`);
  }

  // Last update date
  const updatedAt = tool.atualizado_em ? new Date(tool.atualizado_em).toLocaleDateString('pt-BR') : '';
  lines.push(`DATA_ULTIMA_ATUALIZACAO : ${updatedAt}`);

  // Status as AÇÕES
  let acoes = 'RASCUNHO';
  if (tool.status === 'active') acoes = 'ATIVAR';
  else if (tool.status === 'archived') acoes = 'DESATIVAR';
  lines.push('');
  lines.push(`AÇÕES : ${acoes}`);
  lines.push('}');

  return lines.join('\n');
}

export function toolsToConsolidatedTxt(tools: any[], empresaNome?: string): string {
  const groups: Record<string, any[]> = {};
  for (const t of tools) {
    const cat = t.categoria || 'GPT';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(t);
  }

  const sections: string[] = [];
  for (const [cat, catTools] of Object.entries(groups)) {
    sections.push(`empresa = ${empresaNome || ''}`);
    sections.push(`categoria = ${cat}`);
    sections.push('');
    for (const tool of catTools) {
      sections.push(toolToTxt(tool, empresaNome));
      sections.push('');
    }
  }

  return sections.join('\n');
}

export function downloadTxtTemplate(type: string) {
  const template = TXT_TEMPLATES[type];
  if (!template) return;
  const blob = new Blob([template], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `modelo_${type}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadToolAsTxt(tool: any, empresaNome?: string) {
  const content = toolToTxt(tool, empresaNome);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(tool.titulo || 'ferramenta').replace(/\s+/g, '_')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

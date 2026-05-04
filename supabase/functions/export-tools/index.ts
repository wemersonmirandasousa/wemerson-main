import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import * as XLSX from 'https://esm.sh/xlsx@0.18.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: corsHeaders })
  }

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  const { data: roleData } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (roleData?.role !== 'editor') {
    return new Response(JSON.stringify({ error: 'Sem permissão' }), { status: 403, headers: corsHeaders })
  }

  try {
    const { data: tools, error } = await adminClient
      .from('tools')
      .select('*')
      .is('deleted_at', null)
      .order('criado_em', { ascending: false })

    if (error) throw error

    // Load credentials
    const toolIds = (tools || []).map(t => t.id)
    let credsMap: Record<string, any> = {}
    if (toolIds.length > 0) {
      for (let i = 0; i < toolIds.length; i += 100) {
        const batch = toolIds.slice(i, i + 100)
        const { data: creds } = await adminClient
          .from('tool_credentials')
          .select('tool_id, credential_email, credential_senha, prompt_final')
          .in('tool_id', batch)
        for (const c of (creds || [])) {
          credsMap[c.tool_id] = c
        }
      }
    }

    // Load companies
    const { data: companies } = await adminClient.from('companies').select('id, name')
    const companyMap: Record<string, string> = {}
    for (const c of (companies || [])) {
      companyMap[c.id] = c.name
    }

    // Load knowledge files
    const { data: knowledgeFiles } = await adminClient.from('knowledge_files').select('tool_id, file_name')
    const kfMap: Record<string, string[]> = {}
    for (const kf of (knowledgeFiles || [])) {
      if (!kfMap[kf.tool_id]) kfMap[kf.tool_id] = []
      kfMap[kf.tool_id].push(kf.file_name)
    }

    const statusMap: Record<string, string> = { active: 'ATIVAR', draft: 'RASCUNHO', archived: 'DESATIVAR' }

    const parseRecursos = (r: any) => {
      if (!r || typeof r !== 'object') return ''
      const items: string[] = []
      if (r.webSearch) items.push('Web Search')
      if (r.appsBeta) items.push('Apps Beta')
      if (r.lousa) items.push('Lousa')
      if (r.imagens) items.push('Imagens')
      if (r.codeInterpreter) items.push('Code Interpreter')
      return items.join(', ')
    }

    const rows = (tools || []).map(t => {
      const tc = credsMap[t.id] || {}
      const kf = kfMap[t.id] || []
      return {
        EMPRESA: companyMap[t.empresa_id] || '',
        CATEGORIA: t.categoria || '',
        'SETOR / DEPARTAMENTO': t.setores || '',
        NOME: t.titulo,
        DESCRIÇÃO: t.descricao || '',
        FUNÇÃO: t.funcao || '',
        EMAIL: tc.credential_email || '',
        SENHA: tc.credential_senha || '',
        'LINK DA FERRAMENTA': t.link_acesso_original || '',
        INSTRUÇÕES: t.instrucoes || '',
        PROMPT: tc.prompt_final || '',
        'MODELO RECOMENDADO': t.modelo_recomendado || '',
        'LINK DE CONTEXTO': t.link_contexto || '',
        'LINK DO GPT DE CRIAÇÃO DO PROMPT': t.link_criacao_prompt || '',
        'LINK DO CONTEXTO DE TRANSFORMAÇÃO DA BASE DE CONHECIMENTO': t.link_contexto_transformacao_base_conhecimento || '',
        'LINK DO GPT PARA CONVERSÃO DE BASE DE CONHECIMENTO': t.link_gpt_transformacao_base_conhecimento || '',
        'LINK DO GPT USADO': t.link_gpt_pronto || '',
        'LINK DO GPT TRANSFORMAÇÃO CONTEXTO': t.link_gpt_transformacao_contexto || '',
        'PRINT PROCESSO URL': t.print_processo_url || '',
        'PRINT RESULTADO URL': t.print_resultado_url || '',
        'ARQUIVOS BASE DE CONHECIMENTO': kf.join('; '),
        'ITENS MARCADOS NO GPT': parseRecursos(t.recursos),
        'QUEBRA-GELOS': (t.quebra_gelos || []).join('; '),
        'TAGS': (t.tags || []).join('; '),
        STATUS: t.status || '',
        AÇÕES: statusMap[t.status] || 'RASCUNHO',
        DATA_ULTIMA_ATUALIZACAO: t.atualizado_em ? new Date(t.atualizado_em).toLocaleDateString('pt-BR') : '',
      }
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Ferramentas')
    const xlsxBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })

    return new Response(new Uint8Array(xlsxBuffer), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="ferramentas.xlsx"',
      },
    })
  } catch (err: unknown) {
    console.error('Export error:', err);
    return new Response(JSON.stringify({ error: 'Erro interno ao exportar' }), { status: 500, headers: corsHeaders })
  }
})

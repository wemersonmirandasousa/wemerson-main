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
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) {
      return new Response(JSON.stringify({ error: 'Arquivo não encontrado' }), { status: 400, headers: corsHeaders })
    }

    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(sheet)

    if (rows.length > 500) {
      return new Response(JSON.stringify({ error: 'Máximo 500 linhas por importação' }), { status: 400, headers: corsHeaders })
    }

    const { data: existingTools } = await adminClient.from('tools').select('id, titulo').is('deleted_at', null)
    const existingTitles = new Set((existingTools || []).map((t: any) => t.titulo.toLowerCase().trim()))

    const { data: existingCompanies } = await adminClient.from('companies').select('id, name')
    const companyByName: Record<string, string> = {}
    for (const c of (existingCompanies || [])) {
      companyByName[c.name.toLowerCase().trim()] = c.id
    }

    const statusMap: Record<string, string> = {
      'ATIVAR': 'active', 'RASCUNHO': 'draft', 'DESATIVAR': 'archived',
      'ativar': 'active', 'rascunho': 'draft', 'desativar': 'archived',
    }

    const catToType: Record<string, string> = {
      'GPT': 'gpt', 'AUTOMAÇÃO': 'automacao', 'AUTOMACAO': 'automacao',
      'SISTEMA': 'site', 'DOCUMENTO': 'documento', 'ARTE': 'artes', 'ARTES': 'artes',
      'ASSISTENTES': 'assistentes', 'ASSISTENTE': 'assistentes',
      'Automação': 'automacao', 'Sistema': 'site', 'Documento': 'documento', 'Arte': 'artes',
      'Assistentes': 'assistentes',
    }

    let criadas = 0, duplicadas = 0, ignoradas = 0
    const avisos: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      
      const empresaNome = (row.EMPRESA || row.empresa || '').toString().trim()
      const categoriaRaw = (row.CATEGORIA || row.categoria || '').toString().trim()
      const titulo = (row.NOME || row.titulo || row.Titulo || row.TITULO || '').toString().trim()

      if (!titulo) {
        ignoradas++
        avisos.push(`Linha ${i + 2}: título vazio, ignorada`)
        continue
      }

      let empresaId: string | null = null
      if (empresaNome) {
        const key = empresaNome.toLowerCase().trim()
        if (companyByName[key]) {
          empresaId = companyByName[key]
        } else {
          const slug = empresaNome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
          const { data: newCompany } = await adminClient
            .from('companies')
            .insert({ name: empresaNome, slug })
            .select('id')
            .single()
          if (newCompany) {
            empresaId = newCompany.id
            companyByName[key] = newCompany.id
          }
        }
      }

      const categoria = categoriaRaw || null
      const toolType = catToType[categoriaRaw] || catToType[categoriaRaw.toUpperCase()] || 'gpt'

      const setores = (row['SETOR / DEPARTAMENTO'] || row.setores || row.Setores || '').toString().trim()
      const descricao = (row.DESCRIÇÃO || row.descricao || row.Descricao || '').toString().trim()
      const funcao = (row.FUNÇÃO || row.funcao || '').toString().trim()
      const link = (row['LINK DA FERRAMENTA'] || row['LINK DE ACESSO'] || row['LINK DO BLUEPRINT'] || row.link || row.Link || '').toString().trim()
      const email = (row.EMAIL || row.email || '').toString().trim()
      const senha = (row.SENHA || row.senha || '').toString().trim()
      const prompt = (row.PROMPT || row['PROMPT 1'] || '').toString().trim()
      const instrucoes = (row.INSTRUÇÕES || row.instrucoes || '').toString().trim()
      const modelo = (row['MODELO RECOMENDADO'] || '').toString().trim()
      const acoesRaw = (row.AÇÕES || row.ACOES || row.acoes || '').toString().trim()
      const status = statusMap[acoesRaw] || 'draft'
      const dataUltimaAtualizacao = (row.DATA_ULTIMA_ATUALIZACAO || '').toString().trim()

      let linkAcesso: string | null = null
      if (link) {
        try { new URL(link); linkAcesso = link } catch { /* skip invalid */ }
      }

      const isDuplicate = existingTitles.has(titulo.toLowerCase())
      const finalTitulo = isDuplicate ? `COPIA - ${titulo}` : titulo

      const toolData: any = {
        titulo: finalTitulo,
        descricao: descricao || null,
        setores: setores || null,
        categoria,
        tool_type: toolType,
        empresa_id: empresaId,
        link_acesso_original: linkAcesso,
        funcao: funcao || null,
        instrucoes: instrucoes || null,
        modelo_recomendado: modelo || null,
        status,
        criado_por: user.id,
        atualizado_por: user.id,
      }

      // If DATA_ULTIMA_ATUALIZACAO is provided, try to use it
      if (dataUltimaAtualizacao) {
        // Try parsing DD/MM/YYYY
        const parts = dataUltimaAtualizacao.split('/')
        if (parts.length === 3) {
          const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00Z`)
          if (!isNaN(d.getTime())) {
            toolData.atualizado_em = d.toISOString()
          }
        }
      }

      const { data: insertedTool } = await adminClient.from('tools').insert(toolData).select('id').single()

      if (insertedTool && (email || senha || prompt)) {
        await adminClient.from('tool_credentials').insert({
          tool_id: insertedTool.id,
          credential_email: email || null,
          credential_senha: senha || null,
          prompt_final: prompt || null,
        })
      }

      if (isDuplicate) {
        duplicadas++
        avisos.push(`Linha ${i + 2}: duplicata, criada como "COPIA - ${titulo}"`)
      } else {
        criadas++
      }

      existingTitles.add(finalTitulo.toLowerCase())
    }

    return new Response(JSON.stringify({ criadas, duplicadas, ignoradas, avisos }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    console.error('Import error:', err);
    return new Response(JSON.stringify({ error: 'Erro interno ao importar' }), { status: 500, headers: corsHeaders })
  }
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.98.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate auth - must be an editor
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    })
    const { data: { user }, error: authError } = await anonClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Check editor role
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const { data: roleData } = await adminClient.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'editor').maybeSingle()
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Acesso restrito a editores' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Fetch all data from all tables using service role (bypasses RLS)
    const tables = [
      'tools', 'tool_credentials', 'tool_blocks', 'tool_links', 'tool_access_logs',
      'tool_versions', 'tool_favorites', 'knowledge_files', 'categories', 'companies',
      'departments', 'social_cards', 'processes', 'process_attachments', 'notes',
      'user_roles', 'admin_action_logs', 'site_settings', 'wechat_shares', 'user_passwords'
    ]

    const allData: Record<string, any[]> = {}
    
    // Fetch all tables in parallel
    const results = await Promise.all(
      tables.map(async (table) => {
        const allRows: any[] = []
        let from = 0
        const pageSize = 1000
        while (true) {
          const { data, error } = await adminClient.from(table).select('*').range(from, from + pageSize - 1)
          if (error) { console.error(`Error fetching ${table}:`, error.message); break }
          if (!data || data.length === 0) break
          allRows.push(...data)
          if (data.length < pageSize) break
          from += pageSize
        }
        return { table, rows: allRows }
      })
    )

    for (const r of results) {
      allData[r.table] = r.rows
    }

    // Build markdown
    const now = new Date().toISOString()
    const lines: string[] = []

    lines.push(`# Sistema Wemerson — Exportação Completa`)
    lines.push(``)
    lines.push(`> Gerado em: ${now}`)
    lines.push(`> Exportado por: ${user.email}`)
    lines.push(``)
    lines.push(`---`)
    lines.push(``)

    // 1. Architecture
    lines.push(`## 1. Arquitetura Geral`)
    lines.push(``)
    lines.push(`- **Frontend:** React 18 + Vite 5 + TypeScript 5 + Tailwind CSS v3 + shadcn/ui`)
    lines.push(`- **Backend:** Lovable Cloud (Supabase) — PostgreSQL, Auth, Storage, Edge Functions (Deno)`)
    lines.push(`- **Mobile:** Capacitor 8 (Android + iOS) com builds via GitHub Actions`)
    lines.push(`- **Roteamento:** HashRouter (SPA) com 4 rotas principais`)
    lines.push(`- **Estado:** React Query para cache/sync + Context API para autenticação`)
    lines.push(`- **Busca:** Deep Search local + Smart Search com IA (Gemini) como fallback`)
    lines.push(`- **Auditoria:** Logs no banco + notificações WhatsApp via Z-API`)
    lines.push(`- **Arquivos suportados:** PDF, TXT, DOCX, XLSX, CSV, JSON, Markdown`)
    lines.push(``)
    lines.push(`---`)
    lines.push(``)

    // 2. Database tables with full data
    lines.push(`## 2. Banco de Dados`)
    lines.push(``)

    const tableDescriptions: Record<string, string> = {
      tools: 'Ferramentas cadastradas no sistema',
      tool_credentials: 'Credenciais sensíveis (isoladas por RLS)',
      tool_blocks: 'Blocos de conteúdo personalizáveis',
      tool_links: 'Vínculos entre ferramentas (many-to-many)',
      tool_access_logs: 'Logs de acesso e auditoria',
      tool_versions: 'Histórico de versões (snapshots)',
      tool_favorites: 'Favoritos por usuário',
      knowledge_files: 'Arquivos da base de conhecimento',
      categories: 'Categorias dinâmicas com ícones',
      companies: 'Empresas com logo, wallpaper e senha',
      departments: 'Departamentos/setores',
      social_cards: 'Cards sociais e configuração de wallpaper',
      processes: 'Processos organizacionais',
      process_attachments: 'Anexos de processos',
      notes: 'Notas pessoais por usuário',
      user_roles: 'Papéis de usuário (editor/readonly)',
      admin_action_logs: 'Logs de ações administrativas',
      site_settings: 'Configurações globais do site',
      wechat_shares: 'Compartilhamentos temporários WeChat',
      user_passwords: 'Senhas de acesso a ferramentas por usuário',
    }

    let tableIndex = 1
    for (const table of tables) {
      const rows = allData[table] || []
      const desc = tableDescriptions[table] || ''
      lines.push(`### 2.${tableIndex} Tabela: ${table}`)
      lines.push(``)
      lines.push(`> ${desc}`)
      lines.push(`> Total de registros: ${rows.length}`)
      lines.push(``)

      if (rows.length === 0) {
        lines.push(`_Nenhum registro encontrado._`)
        lines.push(``)
      } else {
        // Output each record as a JSON code block for RAG-friendly chunking
        for (let i = 0; i < rows.length; i++) {
          lines.push(`#### Registro ${i + 1}`)
          lines.push(``)
          lines.push('```json')
          lines.push(JSON.stringify(rows[i], null, 2))
          lines.push('```')
          lines.push(``)
        }
      }

      lines.push(`---`)
      lines.push(``)
      tableIndex++
    }

    // 3. Storage Buckets
    lines.push(`## 3. Storage Buckets`)
    lines.push(``)
    const buckets = [
      { name: 'tool-images', public: true, desc: 'Imagens de ferramentas, wallpapers e social cards' },
      { name: 'knowledge-files', public: false, desc: 'Arquivos da base de conhecimento (PDF, DOCX, MD, etc.)' },
      { name: 'company-logos', public: true, desc: 'Logos de empresas' },
      { name: 'category-icons', public: true, desc: 'Ícones de categorias' },
      { name: 'social-card-icons', public: true, desc: 'Ícones de cards sociais' },
      { name: 'site-assets', public: true, desc: 'Assets gerais do site' },
      { name: 'process-files', public: true, desc: 'Arquivos de processos' },
    ]
    for (const b of buckets) {
      lines.push(`- **${b.name}** — ${b.desc} (${b.public ? 'Público' : 'Privado'})`)
    }
    lines.push(``)
    lines.push(`---`)
    lines.push(``)

    // 4. Edge Functions
    lines.push(`## 4. Edge Functions (Backend Functions)`)
    lines.push(``)
    const edgeFunctions = [
      { name: 'export-tools', desc: 'Exporta ferramentas em formato estruturado' },
      { name: 'import-tools', desc: 'Importa ferramentas de arquivo externo' },
      { name: 'manage-users', desc: 'Gerencia criação/edição/exclusão de usuários' },
      { name: 'seed-users', desc: 'Seed inicial de usuários (bootstrap)' },
      { name: 'send-whatsapp-audit', desc: 'Envia notificações de auditoria via WhatsApp (Z-API)' },
      { name: 'smart-search', desc: 'Busca inteligente com IA (Gemini)' },
      { name: 'site-chat', desc: 'Chat da IA no site com contexto das ferramentas' },
      { name: 'export-system-markdown', desc: 'Exporta sistema completo em Markdown' },
    ]
    for (const f of edgeFunctions) {
      lines.push(`- **${f.name}** — ${f.desc}`)
    }
    lines.push(``)
    lines.push(`---`)
    lines.push(``)

    // 5. Integrations
    lines.push(`## 5. Integrações Externas`)
    lines.push(``)
    lines.push(`- **Lovable Cloud (Supabase)** — Backend, banco de dados, autenticação, storage e Edge Functions`)
    lines.push(`- **Z-API (WhatsApp)** — Notificações de auditoria em tempo real via WhatsApp`)
    lines.push(`- **Lovable AI (Gemini)** — Busca inteligente semântica por linguagem natural`)
    lines.push(`- **Capacitor** — Build nativo para Android e iOS`)
    lines.push(``)
    lines.push(`---`)
    lines.push(``)

    // 6. Dependencies
    lines.push(`## 6. Dependências e Bibliotecas`)
    lines.push(``)
    const deps = [
      { name: 'react', version: '^18.3.1', desc: 'Biblioteca UI principal' },
      { name: 'react-router-dom', version: '^6.30.1', desc: 'Roteamento SPA' },
      { name: '@supabase/supabase-js', version: '^2.98.0', desc: 'SDK do backend' },
      { name: '@tanstack/react-query', version: '^5.83.0', desc: 'Cache e sincronização de dados' },
      { name: 'tailwindcss-animate', version: '^1.0.7', desc: 'Animações CSS' },
      { name: 'recharts', version: '^2.15.4', desc: 'Gráficos e visualização de dados' },
      { name: 'zod', version: '^3.25.76', desc: 'Validação de schemas' },
      { name: 'xlsx', version: '^0.18.5', desc: 'Manipulação de planilhas Excel' },
      { name: 'lucide-react', version: '^0.462.0', desc: 'Ícones SVG' },
      { name: '@tiptap/react', version: '^3.22.2', desc: 'Editor rich-text' },
      { name: '@capacitor/core', version: '^8.3.0', desc: 'Runtime nativo mobile' },
      { name: 'sonner', version: '^1.7.4', desc: 'Notificações toast' },
      { name: 'date-fns', version: '^3.6.0', desc: 'Manipulação de datas' },
    ]
    for (const d of deps) {
      lines.push(`- **${d.name}** (${d.version}) — ${d.desc}`)
    }
    lines.push(``)
    lines.push(`---`)
    lines.push(``)

    // 7. Components
    lines.push(`## 7. Componentes UI`)
    lines.push(``)
    const components = [
      'BulkActions — Ações em lote para ferramentas selecionadas',
      'CategoryCards — Cards de categorias com ícones',
      'CompanyFilter — Filtro por empresa',
      'CompanyManager — Gerenciamento de empresas',
      'CompanyPasswordDialog — Diálogo de senha da empresa',
      'ConfigDrawer — Drawer de estrutura/configuração da ferramenta',
      'CopyButton — Botão de cópia com feedback',
      'DepartmentManager — Gerenciamento de departamentos/setores',
      'FloatingActionButton — Botão flutuante de ação rápida',
      'FloatingLeftButton — Botão flutuante lateral esquerdo',
      'GptLinkInput — Input de links GPT com suporte multi-valor',
      'ImportPreviewDialog — Preview de importação de ferramentas',
      'LoginDialog — Diálogo de login simplificado',
      'NavLink — Link de navegação',
      'NotesPopup — Popup de notas pessoais',
      'ProcessesPopup — Popup de processos organizacionais',
      'SiteChatPopup — Popup de chat da IA no site',
      'SocialCardDrawer — Editor de cards sociais',
      'SocialCards — Exibição de cards sociais',
      'StatsCards — Cards de estatísticas do dashboard',
      'ToolCard — Card individual de ferramenta',
      'ToolRecommendationPopup — Popup de recomendação de ferramentas',
      'Toolbar — Barra de busca e filtros',
      'UserManagerPopup — Popup de gerenciamento de usuários',
      'WeChatPopup — Popup de compartilhamento WeChat',
      'WhatsAppConfigDialog — Configuração da integração WhatsApp',
    ]
    for (const c of components) {
      lines.push(`- ${c}`)
    }
    lines.push(``)
    lines.push(`---`)
    lines.push(``)

    // 8. Routes
    lines.push(`## 8. Rotas e Páginas`)
    lines.push(``)
    lines.push(`| Rota | Componente | Descrição |`)
    lines.push(`|------|-----------|-----------|`)
    lines.push(`| \`/\` | Biblioteca | Página principal com catálogo de ferramentas |`)
    lines.push(`| \`/postar\` | PostarFerramenta | Formulário de criação de ferramenta |`)
    lines.push(`| \`/empresa/:slug\` | EmpresaPage | Página de ferramentas por empresa |`)
    lines.push(`| \`/sistema\` | SystemAnalysis | Análise completa do sistema |`)
    lines.push(`| \`/login\` | Login | Página de autenticação |`)
    lines.push(`| \`/404\` | NotFound | Página de erro 404 |`)
    lines.push(``)
    lines.push(`---`)
    lines.push(``)

    // 9. Security Model
    lines.push(`## 9. Modelo de Segurança`)
    lines.push(``)
    lines.push(`- **RLS ativo** em todas as tabelas com políticas baseadas em \`has_role()\``)
    lines.push(`- **Credenciais isoladas** na tabela \`tool_credentials\` — acesso exclusivo para editores`)
    lines.push(`- **Papéis separados** na tabela \`user_roles\` (editor / readonly)`)
    lines.push(`- **View protegida** \`companies_public\` oculta senhas de empresas`)
    lines.push(`- **Função segura** \`get_tool_prompt()\` com SECURITY DEFINER`)
    lines.push(`- **Auditoria em tempo real** via WhatsApp para ações críticas`)
    lines.push(``)
    lines.push(`---`)
    lines.push(``)

    // 10. Database Functions
    lines.push(`## 10. Funções do Banco de Dados`)
    lines.push(``)
    lines.push(`### has_role(user_id, role)`)
    lines.push(`Verifica se o usuário possui um determinado papel. SECURITY DEFINER.`)
    lines.push(``)
    lines.push(`### get_tool_prompt(tool_id)`)
    lines.push(`Retorna o prompt final de uma ferramenta. SECURITY DEFINER.`)
    lines.push(``)
    lines.push(`### update_updated_at_column()`)
    lines.push(`Trigger que atualiza automaticamente o campo \`atualizado_em\`.`)
    lines.push(``)
    lines.push(`---`)
    lines.push(``)
    lines.push(`_Fim da exportação._`)

    const markdown = lines.join('\n')

    return new Response(markdown, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="sistema-wemerson-export-${now.slice(0, 10)}.md"`,
      },
    })
  } catch (err) {
    console.error('Export error:', err)
    return new Response(JSON.stringify({ error: 'Erro interno ao exportar' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

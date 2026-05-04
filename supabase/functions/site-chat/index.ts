import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch ALL site data in parallel
    const [
      toolsRes, categoriesRes, companiesRes, depsRes, settingsRes,
      blocksRes, knowledgeRes, processesRes, processAttRes,
      socialCardsRes, toolLinksRes, credentialsRes,
    ] = await Promise.all([
      supabase.from("tools").select("id, titulo, descricao, funcao, categoria, setores, tags, status, modelo_recomendado, link_gpt_pronto, instrucoes, tool_type, origem, origem_detalhe, link_acesso_original, quebra_gelos, recursos, acoes, links_producao, criado_em, atualizado_em").is("deleted_at", null).limit(500),
      supabase.from("categories").select("name, ordem, icon_url").order("ordem"),
      supabase.from("companies_public").select("name, slug, logo_url, wallpaper_url"),
      supabase.from("departments").select("name"),
      supabase.from("site_settings").select("key, value").not("key", "like", "zapi_%"),
      supabase.from("tool_blocks").select("tool_id, block_type, titulo, descricao, conteudo, aba, ordem, visibility_visitor, visibility_reader, visibility_editor").order("ordem"),
      supabase.from("knowledge_files").select("tool_id, file_name, description"),
      supabase.from("processes").select("id, name, description, setor, created_at"),
      supabase.from("process_attachments").select("process_id, file_name, file_url"),
      supabase.from("social_cards").select("titulo, descricao, url, icon, button_label, ativo, ordem").eq("ativo", true).order("ordem"),
      supabase.from("tool_links").select("source_tool_id, target_tool_id, link_type"),
      supabase.from("tool_credentials").select("tool_id, prompt_final"),
    ]);

    const tools = toolsRes.data || [];
    const categories = categoriesRes.data || [];
    const companies = companiesRes.data || [];
    const departments = depsRes.data || [];
    const settings = settingsRes.data || [];
    const blocks = blocksRes.data || [];
    const knowledgeFiles = knowledgeRes.data || [];
    const processes = processesRes.data || [];
    const processAttachments = processAttRes.data || [];
    const socialCards = socialCardsRes.data || [];
    const toolLinks = toolLinksRes.data || [];
    const credentials = credentialsRes.data || [];

    // Build indexes
    const toolIdMap = new Map(tools.map(t => [t.id, t.titulo]));
    const blocksByTool = new Map<string, typeof blocks>();
    for (const b of blocks) { if (!blocksByTool.has(b.tool_id)) blocksByTool.set(b.tool_id, []); blocksByTool.get(b.tool_id)!.push(b); }
    const kfByTool = new Map<string, typeof knowledgeFiles>();
    for (const kf of knowledgeFiles) { if (!kfByTool.has(kf.tool_id)) kfByTool.set(kf.tool_id, []); kfByTool.get(kf.tool_id)!.push(kf); }
    const credByTool = new Map<string, string>();
    for (const c of credentials) { if (c.prompt_final) credByTool.set(c.tool_id, c.prompt_final); }
    const linksByTool = new Map<string, string[]>();
    for (const l of toolLinks) { if (!linksByTool.has(l.source_tool_id)) linksByTool.set(l.source_tool_id, []); linksByTool.get(l.source_tool_id)!.push(`${toolIdMap.get(l.target_tool_id) || l.target_tool_id} (${l.link_type})`); }
    const attByProcess = new Map<string, string[]>();
    for (const a of processAttachments) { if (!attByProcess.has(a.process_id)) attByProcess.set(a.process_id, []); attByProcess.get(a.process_id)!.push(a.file_name); }

    // Build comprehensive tool entries
    const toolsSummary = tools.map(t => {
      let e = `### ${t.titulo}`;
      if (t.categoria) e += ` [${t.categoria}]`;
      if (t.status && t.status !== 'active') e += ` (${t.status})`;
      e += '\n';
      if (t.funcao) e += `**Função**: ${t.funcao}\n`;
      if (t.descricao) e += `**Descrição**: ${t.descricao}\n`;
      if (t.instrucoes) e += `**Instruções de uso**: ${t.instrucoes.slice(0, 600)}\n`;
      if (t.setores) e += `**Setores**: ${t.setores}\n`;
      if (t.tags?.length) e += `**Tags**: ${t.tags.join(', ')}\n`;
      if (t.modelo_recomendado) e += `**Modelo recomendado**: ${t.modelo_recomendado}\n`;
      if (t.tool_type) e += `**Tipo**: ${t.tool_type}\n`;
      if (t.link_gpt_pronto) e += `**Link GPT**: ${t.link_gpt_pronto}\n`;
      if (t.link_acesso_original) e += `**Link de acesso**: ${t.link_acesso_original}\n`;
      if (t.quebra_gelos?.length) e += `**Exemplos de uso (quebra-gelos)**: ${t.quebra_gelos.join(' | ')}\n`;
      if (t.origem) e += `**Origem**: ${t.origem}${t.origem_detalhe ? ` — ${t.origem_detalhe}` : ''}\n`;
      if (t.recursos && typeof t.recursos === 'object') {
        const active = Object.entries(t.recursos as Record<string, boolean>).filter(([, v]) => v).map(([k]) => k);
        if (active.length) e += `**Recursos ativos**: ${active.join(', ')}\n`;
      }
      const prompt = credByTool.get(t.id);
      if (prompt) e += `**Prompt do sistema**: ${prompt.slice(0, 1000)}\n`;
      const tBlocks = blocksByTool.get(t.id);
      if (tBlocks?.length) {
        e += `**Conteúdo interno (${tBlocks.length} blocos)**:\n`;
        for (const b of tBlocks) { e += `  - [${b.block_type}] ${b.titulo}${b.conteudo ? `: ${b.conteudo.slice(0, 400)}` : ''}\n`; }
      }
      const tFiles = kfByTool.get(t.id);
      if (tFiles?.length) e += `**Arquivos de conhecimento**: ${tFiles.map(f => f.file_name + (f.description ? ` (${f.description})` : '')).join(', ')}\n`;
      const tLinks = linksByTool.get(t.id);
      if (tLinks?.length) e += `**Ferramentas vinculadas**: ${tLinks.join(', ')}\n`;
      return e;
    }).join('\n---\n');

    const processesSummary = processes.length > 0
      ? processes.map(p => {
          let e = `• **${p.name}**${p.setor ? ` [${p.setor}]` : ''}: ${p.description || 'Sem descrição'}`;
          const atts = attByProcess.get(p.id);
          if (atts?.length) e += ` | Anexos: ${atts.join(', ')}`;
          return e;
        }).join('\n')
      : 'Nenhum processo cadastrado.';

    const socialSummary = socialCards.filter(c => c.icon !== 'fab' && c.icon !== 'fab_left').map(c => `• ${c.titulo}${c.descricao ? `: ${c.descricao}` : ''}${c.url ? ` → ${c.url}` : ''}`).join('\n') || 'Nenhum card social.';
    const settingsSummary = settings.map(s => `• ${s.key}: ${s.value || '(vazio)'}`).join('\n') || 'Nenhuma configuração.';

    const systemPrompt = `Você é o **Assistente Inteligente da Wemerson Tools** — uma biblioteca digital completa de ferramentas de IA, automações, sistemas e recursos tecnológicos.

## 🧠 Sua Identidade e Personalidade
- **Nome**: Assistente Wemerson Tools
- **Tom**: Consultivo, técnico mas acessível, sempre prestativo e objetivo
- **Estilo**: Respostas diretas e práticas. Use markdown, bullet points, tabelas quando útil. Seja conciso mas completo.
- **Posicionamento**: Você é um ESPECIALISTA SÊNIOR em produtividade, ferramentas de IA e automações que conhece CADA detalhe do acervo — desde o prompt interno até os arquivos anexados
- **Linguagem**: Português brasileiro, profissional mas amigável
- **Comportamento**: Proativo — antecipe necessidades, sugira combinações, ofereça insights sobre uso e otimização

## 📋 Suas Capacidades Especializadas

### 1. Explicar Ferramentas com Profundidade
Para CADA ferramenta, você conhece e pode explicar:
- **O que faz** (função e descrição completa)
- **Como usar** (instruções detalhadas, exemplos de uso/quebra-gelos)
- **Quando usar** (cenários ideais baseados no setor, categoria e tipo)
- **Configuração técnica** (modelo recomendado, recursos ativos, prompt do sistema)
- **Conteúdo interno** (blocos de conteúdo, credenciais relevantes — NUNCA exponha senhas ou chaves)
- **Material de apoio** (arquivos de conhecimento anexados)
- **Relações** (ferramentas vinculadas e dependências)

### 2. Recomendar Ferramentas por Processo/Necessidade
Quando o usuário descrever um problema, necessidade ou processo:
1. Analise o contexto e identifique as categorias/setores relevantes
2. Selecione as ferramentas mais adequadas do acervo
3. Explique POR QUE cada ferramenta é relevante
4. Sugira a ORDEM de uso e COMBINAÇÕES inteligentes
5. Indique fluxos de trabalho completos quando aplicável

### 3. Navegar pela Plataforma
Oriente os usuários sobre:
- Como encontrar ferramentas (busca, filtros por categoria/setor/status)
- Como acessar funcionalidades (login, ChatDocs, exportação, cards sociais)
- Como utilizar a gaveta de detalhes (aba Configurar e aba Estrutura)
- Onde encontrar processos documentados

### 4. Segurança e Integridade
- **NUNCA** exponha senhas, chaves de API, tokens ou credenciais sensíveis
- Se perguntado sobre credenciais, explique que são protegidas e acessíveis apenas para editores
- Oriente sobre permissões: Editores (acesso total) vs Visualizadores (apenas leitura e cópia)
- Não permita ações destrutivas ou que comprometam a integridade dos dados

## 📚 CONHECIMENTO COMPLETO DO SISTEMA

### Categorias (${categories.length}):
${categories.map(c => c.name).join(", ")}

### Departamentos/Setores (${departments.length}):
${departments.map(d => d.name).join(", ")}

### Empresas (${companies.length}):
${companies.map(c => c.name + (c.slug ? " (acessível em /empresa/" + c.slug + ")" : "")).join(", ")}

### Configurações:
${settingsSummary}

### Links e Cards Sociais:
${socialSummary}

### Estrutura do Site
**Páginas principais:**
- **/biblioteca** — Página principal com busca profunda, filtros, cards de ferramentas, estatísticas e ações em massa
- **/postar** — Criação de rascunhos via link, drag-and-drop ou upload TXT
- **/sistema** — Análise técnica e exportação completa do sistema
- **/login** — Login simplificado por nome de usuário
- **/empresa/:slug** — Visualização filtrada por empresa com wallpaper personalizado

**Funcionalidades integradas:**
- **Busca profunda (Deep Search)**: Pesquisa em títulos, funções, descrições, instruções, setores, categorias, tags, blocos internos, arquivos e prompt final
- **Busca IA**: Fallback com Gemini para consultas em linguagem natural (>3 palavras)
- **ChatDocs**: Compartilhamento de textos e arquivos entre dispositivos com expiração em 7 dias
- **FAB Direito**: Botão flutuante configurável (WhatsApp, link personalizado)
- **FAB Esquerdo (este chat)**: Assistente IA com acesso total ao acervo
- **Gaveta de detalhes**: Aba "Configurar" (dados, credenciais, links) e aba "Estrutura" (blocos editáveis com visibilidade por perfil)
- **Modo seleção**: Ações em massa — alterar categoria, setor ou excluir múltiplas ferramentas
- **Auditoria**: Rastreamento em tempo real de acessos, visualizações e edições via WhatsApp
- **Botão Estrutura**: Indicador visual verde quando há conteúdo técnico preenchido; para categoria DataBase's, funciona como "COPIAR SQL"
- **Visitantes não logados**: São redirecionados ao WhatsApp ao clicar em ações protegidas

### Processos Documentados (${processes.length}):
${processesSummary}

---

## 🔧 ACERVO COMPLETO — ${tools.length} FERRAMENTAS

${toolsSummary}

---

## ⚡ Diretrizes de Resposta
1. **Precisão absoluta**: Forneça TODOS os detalhes disponíveis sobre cada ferramenta — função, instruções, recursos, prompt, blocos, arquivos, vinculações
2. **Recomendação inteligente**: Ao sugerir ferramentas, explique o PORQUÊ e a ORDEM de uso ideal
3. **Combinações de ferramentas**: Sempre que possível, sugira FLUXOS COMPLETOS com múltiplas ferramentas integradas
4. **Contextualização**: Use exemplos de uso (quebra-gelos) para ilustrar aplicações práticas
5. **Honestidade**: NUNCA invente ferramentas ou funcionalidades inexistentes
6. **Navegação assistida**: Oriente o usuário sobre onde encontrar cada funcionalidade no site
7. **Segurança**: NUNCA exponha credenciais, senhas ou tokens — mencione apenas que existem e são protegidos
8. **Proatividade**: Antecipe necessidades — se o usuário pergunta sobre um tema, sugira ferramentas e processos relacionados
9. Responda SEMPRE em português brasileiro`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao processar sua mensagem" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("site-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

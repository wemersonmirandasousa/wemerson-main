const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { evento, descricao, usuario, conteudo, detalhes } = await req.json();

    const clientToken = Deno.env.get("ZAPI_CLIENT_TOKEN");
    if (!clientToken) throw new Error("ZAPI_CLIENT_TOKEN not configured");

    const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

    let mensagem: string;
    if (conteudo) {
      mensagem = [
        `📝 *Nota Enviada*`,
        ``,
        `👤 *Usuário:* ${usuario || 'Visitante'}`,
        `🕐 *Data/Hora:* ${now}`,
        ``,
        `━━━━━━━━━━━━━━━━━━`,
        conteudo,
        `━━━━━━━━━━━━━━━━━━`,
      ].join('\n');
    } else {
      const iconMap: Record<string, string> = {
        'visualizacao': '👁️',
        'clique': '👆',
        'copia': '📋',
        'acesso': '🔗',
        'acesso_site': '🌐',
        'acesso_card': '📱',
        'acesso_ferramenta': '🔧',
        'download': '⬇️',
        'upload': '⬆️',
        'login': '🔑',
        'logout': '🚪',
        'criacao': '✨',
        'edicao': '✏️',
        'exclusao': '🗑️',
        'nota_atualizada': '📝',
        'nota_criada': '📝',
        'nota_excluida': '🗑️',
        'chatdocs_texto': '💬',
        'chatdocs_arquivo': '📎',
        'processo_visualizado': '📋',
        'busca': '🔍',
        'erro': '⚠️',
      };
      const icon = iconMap[evento] || '📋';

      const lines = [
        `${icon} *Registro de Atividade*`,
        ``,
        `📌 *Evento:* ${evento}`,
        `📄 *Descrição:* ${descricao}`,
        `👤 *Usuário:* ${usuario || 'Visitante'}`,
        `🕐 *Data/Hora:* ${now}`,
      ];

      if (detalhes) {
        lines.push(``, `ℹ️ *Detalhes:* ${detalhes}`);
      }

      mensagem = lines.join('\n');
    }

    const response = await fetch(
      "https://api.z-api.io/instances/3F140B2A1ED1F2FBE53BEE7630C0C065/token/EE62D79B710E1DB8B5421EA4/send-text",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Client-Token": clientToken,
        },
        body: JSON.stringify({
          phone: "553898215816",
          message: mensagem,
        }),
      }
    );

    const result = await response.json();
    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

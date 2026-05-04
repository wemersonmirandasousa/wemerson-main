import { supabase } from '@/integrations/supabase/client';

export async function sendAudit(
  evento: string,
  descricao: string,
  usuario?: string,
  detalhes?: string
) {
  try {
    await supabase.functions.invoke('send-whatsapp-audit', {
      body: { evento, descricao, usuario: usuario || 'Visitante', detalhes },
    });
  } catch {
    // silently fail
  }
}

// Debounced site visit audit - only send once per session
let siteVisitSent = false;

export function sendSiteVisitAudit() {
  if (siteVisitSent) return;
  siteVisitSent = true;

  const userAgent = navigator.userAgent;
  const isMobile = /Mobile|Android|iPhone/i.test(userAgent);
  const platform = isMobile ? 'Mobile' : 'Desktop';
  const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  sendAudit(
    'acesso_site',
    `Novo acesso ao site`,
    'Visitante',
    `Plataforma: ${platform} | User-Agent: ${userAgent.slice(0, 100)}`
  );
}

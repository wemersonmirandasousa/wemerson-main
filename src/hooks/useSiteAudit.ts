import { useState, useCallback } from 'react';
import { AuditIssue, AuditSummary, AuditCategory, AuditPriority, AuditStatus } from '@/types/audit';
import { useToast } from './use-toast';

export const useSiteAudit = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<AuditIssue[]>([]);
  const [summary, setSummary] = useState<AuditSummary>({
    total: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  const { toast } = useToast();

  const runAudit = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log('[useSiteAudit:runAudit] Starting audit...');

    try {
      const detectedIssues: AuditIssue[] = [];

      // 1. Check SEO Title
      if (!document.title || document.title === 'Vite + React + TS') {
        detectedIssues.push({
          id: crypto.randomUUID(),
          title: 'Título SEO Ausente ou Padrão',
          category: 'seo',
          priority: 'high',
          status: 'open',
          description: 'A página atual não possui um título SEO descritivo ou está usando o padrão do Vite.',
          impact: 'Afeta drasticamente o ranqueamento nos motores de busca e a indexação.',
          recommendation: 'Defina um título único e relevante para cada rota principal.',
          detectedAt: new Date().toISOString(),
        });
      }

      // 2. Check Images without Alt
      const images = Array.from(document.querySelectorAll('img'));
      const imagesWithoutAlt = images.filter(img => !img.alt || img.alt.trim() === '');
      if (imagesWithoutAlt.length > 0) {
        detectedIssues.push({
          id: crypto.randomUUID(),
          title: `${imagesWithoutAlt.length} Imagens sem Texto Alternativo (alt)`,
          category: 'accessibility',
          priority: 'medium',
          status: 'open',
          description: 'Imagens sem atributo "alt" prejudicam usuários de leitores de tela e o SEO de imagens.',
          impact: 'Reduz a acessibilidade do site e perde oportunidades de SEO.',
          recommendation: 'Adicione descrições significativas no atributo alt de todas as imagens informativas.',
          detectedAt: new Date().toISOString(),
        });
      }

      // 3. Check Buttons without Aria-Label (Icon-only buttons)
      const buttons = Array.from(document.querySelectorAll('button'));
      const iconButtonsWithoutLabel = buttons.filter(btn => {
        const hasText = btn.innerText.trim().length > 0;
        const hasLabel = btn.getAttribute('aria-label');
        const hasIcon = btn.querySelector('svg, i');
        return hasIcon && !hasText && !hasLabel;
      });
      if (iconButtonsWithoutLabel.length > 0) {
        detectedIssues.push({
          id: crypto.randomUUID(),
          title: `${iconButtonsWithoutLabel.length} Botões de Ícone sem Label`,
          category: 'accessibility',
          priority: 'high',
          status: 'open',
          description: 'Botões que contêm apenas ícones precisam de um aria-label para serem acessíveis.',
          impact: 'Usuários com deficiência visual não conseguem identificar a função do botão.',
          recommendation: 'Adicione um atributo aria-label descrevendo a ação do botão.',
          detectedAt: new Date().toISOString(),
        });
      }

      // 4. Check Empty Links or Href="#"
      const links = Array.from(document.querySelectorAll('a'));
      const problematicLinks = links.filter(link => {
        const href = link.getAttribute('href');
        return !href || href === '#' || href === '';
      });
      if (problematicLinks.length > 0) {
        detectedIssues.push({
          id: crypto.randomUUID(),
          title: `${problematicLinks.length} Links Vazios ou com Href="#"`,
          category: 'ux',
          priority: 'medium',
          status: 'open',
          description: 'Links que não levam a lugar nenhum ou usam "#" como placeholder prejudicam a navegação.',
          impact: 'Causa confusão no usuário e pode quebrar o comportamento esperado da página.',
          recommendation: 'Substitua links de placeholder por botões ou URLs reais.',
          detectedAt: new Date().toISOString(),
        });
      }

      // 5. Check Forms without Validation
      const forms = Array.from(document.querySelectorAll('form'));
      const formsWithoutValidation = forms.filter(form => {
        const inputs = Array.from(form.querySelectorAll('input, select, textarea'));
        return !inputs.some(input => input.hasAttribute('required') || input.hasAttribute('pattern') || input.hasAttribute('minlength'));
      });
      if (formsWithoutValidation.length > 0) {
        detectedIssues.push({
          id: crypto.randomUUID(),
          title: 'Formulários sem Validação Básica',
          category: 'ux',
          priority: 'medium',
          status: 'open',
          description: 'Alguns formulários parecem não ter atributos de validação nativos (required, pattern, etc).',
          impact: 'Pode resultar em envio de dados inválidos e má experiência do usuário.',
          recommendation: 'Implemente validações visuais e atributos de obrigatoriedade nos campos críticos.',
          detectedAt: new Date().toISOString(),
        });
      }

      // 6. Manual Review: Admin Route Protection
      detectedIssues.push({
        id: crypto.randomUUID(),
        title: 'Verificação de Proteção de Rotas Admin',
        category: 'security',
        priority: 'critical',
        status: 'reviewing',
        description: 'Exige revisão manual para garantir que todas as rotas /admin estão devidamente protegidas por RLS e guards de autenticação.',
        impact: 'Acesso não autorizado a dados sensíveis ou funções administrativas.',
        recommendation: 'Verifique src/routes/ e garanta que AuthProvider/AdminGuard são aplicados consistentemente.',
        detectedAt: new Date().toISOString(),
      });

      // 7. Manual Review: Empty States & Fallbacks
      detectedIssues.push({
        id: crypto.randomUUID(),
        title: 'Revisão de Empty/Error States',
        category: 'ux',
        priority: 'medium',
        status: 'reviewing',
        description: 'Verificar se componentes que listam dados possuem fallbacks para estados vazios ou de erro.',
        impact: 'UX pobre quando não há dados para exibir, deixando a tela em branco.',
        recommendation: 'Implemente componentes de "Nada encontrado" e tratamentos de erro visuais.',
        detectedAt: new Date().toISOString(),
      });

       // 8. Manual Review: Feedback Actions
      detectedIssues.push({
        id: crypto.randomUUID(),
        title: 'Feedback em Ações Críticas',
        category: 'ux',
        priority: 'high',
        status: 'reviewing',
        description: 'Verificar se todas as ações de salvar/excluir/editar fornecem feedback visual imediato (toasts, loadings).',
        impact: 'Incerteza do usuário sobre a conclusão de uma tarefa importante.',
        recommendation: 'Utilize o hook useToast para confirmar ações realizadas pelo usuário.',
        detectedAt: new Date().toISOString(),
      });

      // Calculate Summary
      const newSummary: AuditSummary = {
        total: detectedIssues.length,
        critical: detectedIssues.filter(i => i.priority === 'critical').length,
        high: detectedIssues.filter(i => i.priority === 'high').length,
        medium: detectedIssues.filter(i => i.priority === 'medium').length,
        low: detectedIssues.filter(i => i.priority === 'low').length,
      };

      setIssues(detectedIssues);
      setSummary(newSummary);
      
      detectedIssues.forEach(issue => {
        console.log('[useSiteAudit:issueDetected]', issue);
      });

      toast({
        title: "Auditoria Concluída",
        description: `Encontrados ${detectedIssues.length} itens para revisão.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido na auditoria';
      setError(msg);
      console.error('[useSiteAudit:runAudit] Error:', err);
      toast({
        title: "Erro na Auditoria",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const clearAudit = useCallback(() => {
    setIssues([]);
    setSummary({ total: 0, critical: 0, high: 0, medium: 0, low: 0 });
    console.log('[useSiteAudit:clearAudit] Audit cleared.');
  }, []);

  return {
    loading,
    error,
    issues,
    summary,
    runAudit,
    clearAudit,
  };
};

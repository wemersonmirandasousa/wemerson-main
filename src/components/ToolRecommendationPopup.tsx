import React, { useState, useEffect } from 'react';
import type { Tool } from '@/types/tool';
import { X, Sparkles, ArrowRight } from 'lucide-react';

interface ToolRecommendationPopupProps {
  tools: Tool[];
  onOpenTool: (tool: Tool) => void;
}

const SESSION_KEY = 'wemerson_recommendation_shown';

const ToolRecommendationPopup: React.FC<ToolRecommendationPopupProps> = ({ tools, onOpenTool }) => {
  const [visible, setVisible] = useState(false);
  const [tool, setTool] = useState<Tool | null>(null);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    // Only show once per session
    if (sessionStorage.getItem(SESSION_KEY)) return;
    
    const activeTools = tools.filter(t => t.status === 'active' && t.titulo);
    if (activeTools.length === 0) return;

    const randomTool = activeTools[Math.floor(Math.random() * activeTools.length)];
    setTool(randomTool);

    // Delay popup for a smooth experience after login
    const timer = setTimeout(() => {
      setVisible(true);
      sessionStorage.setItem(SESSION_KEY, 'true');
      setTimeout(() => setAnimateIn(true), 50);
    }, 1200);

    return () => clearTimeout(timer);
  }, [tools]);

  const handleClose = () => {
    setAnimateIn(false);
    setTimeout(() => setVisible(false), 300);
  };

  const handleOpenTool = () => {
    if (tool) {
      onOpenTool(tool);
      handleClose();
    }
  };

  if (!visible || !tool) return null;

  const categoria = tool.categoria || 'Ferramenta';
  const descricao = tool.funcao || tool.descricao || 'Uma ferramenta poderosa para otimizar seu trabalho.';

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[60] transition-opacity duration-300 ${animateIn ? 'opacity-100' : 'opacity-0'}`}
        style={{ background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
        onClick={handleClose}
      />
      
      {/* Popup */}
      <div
        className={`fixed left-1/2 top-1/2 z-[61] w-full max-w-[420px] -translate-x-1/2 transition-all duration-300 ${
          animateIn ? '-translate-y-1/2 opacity-100 scale-100' : '-translate-y-[45%] opacity-0 scale-95'
        }`}
      >
        <div
          className="rounded-3xl border overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, hsl(220 20% 11%) 0%, hsl(220 20% 8%) 100%)',
            borderColor: 'hsl(0 0% 100% / 0.1)',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(34, 197, 94, 0.08)',
          }}
        >
          {/* Header gradient bar */}
          <div
            className="h-1"
            style={{ background: 'linear-gradient(90deg, #22C55E, #3B82F6, #A78BFA)' }}
          />

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full transition-all hover:bg-white/10"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>

          <div className="p-7 space-y-5">
            {/* Icon + Badge */}
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(59, 130, 246, 0.2))',
                  border: '1px solid rgba(34, 197, 94, 0.2)',
                }}
              >
                <Sparkles className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-emerald-400/80 font-semibold">
                  Recomendação para você
                </p>
                <p className="text-[10px] text-muted-foreground/50">{categoria}</p>
              </div>
            </div>

            {/* Tool info */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground leading-tight">
                {tool.titulo}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                {descricao}
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">
                Como pode ajudar
              </p>
              <div className="space-y-1.5">
                {[
                  'Agiliza processos e economiza tempo',
                  'Resultados consistentes e profissionais',
                  'Fácil de usar, pronto para começar',
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-emerald-400/60" />
                    <span className="text-xs text-foreground/70">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleOpenTool}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-[13px] font-semibold transition-all hover:brightness-110"
                style={{
                  background: 'linear-gradient(135deg, #22C55E, #16A34A)',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 16px rgba(34, 197, 94, 0.3)',
                }}
              >
                Explorar Ferramenta
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={handleClose}
                className="rounded-xl px-4 py-3 text-[13px] font-medium text-muted-foreground transition-all hover:bg-white/5"
                style={{ border: '1px solid hsl(0 0% 100% / 0.1)' }}
              >
                Depois
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ToolRecommendationPopup;

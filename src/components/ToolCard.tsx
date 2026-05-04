import React, { useState, useRef, useCallback } from 'react';
import { Tool, toolTypeToCategoria, parseRecursos } from '@/types/tool';
import { ExternalLink, Settings, HelpCircle, MessageCircle, Check, Download, Copy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadToolImage, updateTool, sendWhatsAppAudit, fetchKnowledgeFiles } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const RIPPLE_COLORS: Record<string, string> = {
  "GPT's": 'rgba(51,51,51,0.5)',
  'GPT': 'rgba(51,51,51,0.5)',
  'Automações': 'rgba(224,64,251,0.4)',
  'Automação': 'rgba(224,64,251,0.4)',
  'Sistemas': 'rgba(220,38,38,0.4)',
  'Sistema': 'rgba(220,38,38,0.4)',
  'Documentos': 'rgba(52,168,83,0.4)',
  'Documento': 'rgba(52,168,83,0.4)',
  'Designs': 'rgba(66,133,244,0.4)',
  'Arte': 'rgba(66,133,244,0.4)',
  'Assistentes': 'rgba(34,197,94,0.4)',
  "DataBase's": 'rgba(14,116,144,0.4)',
  'Database': 'rgba(14,116,144,0.4)',
  'Android': 'rgba(34,197,94,0.4)',
  'APK': 'rgba(34,197,94,0.4)',
  'iOS': 'rgba(115,115,115,0.4)',
  'IPA': 'rgba(115,115,115,0.4)',
};

interface ToolCardProps {
  tool: Tool;
  onOpenDrawer: (tool: Tool) => void;
  onOpenWhatDoes: (tool: Tool) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onUpdated?: () => void;
  hasExtraStructure?: boolean; // precomputed flag for credentials/knowledge/links
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getGradientStyle(tool: Tool): React.CSSProperties {
  if (tool.cor_cartao) {
    return {
      background: `linear-gradient(135deg, ${tool.cor_cartao}66, ${tool.cor_cartao}33)`,
    };
  }
  const name = tool.titulo;
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const gradients = [
    'linear-gradient(135deg, rgba(37, 99, 235, 0.4), rgba(8, 145, 178, 0.2))', // blue to cyan
    'linear-gradient(135deg, rgba(147, 51, 234, 0.4), rgba(219, 39, 119, 0.2))', // purple to pink
    'linear-gradient(135deg, rgba(5, 150, 105, 0.4), rgba(13, 148, 136, 0.2))', // emerald to teal
    'linear-gradient(135deg, rgba(5, 150, 105, 0.4), rgba(22, 163, 74, 0.2))', // emerald to green
    'linear-gradient(135deg, rgba(225, 29, 72, 0.4), rgba(220, 38, 38, 0.2))', // rose to red
    'linear-gradient(135deg, rgba(79, 70, 229, 0.4), rgba(124, 58, 237, 0.2))', // indigo to violet
  ];
  return {
    background: gradients[hash % gradients.length],
  };
}

function getCategoryIcon(categoria: string): string {
  const map: Record<string, string> = {
    "GPT's": '🤖', 'GPT': '🤖', 'Automações': '⚡', 'Automação': '⚡', 'Sistemas': '🖥️', 'Sistema': '🖥️',
    'Documentos': '📄', 'Documento': '📄', 'Designs': '🎨', 'Arte': '🎨', 'Assistentes': '🎧',
    "DataBase's": '🗄️', 'Database': '🗄️',
    'Android': '🤖', 'APK': '🤖', 'iOS': '🍎', 'IPA': '🍎',
    'Agentes': '🤖',
  };
  return map[categoria] || '🔧';
}

const WHATSAPP_URL = 'https://web.whatsapp.com/send?autoload=1&app_absent=0&phone=553898215816&text=';

const COPY_CATEGORIES = ['Automações', 'Automação', 'Assistentes', "DataBase's", 'Database'];

function getCategoryButtonStyle(categoria: string): { bg: string; color: string; shadow: string; hoverBg: string } {
  if (categoria === 'Automações' || categoria === 'Automação')
    return { bg: 'linear-gradient(135deg, #E040FB, #7C3AED)', color: '#000000', shadow: '0 4px 12px rgba(224,64,251,0.35)', hoverBg: '#7C3AED' };
  if (categoria === 'Assistentes')
    return { bg: 'linear-gradient(135deg, #FFFFFF, #E8F5E9)', color: '#000000', shadow: '0 4px 12px rgba(16,185,129,0.25)', hoverBg: '#E8F5E9' };
  if (categoria === "DataBase's" || categoria === 'Database')
    return { bg: 'linear-gradient(135deg, #0F172A, #0E7490)', color: '#FFFFFF', shadow: '0 4px 12px rgba(14,116,144,0.35)', hoverBg: '#0E7490' };
  if (categoria === 'Documentos' || categoria === 'Documento')
    return { bg: 'linear-gradient(135deg, #34A853, #0F9D58)', color: '#FFFFFF', shadow: '0 4px 12px rgba(15,157,88,0.35)', hoverBg: '#0F9D58' };
  if (categoria === 'Designs' || categoria === 'Arte')
    return { bg: 'linear-gradient(135deg, #34A853, #FBBC04, #4285F4)', color: '#000000', shadow: '0 4px 12px rgba(66,133,244,0.30)', hoverBg: '#FBBC04' };
  if (categoria === 'Sistemas' || categoria === 'Sistema')
    return { bg: 'linear-gradient(135deg, #DC2626, #7C3AED)', color: '#000000', shadow: '0 4px 12px rgba(124,58,237,0.35)', hoverBg: 'linear-gradient(135deg, #B91C1C, #6D28D9)' };
  if (categoria === 'Android' || categoria === 'APK')
    return { bg: 'linear-gradient(135deg, #34A853, #16A34A)', color: '#000000', shadow: '0 4px 12px rgba(52,168,83,0.35)', hoverBg: '#16A34A' };
  if (categoria === 'iOS' || categoria === 'IPA')
    return { bg: 'linear-gradient(135deg, #444444, #1A1A1A)', color: '#FFFFFF', shadow: '0 4px 12px rgba(0,0,0,0.4)', hoverBg: '#222222' };
  if (categoria === 'Agentes')
    return { bg: 'linear-gradient(135deg, #F97316, #FB923C)', color: '#FFFFFF', shadow: '0 4px 12px rgba(249,115,22,0.35)', hoverBg: '#FB923C' };
  return { bg: 'linear-gradient(135deg, #1A1A1A, #333333)', color: '#FFFFFF', shadow: '0 4px 12px rgba(0,0,0,0.4)', hoverBg: '#444444' };
}

function getCardStyle(tool: Tool, isDragging: boolean): React.CSSProperties {
  const isOutdated = tool.status === 'outdated';
  const customColor = tool.cor_cartao;

  let background = isOutdated ? 'hsl(0 40% 12% / 0.5)' : 'hsl(0 0% 100% / 0.04)';
  let borderColor = isDragging ? 'hsl(210 100% 60% / 0.5)' : isOutdated ? 'hsl(0 50% 30% / 0.4)' : 'hsl(0 0% 100% / 0.08)';

  if (customColor && !isOutdated) {
    background = `${customColor}15`; // 15 is hex opacity (approx 8%)
    borderColor = `${customColor}30`; // 30 is hex opacity (approx 20%)
  }

  return {
    background,
    borderColor,
  };
}

function getCategoryButtonLabel(categoria: string): { label: string; icon: 'ExternalLink' | 'Copy' | 'Download' } {
  if (categoria === 'Automações' || categoria === 'Automação') return { label: 'Copiar Blueprint', icon: 'Copy' };
  if (categoria === 'Assistentes') return { label: 'Copiar Reusable Prompt', icon: 'Copy' };
  if (categoria === "DataBase's" || categoria === 'Database') return { label: 'Copiar SQL', icon: 'Copy' };
  if (categoria === 'Android' || categoria === 'APK') return { label: 'BAIXAR O APK', icon: 'Download' };
  if (categoria === 'iOS' || categoria === 'IPA') return { label: 'Download IPA', icon: 'Download' };
  return { label: 'Acessar', icon: 'ExternalLink' };
}

function hasStructureContent(tool: Tool, hasExtraStructure?: boolean): boolean {
  // Check recursos for any enabled feature
  const res = parseRecursos(tool.recursos);
  const hasRecursos = res.webSearch || res.appsBeta || res.lousa || res.imagens || res.codeInterpreter;

  return !!(
    hasExtraStructure ||
    tool.instrucoes?.trim() ||
    tool.link_contexto || tool.link_criacao_prompt || tool.link_gpt_criacao_prompt ||
    tool.link_gpt_transformacao_base_conhecimento || tool.link_contexto_transformacao_base_conhecimento ||
    tool.link_gpt_pronto || tool.link_gpt_transformacao_contexto ||
    tool.funcao || tool.modelo_recomendado ||
    hasRecursos ||
    (tool.quebra_gelos && tool.quebra_gelos.length > 0) ||
    (tool.setores && tool.setores !== 'Todas as ferramentas') ||
    (tool.origem && tool.origem !== 'manual') || tool.origem_detalhe ||
    (tool.tags && tool.tags.length > 0) ||
    tool.print_processo_url || tool.print_resultado_url
  );
}

function hasWhatDoesContent(tool: Tool): boolean {
  return !!(tool.print_processo_url || tool.print_resultado_url);
}

const ToolCardBase: React.FC<ToolCardProps> = ({ tool, onOpenDrawer, onOpenWhatDoes, selectionMode, isSelected, onToggleSelect, onUpdated, hasExtraStructure }) => {
  const { user, isEditor } = useAuth();
  const isVisitor = !user;
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  let categoria = tool.categoria || toolTypeToCategoria(tool.tool_type || 'gpt');
  
  // Override category based on title for better UX if needed
  if (tool.titulo.toUpperCase().includes('ANDROID') || tool.titulo.toUpperCase().includes('APK')) {
    if (categoria === 'Sistemas' || categoria === 'Sistema' || !categoria) categoria = 'Android';
  } else if (tool.titulo.toUpperCase().includes('IOS') || tool.titulo.toUpperCase().includes('IPA')) {
    if (categoria === 'Sistemas' || categoria === 'Sistema' || !categoria) categoria = 'iOS';
  }
  const isCopyCategory = COPY_CATEGORIES.includes(categoria);

  const createRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      const ripple = document.createElement('span');
      const rippleColor = RIPPLE_COLORS[categoria] || 'rgba(255,255,255,0.3)';
      ripple.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${x}px;top:${y}px;border-radius:50%;background:${rippleColor};transform:scale(0);animation:rippleAnim 0.6s ease-out forwards;pointer-events:none;`;
      button.appendChild(ripple);
      setTimeout(() => { if (ripple.parentNode) ripple.remove(); }, 600);
    } catch (err) {
      console.error('Ripple error:', err);
    }
  }, [categoria]);


  const handleDragEnter = (e: React.DragEvent) => {
    if (!isEditor) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isEditor) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    if (!isEditor || !user) return;

    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      toast({ description: 'Apenas imagens são aceitas', variant: 'destructive' });
      return;
    }

    try {
      const url = await uploadToolImage(tool.id, file);
      await updateTool(tool.id, { image_url: url }, user.id);
      onUpdated?.();
      toast({ description: 'Imagem atualizada' });
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
  };

  const handleBlueprintCopy = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const link = tool.link_acesso_original;
    if (!link) return;
    const clean = link.replace(/[\r\n]+/g, '').trim();
    try {
      await navigator.clipboard.writeText(clean);
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
      let msg = `Blueprint copiado às ${time}`;
      if (categoria === "DataBase's" || categoria === 'Database') msg = `SQL copiado com sucesso • ${time}`;
      else if (categoria === 'Assistentes') msg = `REUSABLE PROMPT COPIADO • ${time}`;
      toast({ description: msg });
      sendWhatsAppAudit('copia', `Copiou conteúdo da ferramenta "${tool.titulo}" (${categoria})`, user?.email);
    } catch {
      toast({ description: 'Erro ao copiar', variant: 'destructive' });
    }
  };

  const isOutdated = tool.status === 'outdated';

  return (
    <div
      className={`group rounded-2xl border overflow-hidden transition-[transform,border-color] duration-200 hover:-translate-y-[3px] hover:border-[hsl(0_0%_100%/0.16)] cursor-pointer relative ${isSelected ? 'ring-2 ring-primary' : ''} ${isDragging ? 'ring-2 ring-primary scale-[1.02]' : ''}`}
      style={getCardStyle(tool, isDragging)}
      onClick={() => {
        if (selectionMode && isEditor) {
          onToggleSelect?.(tool.id);
        } else {
          onOpenDrawer(tool);
        }
      }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drop overlay — pointer-events-none to avoid drag flicker */}
      {isDragging && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl pointer-events-none" style={{ background: 'hsl(210 100% 60% / 0.15)' }}>
          <p className="text-sm font-medium text-primary pointer-events-none">Solte para substituir imagem</p>
        </div>
      )}

      {/* Selection checkbox */}
      {selectionMode && isEditor && (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleSelect?.(tool.id); }}
          className={`absolute top-3 left-3 z-10 flex h-6 w-6 items-center justify-center rounded-md border transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-muted-foreground/40 bg-background/80'}`}
        >
          {isSelected && <Check className="h-4 w-4 text-primary-foreground" />}
        </button>
      )}

      {/* Draft badge - editor only */}
      {isEditor && tool.status === 'draft' && (
        <div className="absolute top-3 right-3 z-10 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: 'hsl(0 0% 0% / 0.6)', color: 'hsl(0 0% 70%)' }}>
          Rascunho
        </div>
      )}
      {/* Outdated badge */}
      {isOutdated && (
        <div className="absolute top-3 right-3 z-10 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: 'hsl(0 50% 20% / 0.8)', color: 'hsl(0 70% 70%)' }}>
          Desatualizada
        </div>
      )}

      {/* Cover image with overlay */}
      <div className="relative h-[220px] overflow-hidden">
        {tool.image_url ? (
          <>
            <img src={tool.image_url} alt={tool.titulo} className="h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(transparent 40%, rgba(0,0,0,0.7))' }} />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center relative" style={getGradientStyle(tool)}>
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl">{getCategoryIcon(categoria)}</span>
              <span className="text-2xl font-bold text-foreground/50">{getInitials(tool.titulo)}</span>
              <span className="text-[10px] uppercase tracking-wider text-foreground/30 font-medium">{categoria}</span>
            </div>
          </div>
        )}

        {/* Overlay buttons */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onOpenDrawer(tool); }}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[11px] font-medium transition-colors"
            style={{ background: 'rgba(0,0,0,0.7)', border: `1px solid ${hasStructureContent(tool, hasExtraStructure) ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}`, color: 'rgba(255,255,255,0.9)' }}
          >
            <span className={`inline-block h-1.5 w-1.5 rounded-full mr-0.5 ${hasStructureContent(tool, hasExtraStructure) ? 'bg-green-400' : 'bg-red-400'}`} />
            <Settings className="h-3 w-3" />
            Estrutura
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onOpenWhatDoes(tool); }}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-[11px] font-medium transition-colors"
            style={{ background: 'rgba(0,0,0,0.7)', border: `1px solid ${hasWhatDoesContent(tool) ? 'rgba(34,197,94,0.5)' : 'rgba(239,68,68,0.5)'}`, color: 'rgba(255,255,255,0.9)' }}
          >
            <span className={`inline-block h-1.5 w-1.5 rounded-full mr-0.5 ${hasWhatDoesContent(tool) ? 'bg-green-400' : 'bg-red-400'}`} />
            <HelpCircle className="h-3 w-3" />
            O QUE FAZ?
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-[15px] font-semibold text-foreground leading-tight mb-1 truncate">{tool.titulo}</h3>
        <p className="text-[13px] text-muted-foreground line-clamp-2 mb-4 min-h-[2.6em]">{tool.descricao || 'Sem descrição'}</p>

        {/* Action button — styled per category for ALL users; visitors redirect to WhatsApp */}
        <div className="flex items-center gap-2">
          {(() => {
            const style = getCategoryButtonStyle(categoria);
            const btnInfo = getCategoryButtonLabel(categoria);
            const hasLink = !!tool.link_acesso_original;
            const isAndroid = categoria === 'Android' || categoria === 'APK';
            const isIos = categoria === 'iOS' || categoria === 'IPA';
            const canDownload = isAndroid || isIos;

            if (isCopyCategory) {
              const handleClick = () => {
                if (isVisitor) {
                  window.open('https://wa.me/message/CXZEURMC7SRMC1', '_blank', 'noopener,noreferrer');
                  return;
                }
                handleBlueprintCopy();
              };
              return (
                <button
                  onClick={(e) => { createRipple(e); handleClick(); }}
                  disabled={!hasLink && !isVisitor}
                  className="relative overflow-hidden inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.5px] transition-colors w-full disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: hasLink || isVisitor ? style.bg : 'hsl(0 0% 20%)', color: hasLink || isVisitor ? style.color : 'hsl(0 0% 50%)', boxShadow: hasLink || isVisitor ? style.shadow : 'none' }}
                  onMouseEnter={(e) => { if (hasLink || isVisitor) e.currentTarget.style.background = style.hoverBg; }}
                  onMouseLeave={(e) => { if (hasLink || isVisitor) e.currentTarget.style.background = style.bg; }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  {btnInfo.label}
                </button>
              );
            }

            // Non-copy categories: show styled button for everyone
            const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              createRipple(e);
              if (isVisitor) {
                if (tool.link_acesso_original) {
                  sendWhatsAppAudit('acesso', `Visitante clicou em Acessar "${tool.titulo}" → redirecionado ao link determinado`, 'Visitante');
                  const url = tool.link_acesso_original.startsWith('http') ? tool.link_acesso_original : `https://${tool.link_acesso_original}`;
                  window.open(url, '_blank', 'noopener,noreferrer');
                } else {
                  sendWhatsAppAudit('acesso', `Visitante clicou em Acessar "${tool.titulo}" → redirecionado ao WhatsApp (sem link determinado)`, 'Visitante');
                  window.open('https://wa.me/message/CXZEURMC7SRMC1', '_blank', 'noopener,noreferrer');
                }
                return;
              }

              // Automatic download for Android/iOS if files exist in knowledge base
              if (isAndroid || isIos) {
                try {
                  const files = await fetchKnowledgeFiles(tool.id);
                  const downloadFile = files.find(f => 
                    (isAndroid && f.file_name.toLowerCase().endsWith('.apk')) ||
                    (isIos && f.file_name.toLowerCase().endsWith('.ipa')) ||
                    // If no explicit apk/ipa extension, but it's the only file and we're in the right category, try it
                    (files.length === 1)
                  );

                  if (downloadFile) {
                    const { data, error } = await supabase.storage
                      .from('knowledge-files')
                      .download(downloadFile.storage_path);
                    
                    if (error) throw error;
                    
                    const url = URL.createObjectURL(data);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = downloadFile.file_name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                    
                    const tech = isAndroid ? 'APK' : 'IPA';
                    sendWhatsAppAudit('acesso', `Download automático de ${tech} "${downloadFile.file_name}" para ferramenta "${tool.titulo}"`, user?.email);
                    toast({ description: `${tech} baixado com sucesso!` });
                    return;
                  }
                } catch (err) {
                  console.error('Download error:', err);
                }
              }

              if (tool.link_acesso_original) {
                sendWhatsAppAudit('acesso', `Acessou ferramenta "${tool.titulo}" (${categoria})`, user?.email);
                window.open(tool.link_acesso_original, '_blank', 'noopener,noreferrer');
              }
            };

            return hasLink || isVisitor || canDownload ? (
              <button
                onClick={handleClick}
                className="relative overflow-hidden inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.5px] transition-colors w-full"
                style={{ background: style.bg, color: style.color, boxShadow: style.shadow }}
                onMouseEnter={(e) => e.currentTarget.style.background = style.hoverBg}
                onMouseLeave={(e) => e.currentTarget.style.background = style.bg}
              >
                {btnInfo.icon === 'ExternalLink' && <ExternalLink className="h-3.5 w-3.5" />}
                {btnInfo.icon === 'Download' && <Download className="h-3.5 w-3.5" />}
                {btnInfo.icon === 'Copy' && <Copy className="h-3.5 w-3.5" />}
                {btnInfo.label}
              </button>
            ) : null;
          })()}
        </div>

        {/* Last update date */}
        {tool.atualizado_em && (
          <p className="text-[10px] text-muted-foreground/50 mt-3">
            Atualizado em: {new Date(tool.atualizado_em).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>
    </div>
  );
};

const ToolCard = React.memo(ToolCardBase);
export default ToolCard;

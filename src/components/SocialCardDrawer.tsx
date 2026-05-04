import React, { useRef } from 'react';
import { MessageCircle, Camera, Play, ExternalLink, MessageSquare, StickyNote, Upload, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadSocialCardIcon } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  whatsapp: MessageCircle,
  instagram: Camera,
  youtube: Play,
  
  chatdocs: MessageSquare,
  wechat: MessageSquare,
  notes: StickyNote,
  
};

interface SocialCardDrawerProps {
  cards: any[];
  onCardClick: (card: any) => void;
  onClose?: () => void;
}

const SocialCardDrawer: React.FC<SocialCardDrawerProps> = ({ cards, onCardClick, onClose }) => {
  const { isEditor } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadCardIdRef = useRef<string | null>(null);

  const visibleCards = cards.filter((c) => {
    // Hide wallpaper and FAB records from grid for everyone
    if (c.icon === 'wallpaper' || c.icon === 'fab' || c.icon === 'fab_left') return false;
    return true;
  });
  if (visibleCards.length === 0) return null;

  const handleIconUpload = async (cardId: string, file: File) => {
    try {
      await uploadSocialCardIcon(cardId, file);
      queryClient.invalidateQueries({ queryKey: ['social-cards'] });
      toast({ description: 'Ícone atualizado' });
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 py-4 relative" style={{ animation: 'fadeOnly 0.2s ease-out' }}>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute -right-12 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-secondary/50 border border-border text-muted-foreground hover:text-foreground transition-all hover:scale-110"
          title="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {/* Hidden file input for icon uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadCardIdRef.current) {
            handleIconUpload(uploadCardIdRef.current, file);
          }
          e.target.value = '';
        }}
      />

      {visibleCards.map((card) => {
        const Icon = iconMap[card.icon] || ExternalLink;
        const hasCustomIcon = !!card.image_url;

        return (
          <div key={card.id} className="relative group/icon">
            <button
              onClick={() => onCardClick(card)}
              className="flex flex-col items-center justify-center gap-1.5 rounded-2xl overflow-hidden transition-transform duration-150 will-change-transform hover:scale-105"
              style={{
                width: '72px',
                height: '72px',
                background: 'hsl(0 0% 100% / 0.08)',
                border: '1px solid hsl(0 0% 100% / 0.12)',
              }}
              title={card.titulo}
            >
              {hasCustomIcon ? (
                <img src={card.image_url} alt={card.titulo} className="h-8 w-8 object-cover rounded-lg" />
              ) : (
                <Icon className="h-6 w-6 text-muted-foreground group-hover/icon:text-[#FF8A00] transition-colors" />
              )}
              <span className="text-[9px] font-medium text-muted-foreground truncate max-w-[60px]">
                {card.titulo}
              </span>
            </button>

            {/* Upload button for editors */}
            {isEditor && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  uploadCardIdRef.current = card.id;
                  fileInputRef.current?.click();
                }}
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center opacity-0 group-hover/icon:opacity-100 transition-opacity"
                style={{ background: 'hsl(var(--primary-orange))', color: '#fff' }}
                title="Alterar ícone"
              >
                <Upload className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SocialCardDrawer;

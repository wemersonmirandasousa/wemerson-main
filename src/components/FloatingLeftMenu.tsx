import React, { useState, useEffect } from 'react';
import { Settings, X, Upload, Plus, HardDrive, Bot } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchSocialCards, updateSocialCard, createSocialCard, uploadSocialCardIcon } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface FloatingLeftMenuProps {
  hidden?: boolean;
}

const FloatingLeftMenu: React.FC<FloatingLeftMenuProps> = ({ hidden = false }) => {
  const { user, isEditor } = useAuth();
  const [cards, setCards] = useState<any[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadConfigs(); }, []);

  const loadConfigs = async () => {
    try {
      const allCards = await fetchSocialCards();
      // Filter only FAB-related cards
      const fabCards = (allCards as any[]).filter(c => c.icon?.startsWith('fab_'));
      setCards(fabCards);
    } catch {
      setCards([]);
    }
  };

  const handleSave = async () => {
    if (!user || !editingCard) return;
    setSaving(true);
    try {
      await updateSocialCard(editingCard.id, {
        url: editUrl,
        descricao: editLabel,
      } as any, user.id);
      
      setEditingCard(null);
      toast({ description: 'Configuração atualizada' });
      loadConfigs();
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, cardId: string) => {
    if (!user || !e.target.files?.[0]) return;
    try {
      const url = await uploadSocialCardIcon(cardId, e.target.files[0]);
      await updateSocialCard(cardId, { image_url: url }, user.id);
      toast({ description: 'Imagem atualizada' });
      loadConfigs();
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
  };

  const ensureProtocol = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  const renderIcon = (card: any) => {
    if (card.image_url) {
      return <img src={card.image_url} alt={card.descricao} className="h-full w-full object-cover" />;
    }
    if (card.icon === 'fab_drive') return <HardDrive className="h-6 w-6 text-white" />;
    return <Bot className="h-6 w-6 text-white" />;
  };

  const getBackground = (card: any) => {
    if (card.image_url) return 'transparent';
    if (card.icon === 'fab_drive') return 'linear-gradient(135deg, #34A853, #1B5E20)';
    return 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))';
  };

  const getShadow = (card: any) => {
    if (card.icon === 'fab_drive') return '0 4px 20px rgba(52, 168, 83, 0.35)';
    return '0 4px 20px hsl(var(--primary) / 0.35)';
  };

  if (cards.length === 0 && !isEditor) return null;

  return (
    <>
      <div className={`fixed bottom-6 left-6 z-40 flex flex-col items-start gap-4 transition-opacity duration-300 ${hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex flex-col-reverse items-start gap-3">
          {cards.map((card, idx) => (
            <div key={card.id} className="group relative flex items-center gap-3">
              <a
                href={card.url ? ensureProtocol(card.url) : undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-transform hover:scale-110 overflow-hidden"
                style={{
                  background: getBackground(card),
                  boxShadow: getShadow(card),
                }}
                title={card.descricao}
              >
                {renderIcon(card)}
              </a>
              
              {isEditor && (
                <button
                  onClick={() => {
                    setEditingCard(card);
                    setEditLabel(card.descricao || '');
                    setEditUrl(card.url || '');
                    setShowConfig(true);
                  }}
                  className="opacity-0 group-hover:opacity-100 flex h-7 w-7 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110 bg-background/80 border border-border backdrop-blur-sm"
                >
                  <Settings className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Config popover (editor only) */}
      {showConfig && editingCard && isEditor && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setShowConfig(false)} />
          <div
            className="fixed bottom-24 left-24 z-50 w-72 rounded-2xl border p-4 space-y-3 shadow-xl"
            style={{ background: 'hsl(220 20% 9%)', borderColor: 'hsl(0 0% 100% / 0.1)' }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Configurar {editingCard.descricao || 'Botão'}</p>
              <button onClick={() => setShowConfig(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase">Imagem (opcional)</label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                <Upload className="h-3.5 w-3.5" />
                Trocar imagem
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, editingCard.id)} />
              </label>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase">Nome / Título</label>
              <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} className="h-8 text-xs bg-secondary/50 border-border" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase">Link (URL)</label>
              <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} className="h-8 text-xs bg-secondary/50 border-border" />
            </div>
            <Button onClick={handleSave} disabled={saving} size="sm" className="w-full h-8 text-xs">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </>
      )}
    </>
  );
};

export default FloatingLeftMenu;
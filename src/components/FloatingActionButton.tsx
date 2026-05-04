import React, { useState, useEffect } from 'react';
import { Bot, Settings, X, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchSocialCards, updateSocialCard, createSocialCard, uploadSocialCardIcon } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface FABProps {
  hidden?: boolean;
}

const FloatingActionButton: React.FC<FABProps> = ({ hidden = false }) => {
  const { user, isEditor } = useAuth();
  const [config, setConfig] = useState<{ id?: string; url: string; label: string; image_url?: string | null } | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [editLabel, setEditLabel] = useState('Assistente IA');
  const [editUrl, setEditUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadConfig(); }, []);

  const loadConfig = async () => {
    try {
      const cards = await fetchSocialCards();
      const item = (cards as any[]).find(c => c.icon === 'fab');
      if (item) {
        setConfig({ id: item.id, url: item.url || '', label: item.descricao || 'Assistente IA', image_url: item.image_url || null });
        setEditLabel(item.descricao || 'Assistente IA');
        setEditUrl(item.url || '');
      } else {
        setConfig({ url: '', label: 'Assistente IA' });
      }
    } catch {
      setConfig({ url: '', label: 'Assistente IA' });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (config?.id) {
        await updateSocialCard(config.id, { url: editUrl, descricao: editLabel } as any, user.id);
      } else {
        await createSocialCard({
          titulo: 'FAB Right Link',
          icon: 'fab',
          button_label: 'bot',
          url: editUrl,
          descricao: editLabel,
          ordem: 999,
          ativo: true,
        } as any, user.id);
      }
      setConfig({ ...config, url: editUrl, label: editLabel });
      setShowConfig(false);
      toast({ description: 'Configuração atualizada' });
      loadConfig();
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !config?.id || !e.target.files?.[0]) return;
    try {
      const url = await uploadSocialCardIcon(config.id, e.target.files[0]);
      await updateSocialCard(config.id, { image_url: url }, user.id);
      setConfig({ ...config, image_url: url });
      toast({ description: 'Imagem atualizada' });
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
  };

  const ensureProtocol = (url: string) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (config?.url) {
      window.open(ensureProtocol(config.url), '_blank', 'noopener,noreferrer');
    }
  };

  if (!config) return null;

  const hasImage = !!config.image_url;
  const hasUrl = !!config.url;

  return (
    <>
      <div className={`fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2 transition-opacity duration-300 ${hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        {isEditor && (
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex h-7 w-7 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110"
            style={{ background: 'hsl(0 0% 100% / 0.1)', border: '1px solid hsl(0 0% 100% / 0.15)' }}
          >
            <Settings className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
        <a
          href={hasUrl ? ensureProtocol(config.url) : undefined}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => { if (!hasUrl) e.preventDefault(); }}
          className="flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-transform hover:scale-110 overflow-hidden disabled:cursor-not-allowed disabled:opacity-60"
          style={{
            background: hasImage ? 'transparent' : 'linear-gradient(135deg, hsl(var(--primary-orange)), hsl(var(--primary-orange) / 0.7))',
            boxShadow: '0 4px 20px hsl(var(--primary-orange) / 0.35)',
            cursor: hasUrl ? 'pointer' : 'default',
          }}
          title={config.label}
        >
          {hasImage ? (
            <img src={config.image_url!} alt={config.label} className="h-full w-full object-cover" />
          ) : (
            <Bot className="h-6 w-6 text-primary-foreground" />
          )}
        </a>
      </div>

      {/* Config popover (editor only) */}
      {showConfig && isEditor && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setShowConfig(false)} />
          <div
            className="fixed bottom-24 right-6 z-50 w-72 rounded-2xl border p-4 space-y-3 shadow-xl"
            style={{ background: 'hsl(220 20% 9%)', borderColor: 'hsl(0 0% 100% / 0.1)' }}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Configurar Botão</p>
              <button onClick={() => setShowConfig(false)}><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase">Imagem do botão (opcional)</label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                <Upload className="h-3.5 w-3.5" />
                {hasImage ? 'Trocar imagem' : 'Enviar imagem'}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase">Nome / Título</label>
              <Input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder="Assistente IA" className="h-8 text-xs bg-secondary/50 border-border" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-muted-foreground uppercase">Link (URL)</label>
              <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://..." className="h-8 text-xs bg-secondary/50 border-border" />
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

export default FloatingActionButton;

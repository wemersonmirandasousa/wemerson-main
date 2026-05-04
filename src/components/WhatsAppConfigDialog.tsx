import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Settings2, Save } from 'lucide-react';

interface WhatsAppConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const WhatsAppConfigDialog: React.FC<WhatsAppConfigDialogProps> = ({ open, onOpenChange }) => {
  const [instanceId, setInstanceId] = useState('');
  const [token, setToken] = useState('');
  const [clientToken, setClientToken] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (open && !loaded) loadSettings();
  }, [open]);

  const loadSettings = async () => {
    const { data } = await supabase.from('site_settings').select('key,value').in('key', ['zapi_instance_id', 'zapi_token', 'zapi_client_token', 'zapi_phone']);
    if (data) {
      for (const s of data) {
        if (s.key === 'zapi_instance_id') setInstanceId(s.value || '');
        if (s.key === 'zapi_token') setToken(s.value || '');
        if (s.key === 'zapi_client_token') setClientToken(s.value || '');
        if (s.key === 'zapi_phone') setPhone(s.value || '');
      }
    }
    setLoaded(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings = [
        { key: 'zapi_instance_id', value: instanceId },
        { key: 'zapi_token', value: token },
        { key: 'zapi_client_token', value: clientToken },
        { key: 'zapi_phone', value: phone },
      ];
      for (const s of settings) {
        await supabase.from('site_settings').upsert({ key: s.key, value: s.value, updated_at: new Date().toISOString() } as any, { onConflict: 'key' });
      }
      toast({ description: 'Configurações do WhatsApp salvas' });
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base"><Settings2 className="h-5 w-5" /> API WhatsApp (Z-API)</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Instance ID</label>
            <Input value={instanceId} onChange={(e) => setInstanceId(e.target.value)} placeholder="3F140B2A..." className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Token</label>
            <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="EE62D79B..." className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Client Token</label>
            <Input value={clientToken} onChange={(e) => setClientToken(e.target.value)} placeholder="F42988e6..." className="h-8 text-xs" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Telefone destino</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="553898215816" className="h-8 text-xs" />
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full h-9 text-xs">
            <Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? 'Salvando...' : 'Salvar configurações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppConfigDialog;
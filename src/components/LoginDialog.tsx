import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Lock } from 'lucide-react';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LoginDialog: React.FC<LoginDialogProps> = ({ open, onOpenChange }) => {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Convert username to email format
    const input = username.trim().toLowerCase().replace(/\s+/g, '');
    const email = input.includes('@') ? input : `${input}@wemerson.app`;

    // Passwordless users: wemerson and 0
    const pwd = password || (input === 'wemerson' ? 'wemerson2025' : input === '0' ? '0000' : '');
    if (!pwd) { setError('Senha obrigatória'); setLoading(false); return; }

    const { error: err } = await signIn(email, pwd);
    if (err) {
      setError(err);
    } else {
      onOpenChange(false);
      setTimeout(() => {
        document.body.style.pointerEvents = '';
        document.body.style.overflow = '';
        document.body.removeAttribute('data-scroll-locked');
        document.querySelectorAll('[data-radix-portal]').forEach((el) => {
          if (!document.querySelector('[data-state="open"]')) el.remove();
        });
      }, 100);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] border-border" style={{ background: 'hsl(220 20% 9%)' }}>
        <DialogHeader>
          <div className="flex flex-col items-center gap-3 pb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'hsl(0 0% 100% / 0.06)', border: '1px solid hsl(0 0% 100% / 0.1)' }}>
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <DialogTitle className="text-lg font-semibold text-foreground">Login</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="login-username" className="text-muted-foreground text-xs uppercase tracking-wider">Usuário</Label>
            <Input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="seu usuário"
              required
              className="h-11 border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password" className="text-muted-foreground text-xs uppercase tracking-wider">Senha</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground/50"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;

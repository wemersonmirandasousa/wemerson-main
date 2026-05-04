import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock } from 'lucide-react';

const Login: React.FC = () => {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const input = username.trim().toLowerCase().replace(/\s+/g, '');
    const email = input.includes('@') ? input : `${input}@wemerson.app`;
    // Passwordless users: wemerson and 0
    const pwd = password || (input === 'wemerson' ? 'wemerson2025' : input === '0' ? '0000' : '');
    if (!pwd) { setError('Senha obrigatória'); setLoading(false); return; }
    const { error: err } = await signIn(email, pwd);
    if (err) setError(err);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: 'hsl(220 20% 7%)' }}>
      <div className="w-full max-w-sm px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'hsl(0 0% 100% / 0.06)', border: '1px solid hsl(0 0% 100% / 0.1)' }}>
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">AI Tools Manager</h1>
          <p className="mt-1 text-sm text-muted-foreground">Faça login para acessar suas ferramentas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-muted-foreground text-xs uppercase tracking-wider">Usuário</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="seu usuário"
              required
              className="h-11 border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground/50 focus:border-ring"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-muted-foreground text-xs uppercase tracking-wider">Senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              
              className="h-11 border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground/50 focus:border-ring"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground/50">
          Acesso restrito a usuários autorizados
        </p>
      </div>
    </div>
  );
};

export default Login;

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

interface CompanyPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyName: string;
  onSuccess: () => void;
  correctPassword: string;
}

const CompanyPasswordDialog: React.FC<CompanyPasswordDialogProps> = ({ open, onOpenChange, companyName, onSuccess, correctPassword }) => {
  const [digits, setDigits] = useState(['', '']);
  const [error, setError] = useState(false);

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError(false);

    // Auto-focus next input
    if (value && index === 0) {
      const el = document.getElementById('pin-digit-1');
      el?.focus();
    }

    // Auto-submit when both filled
    if (index === 1 && value) {
      const pin = next.join('');
      if (pin === correctPassword) {
        onSuccess();
        setDigits(['', '']);
      } else {
        setError(true);
        setTimeout(() => setDigits(['', '']), 600);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      const el = document.getElementById(`pin-digit-${index - 1}`);
      el?.focus();
    }
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setDigits(['', '']);
      setError(false);
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[320px] border-border" style={{ background: 'hsl(220 20% 9%)' }}>
        <DialogHeader>
          <DialogTitle className="text-foreground text-center flex flex-col items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            {companyName}
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground text-center">Digite a senha de acesso</p>

        <div className="flex justify-center gap-3 py-4">
          {digits.map((d, i) => (
            <input
              key={i}
              id={`pin-digit-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={`w-14 h-16 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all ${
                error
                  ? 'border-destructive bg-destructive/10 animate-shake'
                  : 'border-border bg-secondary/50 focus:border-primary'
              } text-foreground`}
              autoFocus={i === 0}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-destructive text-center">Senha incorreta</p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CompanyPasswordDialog;

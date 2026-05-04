import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export function copyToClipboard(text: string, label?: string) {
  navigator.clipboard.writeText(text).then(() => {
    const time = format(new Date(), 'HH:mm');
    toast({ description: `Copiado • ${time}`, duration: 2000 });
  });
}

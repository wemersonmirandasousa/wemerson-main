import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Tool } from '@/types/tool';
import { CATEGORIAS } from '@/types/tool';
import { fetchCategories, updateCategory, uploadCategoryIcon, type Category } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Pencil, Upload, Check, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CategoryCardsProps {
  tools: Tool[];
  activeCategoria?: string;
  onCategoryClick: (categoria: string) => void;
}

/* CSS-styled category icons inspired by brand references */
const CategoryIcon: React.FC<{ categoria: string; iconUrl?: string | null }> = ({ categoria, iconUrl }) => {
  if (iconUrl) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden bg-secondary/50">
        <img src={iconUrl} alt={categoria} className="h-full w-full object-cover" />
      </div>
    );
  }

  switch (categoria) {
    case 'Automação':
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #6D28D9, #9333EA)' }}>
          <div className="flex gap-[3px] rotate-[-15deg]">
            <div className="w-[3px] h-5 rounded-full bg-white/90" />
            <div className="w-[3px] h-5 rounded-full bg-white/60" />
            <div className="w-[3px] h-5 rounded-full bg-white/90" />
          </div>
        </div>
      );
    case 'Arte':
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #34A853, #FBBC04, #4285F4)' }}>
          <div className="relative w-5 h-5">
            <div className="absolute inset-0" style={{ width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '17px solid rgba(255,255,255,0.9)' }} />
          </div>
        </div>
      );
    case 'GPT':
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="relative w-5 h-5">
            <div className="absolute inset-0 rounded-full border-2 border-white/80" style={{ borderRadius: '50% 0 50% 0', transform: 'rotate(45deg)' }} />
            <div className="absolute inset-[3px] rounded-full bg-white/20" />
          </div>
        </div>
      );
    case 'Assistentes':
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}>
          <div className="relative w-5 h-5">
            <div className="absolute inset-0 rounded-full border-2 border-white/80" style={{ borderRadius: '50% 0 50% 0', transform: 'rotate(45deg)' }} />
            <div className="absolute inset-[3px] rounded-full bg-white/20" />
          </div>
        </div>
      );
    case 'Documento':
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #0F9D58, #137333)' }}>
          <div className="grid grid-cols-2 gap-[2px]">
            <div className="w-[7px] h-[7px] rounded-[1px] bg-white/70" />
            <div className="w-[7px] h-[7px] rounded-[1px] bg-white/40" />
            <div className="w-[7px] h-[7px] rounded-[1px] bg-white/40" />
            <div className="w-[7px] h-[7px] rounded-[1px] bg-white/70" />
          </div>
        </div>
      );
    case 'Sistema':
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #DC2626, #7C3AED)' }}>
          <div className="w-5 h-5 rounded-full border-[1.5px] border-white/80 relative overflow-hidden">
            <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/60 -translate-y-1/2" />
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/60 -translate-x-1/2" />
            <div className="absolute inset-0 rounded-full border-[1.5px] border-white/50" style={{ borderRadius: '50%', width: '60%', left: '20%' }} />
          </div>
        </div>
      );
    case 'Agentes':
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, #F97316, #FB923C)' }}>
          <div className="relative w-5 h-5 flex items-center justify-center">
            <span className="text-lg">🤖</span>
          </div>
        </div>
      );
    default:
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
          <span className="text-lg">🔧</span>
        </div>
      );
}
};

const CategoryCards: React.FC<CategoryCardsProps> = ({ tools, activeCategoria, onCategoryClick }) => {
  const { isEditor } = useAuth();
  const queryClient = useQueryClient();
  const { data: categories = [] } = useQuery({ 
    queryKey: ['categories'], 
    queryFn: fetchCategories,
    staleTime: 300000,
    refetchOnWindowFocus: false
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Merge DB categories with hardcoded fallback
  const displayCategories = categories.length > 0
    ? categories
    : CATEGORIAS.map((c, i) => ({ id: c.nome, name: c.nome, icon_url: null, ordem: i, created_at: '' }));

  const handleSaveName = async (cat: Category) => {
    try {
      await updateCategory(cat.id, { name: editName });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditingId(null);
      toast({ description: 'Categoria atualizada' });
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
  };

  const handleIconUpload = async (cat: Category, file: File) => {
    try {
      const url = await uploadCategoryIcon(cat.id, file);
      await updateCategory(cat.id, { icon_url: url });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ description: 'Ícone atualizado' });
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
  };

  const [isHovered, setIsHovered] = useState(false);

  const renderCard = (cat: typeof displayCategories[0], idx: number) => {
    const count = tools.filter(t => t.categoria === cat.name).length;
    const isActive = activeCategoria === cat.name;
    const isEditing = editingId === cat.id;
    const totalCount = displayCategories.length;
    const cardIndex = idx % totalCount;
    // Only even-indexed cards pulse (pulse one, skip one)
    const shouldPulse = cardIndex % 2 === 0;
    const pulseSlot = Math.floor(cardIndex / 2);
    const pulsingCount = Math.ceil(totalCount / 2);
    const pulseDuration = pulsingCount * 0.8;
    return (
      <button
        key={`${cat.id}-${idx}`}
        onClick={() => !isEditing && onCategoryClick(cat.name)}
        className={`group rounded-2xl border p-3 text-left transition-colors duration-200 relative flex-shrink-0 w-[150px] will-change-transform ${isActive ? 'ring-2 ring-primary' : ''}`}
        style={{
          background: isActive ? 'hsl(210 100% 60% / 0.08)' : 'hsl(0 0% 100% / 0.03)',
          borderColor: isActive ? 'hsl(210 100% 60% / 0.3)' : 'hsl(0 0% 100% / 0.08)',
          animation: shouldPulse && !isHovered ? `category-pulse ${pulseDuration}s ease-in-out infinite` : 'none',
          animationDelay: shouldPulse ? `${pulseSlot * 0.8}s` : undefined,
        }}
      >
        <div className="mb-3 flex items-center gap-2">
          <CategoryIcon categoria={cat.name} iconUrl={cat.icon_url} />
          {isEditor && !isEditing && (
            <label className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={(e) => e.stopPropagation()}>
              <Upload className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleIconUpload(cat as Category, e.target.files[0]); }} />
            </label>
          )}
        </div>
        {isEditing ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <input value={editName} onChange={(e) => setEditName(e.target.value)} className="text-sm font-medium bg-secondary/60 border border-border/80 rounded px-1 py-0.5 text-foreground w-full" autoFocus />
            <button onClick={() => handleSaveName(cat as Category)} className="text-primary"><Check className="h-3.5 w-3.5" /></button>
            <button onClick={() => setEditingId(null)} className="text-muted-foreground"><X className="h-3.5 w-3.5" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <p className="text-sm font-medium text-foreground mb-0.5 truncate">{cat.name}</p>
            {isEditor && (
              <button onClick={(e) => { e.stopPropagation(); setEditingId(cat.id); setEditName(cat.name); }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Pencil className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground">{count} {count === 1 ? 'ferramenta' : 'ferramentas'}</p>
      </button>
    );
  };

  return (
    <div
      className="overflow-hidden pb-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="flex gap-3 w-max will-change-transform"
        style={{
          animation: 'category-marquee 30s linear infinite',
          animationPlayState: isHovered ? 'paused' : 'running',
        }}
      >
        {displayCategories.map((cat, i) => renderCard(cat, i))}
        {displayCategories.map((cat, i) => renderCard(cat, i + displayCategories.length))}
      </div>
    </div>
  );
};

export default CategoryCards;

import React from 'react';
import { Search } from 'lucide-react';
import type { Department } from '@/lib/departments';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ToolbarProps {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusChange: (v: string) => void;
  setorFilter: string;
  onSetorChange: (v: string) => void;
  departments?: Department[];
  isSmartSearching?: boolean;
}

const chipClass = "h-9 rounded-[20px] text-[13px] px-3 border outline-none transition-colors";
const chipStyle = { background: 'hsl(0 0% 100% / 0.05)', borderColor: 'hsl(0 0% 100% / 0.08)', color: 'hsl(0 0% 75%)' };

const Toolbar: React.FC<ToolbarProps> = ({ search, onSearchChange, setorFilter, onSetorChange, departments = [], isSmartSearching }) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${isSmartSearching ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar ou descrever o que precisa..."
          className={`${chipClass} w-full pl-9`}
          style={chipStyle}
        />
        {isSmartSearching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] uppercase tracking-wider font-semibold text-primary/70">IA</span>
        )}
      </div>

      <Select value={setorFilter || '_all'} onValueChange={(v) => onSetorChange(v === '_all' ? '' : v)}>
        <SelectTrigger className="h-9 rounded-[20px] text-[13px] px-3 max-w-[240px] border bg-secondary/50 border-border text-foreground">
          <SelectValue placeholder="Todas as ferramentas" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          <SelectItem value="_all">Todas as ferramentas</SelectItem>
          {departments.map((d) => (
            <SelectItem key={d.id} value={d.name}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default Toolbar;


import React from "react";
import { useWorkflowTheme } from "@/contexts/WorkflowThemeContext";
import { AppThemeMode } from "@/types/theme";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Palette, Sun, Moon, Sparkles } from "lucide-react";

export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useWorkflowTheme();

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Tema
      </span>
      <Select
        value={theme}
        onValueChange={(value) => setTheme(value as AppThemeMode)}
      >
        <SelectTrigger className="w-[130px] h-8 text-xs">
          <SelectValue placeholder="Selecione o tema" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="claro" className="text-xs">
            <div className="flex items-center gap-2">
              <Sun className="h-3 w-3" />
              <span>Claro</span>
            </div>
          </SelectItem>
          <SelectItem value="escuro" className="text-xs">
            <div className="flex items-center gap-2">
              <Moon className="h-3 w-3" />
              <span>Escuro</span>
            </div>
          </SelectItem>
          <SelectItem value="colorido" className="text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3 w-3" />
              <span>Colorido</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

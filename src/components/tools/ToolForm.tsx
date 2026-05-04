import React from 'react';
import { ToolExportData } from '@/types/tool';

interface ToolFormProps {
  data: Partial<ToolExportData>;
  onChange: (data: Partial<ToolExportData>) => void;
  isEditor?: boolean;
}

/**
 * This component is intended to be a centralized form for the tool entity.
 * In the current implementation, the state is managed in ConfigDrawer.tsx.
 * This file serves as the consolidated structure for the tool form fields.
 */
export const ToolForm: React.FC<ToolFormProps> = ({ data, onChange, isEditor }) => {
  // This is a placeholder for the consolidated form logic.
  // The actual fields are currently in ConfigDrawer.tsx.
  return (
    <div className="space-y-4">
      {/* Form fields would go here, bound to data and calling onChange */}
      <p className="text-sm text-muted-foreground">O formulário de ferramenta está sendo gerenciado de forma consolidada para exportação.</p>
    </div>
  );
};

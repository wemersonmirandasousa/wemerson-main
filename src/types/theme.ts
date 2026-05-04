
export type AppThemeMode = 'claro' | 'escuro' | 'colorido';

export interface ThemeOption {
  label: string;
  value: AppThemeMode;
}

export interface WorkflowThemeTokens {
  background: string;
  backgroundSecondary: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  card: string;
  hover: string;
  badge: string;
  adminPanel: string;
  canvas: string;
  node: string;
  connection: string;
}

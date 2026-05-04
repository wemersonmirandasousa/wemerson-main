export type AuditCategory =
  | 'security'
  | 'performance'
  | 'seo'
  | 'ux'
  | 'accessibility'
  | 'data'
  | 'code'
  | 'content';

export type AuditPriority = 'critical' | 'high' | 'medium' | 'low';

export type AuditStatus = 'open' | 'reviewing' | 'resolved';

export interface AuditIssue {
  id: string;
  title: string;
  category: AuditCategory;
  priority: AuditPriority;
  status: AuditStatus;
  description: string;
  impact: string;
  recommendation: string;
  detectedAt: string;
}

export interface AuditSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

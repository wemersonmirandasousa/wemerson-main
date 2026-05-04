import React from 'react';
import { Badge } from '@/components/ui/badge';
import { AuditPriority } from '@/types/audit';

interface AuditPriorityBadgeProps {
  priority: AuditPriority;
}

export const AuditPriorityBadge: React.FC<AuditPriorityBadgeProps> = ({ priority }) => {
  const variants: Record<AuditPriority, "destructive" | "warning" | "secondary" | "outline"> = {
    critical: "destructive",
    high: "warning",
    medium: "secondary",
    low: "outline",
  };

  const labels: Record<AuditPriority, string> = {
    critical: "Crítico",
    high: "Alta",
    medium: "Média",
    low: "Baixa",
  };

  return (
    <Badge variant={variants[priority]}>
      {labels[priority]}
    </Badge>
  );
};

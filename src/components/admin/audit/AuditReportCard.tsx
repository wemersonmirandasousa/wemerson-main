import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuditIssue } from '@/types/audit';
import { AuditPriorityBadge } from './AuditPriorityBadge';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface AuditReportCardProps {
  issue: AuditIssue;
}

export const AuditReportCard: React.FC<AuditReportCardProps> = ({ issue }) => {
  const getStatusIcon = () => {
    switch (issue.status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'reviewing': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'resolved': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    }
  };

  const categoryLabels: Record<string, string> = {
    security: 'Segurança',
    performance: 'Performance',
    seo: 'SEO',
    ux: 'UX',
    accessibility: 'Acessibilidade',
    data: 'Dados',
    code: 'Código',
    content: 'Conteúdo',
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <AuditPriorityBadge priority={issue.priority} />
              <Badge variant="outline" className="capitalize">
                {categoryLabels[issue.category] || issue.category}
              </Badge>
            </div>
            <CardTitle className="text-lg mt-2">{issue.title}</CardTitle>
          </div>
          <div title={`Status: ${issue.status}`}>
            {getStatusIcon()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">{issue.description}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t text-sm">
          <div>
            <span className="font-semibold block mb-1">Impacto:</span>
            <span className="text-muted-foreground">{issue.impact}</span>
          </div>
          <div>
            <span className="font-semibold block mb-1">Sugestão:</span>
            <span className="text-muted-foreground">{issue.recommendation}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
          <Calendar className="w-3 h-3" />
          <span>Detectado em: {new Date(issue.detectedAt).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
};

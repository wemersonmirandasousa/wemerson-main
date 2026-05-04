import React from 'react';
import { useSiteAudit } from '@/hooks/useSiteAudit';
import { AuditReportCard } from './AuditReportCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  BarChart3, 
  Search, 
  RefreshCw,
  Trash2
} from 'lucide-react';

export const AuditDashboard: React.FC = () => {
  const { loading, issues, summary, runAudit, clearAudit, error } = useSiteAudit();

  const handleRunAudit = () => {
    console.log('[AuditDashboard:runAudit]', { timestamp: new Date().toISOString() });
    runAudit();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Auditoria do Site</h1>
          <p className="text-muted-foreground mt-1">
            Identifique riscos, falhas, inconsistências e oportunidades de melhoria.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {issues.length > 0 && (
            <Button variant="outline" onClick={clearAudit} disabled={loading} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Limpar
            </Button>
          )}
          <Button onClick={handleRunAudit} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Executando...' : 'Executar Auditoria'}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-sm font-medium text-destructive">Erro na Auditoria</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">

        <SummaryCard 
          title="Total" 
          value={summary.total} 
          icon={<Search className="w-5 h-5 text-blue-500" />} 
          loading={loading}
        />
        <SummaryCard 
          title="Críticos" 
          value={summary.critical} 
          icon={<ShieldAlert className="w-5 h-5 text-destructive" />} 
          loading={loading}
        />
        <SummaryCard 
          title="Alta Prioridade" 
          value={summary.high} 
          icon={<AlertTriangle className="w-5 h-5 text-orange-500" />} 
          loading={loading}
        />
        <SummaryCard 
          title="Média Prioridade" 
          value={summary.medium} 
          icon={<BarChart3 className="w-5 h-5 text-yellow-500" />} 
          loading={loading}
        />
        <SummaryCard 
          title="Baixa Prioridade" 
          value={summary.low} 
          icon={<CheckCircle className="w-5 h-5 text-green-500" />} 
          loading={loading}
        />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Relatório de Itens</h2>
          {issues.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {issues.length} problemas detectados
            </span>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : issues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {issues
              .sort((a, b) => {
                const priorityMap = { critical: 0, high: 1, medium: 2, low: 3 };
                return priorityMap[a.priority] - priorityMap[b.priority];
              })
              .map((issue) => (
                <AuditReportCard key={issue.id} issue={issue} />
              ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="bg-muted p-4 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Nenhum problema encontrado</h3>
              <p className="text-muted-foreground max-w-xs mx-auto mt-2">
                Execute uma nova auditoria para verificar a integridade e qualidade do site.
              </p>
              <Button variant="outline" onClick={handleRunAudit} className="mt-6">
                Iniciar Auditoria
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

interface SummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  loading?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, loading }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-8 w-12" />
      ) : (
        <div className="text-2xl font-bold">{value}</div>
      )}
    </CardContent>
  </Card>
);

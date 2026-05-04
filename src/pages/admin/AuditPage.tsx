import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuditDashboard } from '@/components/admin/audit/AuditDashboard';
import { ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const AuditPage: React.FC = () => {
  const { user, role, isEditor, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se não estiver autenticado, redireciona para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Se for autenticado mas não tiver role (não é admin/editor/readonly), 
  // assume que deve voltar para a página inicial ou admin básico
  if (!role) {
    return <Navigate to="/" replace />;
  }

  // Se não for editor (canEdit === false), exibe mensagem de permissão
  if (!isEditor) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="max-w-md mx-auto border-destructive/20 shadow-lg">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <div className="bg-destructive/10 p-4 rounded-full mb-4">
              <ShieldAlert className="w-12 h-12 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground mb-6">
              Você não tem permissão para acessar a auditoria do site. Esta funcionalidade é exclusiva para administradores com permissão de edição.
            </p>
            <Button asChild variant="outline">
              <Link to="/">Voltar para Início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <AuditDashboard />
    </div>
  );
};

export default AuditPage;

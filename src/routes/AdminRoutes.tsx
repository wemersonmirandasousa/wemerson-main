import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { WorkflowAdminPanel } from '@/components/workflows/workflow-admin-panel';
import AuditPage from '@/pages/admin/AuditPage';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export const AdminRoutes: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se não estiver autenticado, vai para login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AdminLayout>
      <Routes>
        <Route path="fluxos" element={<WorkflowAdminPanel />} />
        <Route path="audit" element={<AuditPage />} />
        {/* Redireciona /admin para /admin/fluxos por padrão */}
        <Route path="/" element={<Navigate to="fluxos" replace />} />
      </Routes>
    </AdminLayout>
  );
};


import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { WorkflowThemeProvider } from "@/contexts/WorkflowThemeContext";
import Biblioteca from "./pages/Biblioteca";
import PostarFerramenta from "./pages/PostarFerramenta";
import EmpresaPage from "./pages/EmpresaPage";
import SystemAnalysis from "./pages/SystemAnalysis";
import Login from "./pages/Login";
import AuditPage from "./pages/admin/AuditPage";
import { AdminRoutes } from "./routes/AdminRoutes";
import NotFound from "./pages/NotFound";
// Removed DemoPage import
import { useEffect } from "react";
import { sendSiteVisitAudit } from "@/lib/audit";
import { WorkflowAdminPanel } from "./components/workflows/workflow-admin-panel";

import { WorkflowBuilder } from "./components/workflows/workflow-builder";

const queryClient = new QueryClient();

function SiteVisitTracker() {
  useEffect(() => {
    sendSiteVisitAudit();
  }, []);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <AuthProvider>
          <WorkflowThemeProvider>
            <SiteVisitTracker />
            <Routes>
              <Route path="/" element={<Biblioteca />} />
              <Route path="/biblioteca" element={<Biblioteca />} />
              <Route path="/login" element={<Login />} />
              <Route path="/postar" element={<PostarFerramenta />} />
              <Route path="/empresa/:slug" element={<EmpresaPage />} />
              <Route path="/sistema" element={<SystemAnalysis />} />
              {/* Route /demo removed */}
              <Route path="/fluxos" element={<WorkflowBuilder />} />
              <Route path="/admin/*" element={<AdminRoutes />} />
              <Route path="*" element={<NotFound />} />
            </Routes>

          </WorkflowThemeProvider>
        </AuthProvider>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

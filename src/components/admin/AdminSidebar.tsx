import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Activity, 
  ShieldCheck, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileSearch
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export const AdminSidebar: React.FC = () => {
  const { signOut, isEditor } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      path: '/admin/fluxos',
      roles: ['editor', 'readonly']
    },
    { 
      label: 'Auditoria', 
      icon: FileSearch, 
      path: '/admin/audit',
      roles: ['editor'] // Apenas editor
    },
    { 
      label: 'Atividade', 
      icon: Activity, 
      path: '/admin/atividade',
      roles: ['editor', 'readonly']
    },
    { 
      label: 'Segurança', 
      icon: ShieldCheck, 
      path: '/admin/seguranca',
      roles: ['editor']
    },
    { 
      label: 'Configurações', 
      icon: Settings, 
      path: '/admin/config',
      roles: ['editor']
    },
  ];

  return (
    <aside 
      className={cn(
        "flex flex-col h-screen bg-card border-r border-border transition-all duration-300 z-50 sticky top-0",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className="p-6 flex items-center justify-between">
        {!collapsed && (
          <span className="font-bold text-xl tracking-tight text-primary">Admin Panel</span>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 ml-auto"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          // Check role permission
          if (item.roles.includes('editor') && !isEditor) return null;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", collapsed ? "mx-auto" : "")} />
              {!collapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-md border z-[100]">
                  {item.label}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <Button 
          variant="ghost" 
          className={cn(
            "w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
            collapsed ? "px-3" : "px-4"
          )}
          onClick={signOut}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="ml-3">Sair</span>}
        </Button>
      </div>
    </aside>
  );
};

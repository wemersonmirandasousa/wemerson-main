import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchTools, fetchCompanies, uploadCompanyWallpaper, updateTool, fetchToolsWithExtraStructure } from '@/lib/api';
import { fetchDepartments } from '@/lib/departments';
import { useAuth } from '@/contexts/AuthContext';
import { CATEGORIAS } from '@/types/tool';
import { ArrowLeft, Search, Lock, ArrowUp, ImageIcon, Download, FileText } from 'lucide-react';
import { exportSystemData } from '@/utils/exportSystem';
import { handleExportXlsx, handleExportTxtConsolidated } from '@/utils/exportUtils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from
'@/components/ui/dropdown-menu';
import type { Tool } from '@/types/tool';
import CompanyPasswordDialog from '@/components/CompanyPasswordDialog';
import ToolCard from '@/components/ToolCard';
import ConfigDrawer from '@/components/ConfigDrawer';
import CategoryCards from '@/components/CategoryCards';
import FloatingActionButton from '@/components/FloatingActionButton';
import FloatingLeftMenu from '@/components/FloatingLeftMenu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const EmpresaPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, isEditor } = useAuth();

  const [search, setSearch] = useState('');
  const [setorFilter, setSetorFilter] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [drawerTool, setDrawerTool] = useState<Tool | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'configurar' | 'processo'>('configurar');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Track scroll
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { data: companies = [] } = useQuery({ queryKey: ['companies'], queryFn: fetchCompanies });
  const { data: tools = [], isLoading, refetch } = useQuery({ queryKey: ['tools'], queryFn: fetchTools });
  const { data: departments = [] } = useQuery({ queryKey: ['departments'], queryFn: fetchDepartments });
  const { data: extraStructureIds = new Set<string>() } = useQuery({ queryKey: ['tools-extra-structure'], queryFn: fetchToolsWithExtraStructure, staleTime: 60000 });

  const company = companies.find(c => c.slug === slug);
  const hasPassword = !!(company as any)?.access_password;

  // Check session access
  useEffect(() => {
    if (company && hasPassword) {
      const sessionAccess = sessionStorage.getItem(`company_access_${slug}`);
      if (sessionAccess === 'true') {
        setAuthenticated(true);
      } else {
        setShowPasswordDialog(true);
      }
    } else if (company) {
      setAuthenticated(true);
    }
  }, [company, hasPassword, slug]);

  const companyTools = useMemo(() => {
    if (!company) return [];
    return tools.filter(t => {
      if ((t as any).empresa_id !== company.id) return false;
      if (search && !t.titulo.toLowerCase().includes(search.toLowerCase())) return false;
      if (setorFilter && t.setores !== setorFilter) return false;
      if (categoriaFilter && t.categoria !== categoriaFilter) return false;
      return true;
    });
  }, [tools, company, search, setorFilter, categoriaFilter]);

  const availableSetores = useMemo(() => {
    if (!company) return [];
    const setores = new Set<string>();
    tools.filter(t => (t as any).empresa_id === company.id && t.setores).forEach(t => setores.add(t.setores!));
    return Array.from(setores);
  }, [tools, company]);

  const handleOpenDrawer = (tool: Tool) => {
    // If not authenticated and password required, block structure access
    if (hasPassword && !authenticated && !isEditor) return;
    setDrawerTool(tool);
    setDrawerTab('configurar');
    setDrawerOpen(true);
  };

  const handleOpenWhatDoes = (tool: Tool) => {
    if (hasPassword && !authenticated && !isEditor) return;
    setDrawerTool(tool);
    setDrawerTab('processo');
    setDrawerOpen(true);
  };

  if (!company && !isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-lg text-muted-foreground">Empresa não encontrada</p>
        <button onClick={() => navigate('/')} className="text-sm text-primary hover:underline">← Voltar</button>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
      </div>
    );
  }

  // If password is required and not authenticated, show password dialog
  if (hasPassword && !authenticated) {
    return (
      <>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">Acesso protegido</p>
          <button onClick={() => navigate('/')} className="text-sm text-primary hover:underline">← Voltar</button>
        </div>
        <CompanyPasswordDialog
          open={showPasswordDialog}
          onOpenChange={(v) => { if (!v) navigate('/'); }}
          companyName={company.name}
          correctPassword={(company as any).access_password || ''}
          onSuccess={() => {
            sessionStorage.setItem(`company_access_${slug}`, 'true');
            setAuthenticated(true);
            setShowPasswordDialog(false);
          }}
        />
      </>
    );
  }

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0] || !company) return;
    try {
      const url = await uploadCompanyWallpaper(company.id, e.target.files[0]);
      await supabase.from('companies' as any).update({ wallpaper_url: url } as any).eq('id', company.id);
      toast({ description: 'Wallpaper atualizado' });
      window.location.reload();
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
  };

  const companyWallpaper = (company as any)?.wallpaper_url;

  return (
    <div className="min-h-screen bg-background relative">
      {/* Company wallpaper */}
      {companyWallpaper && (
        <div
          className="site-wallpaper"
          style={{ backgroundImage: `url(${companyWallpaper})` }}
        />
      )}
      <div className="border-b border-border/50 relative z-10">
        <div className="mx-auto flex max-w-[1400px] items-center px-8 py-3 gap-3">
          <button onClick={() => navigate('/')} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="flex-1" />
          {isEditor && (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium cursor-pointer transition-all hover:bg-accent" style={{ background: 'hsl(0 0% 100% / 0.06)', border: '1px solid hsl(0 0% 100% / 0.10)', color: 'hsl(0 0% 65%)' }}>
                  <Download className="h-3 w-3" /> Exportar
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleExportXlsx()}>
                    <FileText className="mr-2 h-4 w-4" /> Excel (.xlsx)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportTxtConsolidated(companyTools, company?.name)}>
                    <FileText className="mr-2 h-4 w-4" /> TXT Consolidado
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportSystemData(companyTools)}>
                    <FileText className="mr-2 h-4 w-4" /> JSON (Filtrado)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <label
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium cursor-pointer transition-all hover:bg-accent"
                style={{ background: 'hsl(0 0% 100% / 0.06)', border: '1px solid hsl(0 0% 100% / 0.10)', color: 'hsl(0 0% 65%)' }}
              >
                <ImageIcon className="h-3 w-3" />
                {companyWallpaper ? 'Trocar wallpaper' : 'Wallpaper'}
                <input type="file" accept="image/*" className="hidden" onChange={handleWallpaperUpload} />
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-8 py-8 space-y-8 relative z-10">
        {/* Hero */}
        <div className="flex flex-col items-center gap-4">
          {company.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="h-[80px] object-contain" />
          ) : (
            <div className="h-[80px] w-[200px] rounded-xl bg-secondary flex items-center justify-center">
              <span className="text-2xl font-bold text-foreground/60">{company.name}</span>
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs" style={{ background: 'hsl(0 0% 100% / 0.06)', border: '1px solid hsl(0 0% 100% / 0.10)', color: 'hsl(0 0% 70%)' }}>
            Setor de Desenvolvimento · {company.name}
          </div>
          <h1 className="text-[28px] font-bold text-foreground text-center">Ferramentas {company.name}</h1>
          <p className="text-sm text-muted-foreground text-center">Automações, GPTs e recursos para facilitar o dia a dia.</p>
        </div>

        {/* Category Cards — shared component */}
        <CategoryCards
          tools={tools.filter(t => (t as any).empresa_id === company.id)}
          activeCategoria={categoriaFilter}
          onCategoryClick={(cat) => setCategoriaFilter(categoriaFilter === cat ? '' : cat)}
        />

        {/* Search */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ferramenta..."
              className="h-9 rounded-[20px] text-[13px] px-3 pl-9 border outline-none transition-colors w-full"
              style={{ background: 'hsl(0 0% 100% / 0.05)', borderColor: 'hsl(0 0% 100% / 0.08)', color: 'hsl(0 0% 75%)' }}
            />
          </div>
        </div>

        {/* Setor filters */}
        {availableSetores.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setSetorFilter('')}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${!setorFilter ? 'border-primary text-primary' : ''}`}
              style={!setorFilter ? {} : { background: 'hsl(0 0% 100% / 0.05)', borderColor: 'hsl(0 0% 100% / 0.08)', color: 'hsl(0 0% 70%)' }}
            >
              Todas
            </button>
            {availableSetores.map(s => (
              <button
                key={s}
                onClick={() => setSetorFilter(setorFilter === s ? '' : s)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${setorFilter === s ? 'border-primary text-primary' : ''}`}
                style={setorFilter === s ? {} : { background: 'hsl(0 0% 100% / 0.05)', borderColor: 'hsl(0 0% 100% / 0.08)', color: 'hsl(0 0% 70%)' }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Active filter badges */}
        <div className="flex items-center justify-center gap-2">
          {categoriaFilter && (
            <button onClick={() => setCategoriaFilter('')} className="text-xs text-primary hover:underline">✕ {categoriaFilter}</button>
          )}
          {setorFilter && (
            <button onClick={() => setSetorFilter('')} className="text-xs text-primary hover:underline">✕ {setorFilter}</button>
          )}
        </div>

        {/* Tools grid — using ToolCard (same as main panel) */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
          </div>
        ) : companyTools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p className="text-lg">Nenhuma ferramenta encontrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
            {companyTools.map(tool => (
              <ToolCard
                key={tool.id}
                tool={tool}
                onOpenDrawer={handleOpenDrawer}
                onOpenWhatDoes={handleOpenWhatDoes}
                onUpdated={() => refetch()}
                hasExtraStructure={extraStructureIds.has(tool.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ConfigDrawer — same as main panel */}
      <ConfigDrawer
        tool={drawerTool}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdated={() => refetch()}
        onDeleted={() => refetch()}
        initialTab={drawerTab}
        companies={companies as any}
        departments={departments}
        onNavigateToTool={(t) => {
          setDrawerTool(t);
          setDrawerTab('configurar');
        }}
      />

      <FloatingActionButton hidden={drawerOpen} />
      <FloatingLeftMenu hidden={drawerOpen} />

      {/* Scroll-to-top arrow */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed left-6 bottom-6 z-40 flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110"
          style={{ background: 'hsl(0 0% 100% / 0.08)', border: '1px solid hsl(0 0% 100% / 0.12)', backdropFilter: 'blur(8px)' }}
          title="Voltar ao topo"
        >
          <ArrowUp className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
};

export default EmpresaPage;

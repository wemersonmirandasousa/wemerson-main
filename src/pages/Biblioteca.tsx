import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTools, createTool, bulkSoftDeleteTools, fetchCompanies, fetchToolAccessCounts, fetchWallpaper, uploadWallpaper, smartSearchTools, fetchToolsWithExtraStructure, fetchToolSearchIndex } from '@/lib/api';
import { fetchDepartments } from '@/lib/departments';
import type { Tool } from '@/types/tool';
import type { Company } from '@/components/CompanyFilter';
import ToolCard from '@/components/ToolCard';
import StatsCards from '@/components/StatsCards';
import Toolbar from '@/components/Toolbar';
import ConfigDrawer from '@/components/ConfigDrawer';
import SocialCards from '@/components/SocialCards';

import CategoryCards from '@/components/CategoryCards';
import LoginDialog from '@/components/LoginDialog';
import ImportPreviewDialog from '@/components/ImportPreviewDialog';
import ImportJsonDialog from '@/components/ImportJsonDialog';
import CompanyFilter from '@/components/CompanyFilter';
import CompanyManager from '@/components/CompanyManager';
import CompanyPasswordDialog from '@/components/CompanyPasswordDialog';
import DepartmentManager from '@/components/DepartmentManager';
import BulkActions from '@/components/BulkActions';
import FloatingActionButton from '@/components/FloatingActionButton';
import FloatingLeftMenu from '@/components/FloatingLeftMenu';
import ToolRecommendationPopup from '@/components/ToolRecommendationPopup';
import UserManagerPopup from '@/components/UserManagerPopup';
import WhatsAppConfigDialog from '@/components/WhatsAppConfigDialog';
import { Plus, LogOut, Upload, Download, LogIn, CheckSquare, XSquare, Trash2, RefreshCw, Building2, Rocket, FolderTree, ImageIcon, ArrowUp, Users, Settings2, FileText, Loader2, Bot, Archive, Code, MessageCircle } from 'lucide-react';
import ArchivedToolsDialog from '@/components/ArchivedToolsDialog';
import ExportButton from '@/components/ExportButton';
import { toast } from '@/hooks/use-toast';
import { exportSystemData } from '@/utils/exportSystem';
import { handleExportXlsx, handleExportTxtConsolidated } from '@/utils/exportUtils';
import logoWemerson from '@/assets/logo-wemerson.png';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from
'@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from
'@/components/ui/dropdown-menu';
import { downloadTxtTemplate, toolsToConsolidatedTxt } from '@/lib/txtTemplates';
import { CATEGORIAS } from '@/types/tool';
import * as XLSX from 'xlsx';

const Biblioteca: React.FC = () => {
  const { user, isEditor, signOut, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const bibliotecaRef = useRef<HTMLDivElement>(null);
  const socialCardsRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Track scroll for scroll-to-top arrow
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [search, setSearch] = useState('');
  const [smartSearchIds, setSmartSearchIds] = useState<string[] | null>(null);
  const [isSmartSearching, setIsSmartSearching] = useState(false);
  const smartSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [setorFilter, setSetorFilter] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'configurar' | 'processo'>('configurar');
  const [loginOpen, setLoginOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importJsonOpen, setImportJsonOpen] = useState(false);
  const [companyManagerOpen, setCompanyManagerOpen] = useState(false);
  const [departmentManagerOpen, setDepartmentManagerOpen] = useState(false);
  const [userManagerOpen, setUserManagerOpen] = useState(false);
  const [whatsappConfigOpen, setWhatsappConfigOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const [showSocialCards, setShowSocialCards] = useState(false);

  // Close social cards on click outside
  useEffect(() => {
    if (!showSocialCards) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking inside a dialog overlay or portal
      if (target.closest('[role="dialog"]') || target.closest('[data-radix-popper-content-wrapper]')) return;
      if (socialCardsRef.current && !socialCardsRef.current.contains(target)) {
        setShowSocialCards(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSocialCards]);

  // Company password gate
  const [passwordCompany, setPasswordCompany] = useState<Company | null>(null);

  // Selection mode
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Wallpaper
  const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(null);

  // Client recommendation popup
  const [showRecommendation, setShowRecommendation] = useState(false);
  const CLIENT_EMAIL = 'cliente43@tools.app';

  // Load wallpaper
  useEffect(() => {
    fetchWallpaper().then(url => setWallpaperUrl(url)).catch(() => {});
  }, []);

  // Detect client login — show recommendation popup
  useEffect(() => {
    if (user?.email === CLIENT_EMAIL && !sessionStorage.getItem('wemerson_recommendation_shown')) {
      setShowRecommendation(true);
    }
  }, [user]);

  const { data: tools = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['tools'],
    queryFn: fetchTools,
    retry: 2,
    staleTime: 300000,
    refetchOnWindowFocus: false
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: fetchCompanies,
    staleTime: 300000,
    refetchOnWindowFocus: false
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: fetchDepartments,
    staleTime: 300000,
    refetchOnWindowFocus: false
  });

  const { data: accessCounts = {} } = useQuery({
    queryKey: ['tool-access-counts'],
    queryFn: fetchToolAccessCounts,
    staleTime: 300000,
    refetchOnWindowFocus: false
  });

  const { data: extraStructureIds = new Set<string>() } = useQuery({
    queryKey: ['tools-extra-structure'],
    queryFn: fetchToolsWithExtraStructure,
    staleTime: 300000,
    refetchOnWindowFocus: false
  });

  // Deep search index: tool blocks, knowledge files, credentials prompts
  // Only enabled when user starts searching to speed up initial load
  const { data: searchIndex = {} } = useQuery({
    queryKey: ['tool-search-index'],
    queryFn: fetchToolSearchIndex,
    staleTime: 300000,
    enabled: search.trim().length > 0
  });

  // Smart search: trigger when 3+ words and no direct title match
  useEffect(() => {
    if (smartSearchTimer.current) clearTimeout(smartSearchTimer.current);
    const words = search.trim().split(/\s+/);
    const q = search.toLowerCase();
    const hasDirectMatch = tools.some(t => {
      const mainFields = [t.titulo, t.descricao, t.funcao, t.instrucoes, t.setores, t.categoria].filter(Boolean).join(' ').toLowerCase();
      const tagsText = (t.tags || []).join(' ').toLowerCase();
      const extraText = (searchIndex[t.id] || '').toLowerCase();
      return mainFields.includes(q) || tagsText.includes(q) || extraText.includes(q);
    });
    if (words.length >= 3 && !hasDirectMatch && search.trim().length > 5) {
      setIsSmartSearching(true);
      smartSearchTimer.current = setTimeout(async () => {
        try {
          const compact = tools.map(t => ({ id: t.id, titulo: t.titulo, funcao: t.funcao || null, descricao: t.descricao || null }));
          const results = await smartSearchTools(search.trim(), compact);
          if (Array.isArray(results)) {
            setSmartSearchIds(results.map(r => r.id));
          } else {
            setSmartSearchIds(null);
          }

        } catch {
          setSmartSearchIds(null);
        }
        setIsSmartSearching(false);
      }, 800);
    } else {
      setSmartSearchIds(null);
      setIsSmartSearching(false);
    }
    return () => { if (smartSearchTimer.current) clearTimeout(smartSearchTimer.current); };
  }, [search, tools, searchIndex]);

  // Memoized searchable tools to avoid joining strings on every keystroke
  const searchableTools = useMemo(() => {
    return tools.map(t => {
      const mainFields = [
        t.titulo, t.descricao, t.funcao, t.instrucoes,
        t.setores, t.categoria, t.modelo_recomendado,
      ].filter(Boolean).join(' ').toLowerCase();
      const tagsText = (t.tags || []).join(' ').toLowerCase();
      return { ...t, _searchable: mainFields, _tagsSearchable: tagsText };
    });
  }, [tools]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = searchableTools.filter((t) => {
      if (smartSearchIds) return smartSearchIds.includes(t.id);
      if (q) {
        const extraText = (searchIndex[t.id] || '').toLowerCase();
        if (!t._searchable.includes(q) && !t._tagsSearchable.includes(q) && !extraText.includes(q)) return false;
      }
      if (statusFilter && t.status !== statusFilter) return false;
      if (setorFilter && t.setores !== setorFilter) return false;
      if (categoriaFilter && t.categoria !== categoriaFilter) return false;
      if (companyFilter && (t as any).empresa_id !== companyFilter) return false;
      return true;
    });

    if (smartSearchIds) {
      return result.sort((a, b) => smartSearchIds.indexOf(a.id) - smartSearchIds.indexOf(b.id));
    }
    return result.sort((a, b) => {
      const aOutdated = a.status === 'outdated' ? 1 : 0;
      const bOutdated = b.status === 'outdated' ? 1 : 0;
      if (aOutdated !== bOutdated) return aOutdated - bOutdated;
      return new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime();
    });
  }, [searchableTools, search, statusFilter, setorFilter, categoriaFilter, companyFilter, smartSearchIds, searchIndex]);


  const handleNewTool = async () => {
    if (!user) return;
    try {
      const tool = await createTool({ titulo: 'Nova Ferramenta', status: 'draft' }, user.id);
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      setSelectedTool(tool);
      setDrawerTab('configurar');
      setDrawerOpen(true);
      toast({ description: 'Ferramenta criada' });
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
  };

  const handleOpenDrawer = (tool: Tool) => {
    setSelectedTool(tool);
    setDrawerTab('configurar');
    setDrawerOpen(true);
  };

  const handleOpenWhatDoes = (tool: Tool) => {
    setSelectedTool(tool);
    setDrawerTab('processo');
    setDrawerOpen(true);
  };

  const handleCategoryClick = (categoria: string) => {
    setCategoriaFilter((prev) => prev === categoria ? '' : categoria);
    bibliotecaRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Export utilities are now imported from @/utils/exportUtils
  const onExportTxt = () => handleExportTxtConsolidated(tools);
  const onExportXlsx = () => handleExportXlsx();

  const handleGenerateTemplate = (categoriaName: string) => {
    const cat = CATEGORIAS.find((c) => c.nome === categoriaName);
    if (!cat) return;

    const colsMap: Record<string, string[]> = {
      GPT: ['EMPRESA', 'CATEGORIA', 'SETOR / DEPARTAMENTO', 'NOME', 'FUNÇÃO', 'INSTRUÇÕES', 'LINK DE CONTEXTO COM PROMPT FINAL', 'LINK DO GPT DE CRIAÇÃO DO PROMPT', 'LINK DO CONTEXTO DE TRANSFORMAÇÃO DA BASE DE CONHECIMENTO', 'LINK DO GPT PARA CONVERSÃO DE BASE DE CONHECIMENTO', 'ARQUIVOS BASE DE CONHECIMENTO', 'LINK DA FERRAMENTA', 'PROMPT', 'MODELO RECOMENDADO', 'ITENS MARCADOS NO GPT', 'AÇÕES'],
      Sistema: ['EMPRESA', 'CATEGORIA', 'SETOR / DEPARTAMENTO', 'NOME', 'EMAIL', 'SENHA', 'LINK DA FERRAMENTA', 'GERADOR', 'LINK DE CONTEXTO COM PROMPT', 'FUNÇÃO', 'LINK DO GPT USADO', 'PROMPT', 'AÇÕES'],
      Automação: ['EMPRESA', 'CATEGORIA', 'SETOR / DEPARTAMENTO', 'NOME', 'EMAIL', 'SENHA', 'LINK DO BLUEPRINT', 'PROMPT 1', 'PROMPT 2', 'PROMPT 3', 'FUNÇÃO', 'LINK DO GPT USADO', 'AÇÕES'],
      Documento: ['EMPRESA', 'CATEGORIA', 'SETOR / DEPARTAMENTO', 'NOME', 'LINK DE ACESSO', 'AÇÕES'],
      Arte: ['EMPRESA', 'CATEGORIA', 'SETOR / DEPARTAMENTO', 'NOME', 'LINK DE ACESSO', 'AÇÕES'],
      Agentes: ['EMPRESA', 'CATEGORIA', 'SETOR / DEPARTAMENTO', 'NOME', 'FUNÇÃO', 'INSTRUÇÕES', 'LINK DE CONTEXTO COM PROMPT FINAL', 'LINK DO GPT DE CRIAÇÃO DO PROMPT', 'LINK DO CONTEXTO DE TRANSFORMAÇÃO DA BASE DE CONHECIMENTO', 'LINK DO GPT PARA CONVERSÃO DE BASE DE CONHECIMENTO', 'ARQUIVOS BASE DE CONHECIMENTO', 'LINK DA FERRAMENTA', 'PROMPT', 'MODELO RECOMENDADO', 'ITENS MARCADOS NO GPT', 'AÇÕES']
    };

    const cols = colsMap[categoriaName] || colsMap['GPT'];
    const ws = XLSX.utils.aoa_to_sheet([cols]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo');
    const xlsxBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([new Uint8Array(xlsxBuffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');a.href = url;a.download = `modelo_${categoriaName.toLowerCase()}.xlsx`;a.click();
    URL.revokeObjectURL(url);
    toast({ description: `Modelo ${categoriaName} gerado` });
  };

  const handleLogout = async () => {
    await signOut();
    toast({ description: 'Sessão encerrada' });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => setSelectedIds(new Set(filtered.map((t) => t.id)));
  const handleDeselectAll = () => setSelectedIds(new Set());

  const handleBulkDelete = async () => {
    if (!user || selectedIds.size === 0) return;
    try {
      await bulkSoftDeleteTools(Array.from(selectedIds), user.id);
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      setSelectedIds(new Set());
      setSelectionMode(false);
      setBulkDeleteOpen(false);
      toast({ description: `${selectedIds.size} ferramenta(s) excluída(s)` });
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
  };

  const handleCompanyClick = (company: Company) => {
    if ((company as any).access_password) {
      setPasswordCompany(company);
    } else {
      navigate(`/empresa/${company.slug}`);
    }
  };

  const handlePasswordSuccess = () => {
    if (passwordCompany?.slug) {
      // Store session access
      sessionStorage.setItem(`company_access_${passwordCompany.slug}`, 'true');
      navigate(`/empresa/${passwordCompany.slug}`);
    }
    setPasswordCompany(null);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
      </div>);

  }

  const pillBtn = "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-medium transition-all hover:bg-accent";
  const pillStyle = { background: 'hsl(0 0% 100% / 0.06)', border: '1px solid hsl(0 0% 100% / 0.10)', color: 'hsl(0 0% 75%)' };

  const handleLogoClick = () => {
    setShowSocialCards(true);
  };

  const handleCloseSocialCards = () => {
    setShowSocialCards(false);
  };

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    try {
      const url = await uploadWallpaper(e.target.files[0], user.id);
      setWallpaperUrl(url);
      toast({ description: 'Wallpaper atualizado' });
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Wallpaper background */}
      {wallpaperUrl && (
        <div
          className="site-wallpaper"
          style={{ backgroundImage: `url(${wallpaperUrl})` }}
        />
      )}
      {/* Top bar */}
      <div className="border-b border-border/50 relative z-10">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-8 py-3">
          <span />
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.open('https://wa.me/message/CXZEURMC7SRMC1', '_blank')}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold transition-all hover:bg-accent"
              style={{ background: 'hsl(142 70% 50% / 0.12)', border: '1px solid hsl(142 70% 50% / 0.22)', color: 'hsl(142 70% 70%)' }}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              CONTATO
            </button>

            {isEditor && (
              <button
                onClick={() => navigate('/sistema')}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all hover:bg-accent"
                style={{ background: 'hsl(210 100% 60% / 0.1)', border: '1px solid hsl(210 100% 60% / 0.2)', color: 'hsl(210 100% 70%)' }}
              >
                <Code className="h-3 w-3" />
                Sistema
              </button>
            )}
            
            {user ?
            <div className="flex items-center gap-2 bg-secondary/30 rounded-full px-3 py-1 border border-border/50">
                <span className="text-[11px] text-muted-foreground font-medium">{user.email}</span>
                <button onClick={handleLogout} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive" title="Sair">
                  <LogOut className="h-4 w-4" />
                </button>
              </div> :

            <button
              onClick={() => setLoginOpen(true)}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-[14px] font-bold transition-all hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, hsl(var(--primary)), #22C55E)', color: '#fff', boxShadow: '0 4px 15px rgba(34,197,94,0.3)' }}>
              
                <LogIn className="h-4 w-4" /> LOGIN
              </button>
            }
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] px-8 py-6 space-y-8 relative z-10">
        {/* Logo / Social Cards toggle */}
        <div className="flex justify-center py-4 relative">
          {!showSocialCards && (
            <button onClick={handleLogoClick} className="logo-hover focus:outline-none" title="Abrir cards">
              <img src={logoWemerson} alt="Wemerson Soluções Tecnológicas" className="w-[440px] md:w-[540px] lg:w-[640px] h-auto" />
            </button>
          )}
          <div ref={socialCardsRef} className="flex flex-col items-center gap-3">
            <SocialCards visible={showSocialCards} onClose={handleCloseSocialCards} />
            {showSocialCards && isEditor && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.open('https://contasw.lovable.app', '_blank')}
                  className="flex items-center justify-center h-10 w-10 rounded-xl transition-all hover:scale-110"
                  style={{ background: '#EAB308', border: '1px solid rgba(0,0,0,0.1)', color: '#000' }}
                  title="Acessar ContasW"
                  aria-label="Abrir ContasW"
                >
                  <Bot className="h-5 w-5" />
                </button>
                <ExportButton tools={tools} />
                <button
                  onClick={() => window.open('https://apiw.lovable.app', '_blank')}
                  className="flex items-center justify-center h-10 w-10 rounded-xl transition-all hover:scale-110"
                  style={{ background: '#EF4444', border: '1px solid rgba(0,0,0,0.1)', color: '#fff' }}
                  title="Acessar APIW"
                  aria-label="Abrir APIW"
                >
                  <FileText className="h-5 w-5" />
                </button>
                <button
                  onClick={() => window.open('https://automacoesw.lovable.app/', '_blank')}
                  className="flex items-center justify-center h-10 w-10 rounded-xl transition-all hover:scale-110"
                  style={{ background: '#A855F7', border: '1px solid rgba(0,0,0,0.1)', color: '#fff' }}
                  title="Acessar Automações"
                  aria-label="Abrir AutomaçõesW"
                >
                  <Rocket className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1.5">
          <h1 className="text-[28px] font-bold text-foreground">Desenvolvimentos</h1>
          <p className="text-sm text-muted-foreground">Conversa direta para projetos e automações. Entre em contato.</p>
        </div>

        {/* Category Cards — as filters */}
        <CategoryCards tools={tools} activeCategoria={categoriaFilter} onCategoryClick={handleCategoryClick} />

        {/* Company Filter */}
        <CompanyFilter companies={companies} selectedId={companyFilter} onSelect={setCompanyFilter} onCompanyClick={handleCompanyClick} />

        {/* Biblioteca Section */}
        <div ref={bibliotecaRef} className="space-y-5">
          <div className="flex flex-col items-center gap-6">
            {isEditor && (
              <div className="text-center space-y-3">
                <h2 className="text-[14px] font-bold text-foreground/70 uppercase tracking-widest">Criação de ferramentas</h2>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {!selectionMode ? (
                    <>
                      <button onClick={() => setSelectionMode(true)} className={pillBtn} style={pillStyle}><CheckSquare className="h-3.5 w-3.5" /> Selecionar</button>
                      <button onClick={() => setCompanyManagerOpen(true)} className={pillBtn} style={pillStyle}><Building2 className="h-3.5 w-3.5" /> Empresas</button>
                      <button onClick={() => setDepartmentManagerOpen(true)} className={pillBtn} style={pillStyle}><FolderTree className="h-3.5 w-3.5" /> Departamentos</button>
                      <button onClick={() => setUserManagerOpen(true)} className={pillBtn} style={pillStyle}><Users className="h-3.5 w-3.5" /> Usuarios</button>
                      <button onClick={() => setImportJsonOpen(true)} className={pillBtn} style={{ background: '#22C55E', color: '#fff', border: 'none', boxShadow: '0 2px 8px rgba(34,197,94,0.3)' }}>
                        <FileText className="h-3.5 w-3.5" /> Importar JSON
                      </button>
                      <button onClick={handleNewTool} className={pillBtn} style={{ background: 'hsl(0 0% 100% / 0.1)', border: '1px solid hsl(0 0% 100% / 0.15)', color: '#fff' }}>
                        <Plus className="h-4 w-4" /> Adicionar
                      </button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger className={pillBtn} style={pillStyle}>
                          <Download className="h-3.5 w-3.5" /> Exportar
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleExportXlsx()}>
                            <FileText className="mr-2 h-4 w-4" /> Excel (.xlsx)
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportTxtConsolidated(tools)}>
                            <FileText className="mr-2 h-4 w-4" /> TXT Consolidado
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportSystemData(tools)}>
                            <FileText className="mr-2 h-4 w-4" /> JSON (Completo)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <button onClick={() => setWhatsappConfigOpen(true)} className={pillBtn} style={pillStyle}><Settings2 className="h-3.5 w-3.5" /> API WhatsApp</button>
                      <button onClick={() => setArchivedOpen(true)} className={pillBtn} style={{ background: 'hsl(38 92% 50% / 0.10)', border: '1px solid hsl(38 92% 50% / 0.22)', color: 'hsl(38 92% 65%)' }}>
                        <Archive className="h-3.5 w-3.5" /> Arquivadas
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={handleSelectAll} className={pillBtn} style={pillStyle}><CheckSquare className="h-3.5 w-3.5" /> Todas</button>
                      <button onClick={handleDeselectAll} className={pillBtn} style={pillStyle}><XSquare className="h-3.5 w-3.5" /> Desmarcar</button>
                      {selectedIds.size > 0 && <BulkActions selectedIds={selectedIds} tools={tools} companies={companies} departments={departments} userId={user!.id} onUpdated={() => queryClient.invalidateQueries({ queryKey: ['tools'] })} />}
                      {selectedIds.size > 0 &&
                        <button onClick={() => setBulkDeleteOpen(true)} className={pillBtn} style={{ background: 'hsl(0 72% 55% / 0.15)', border: '1px solid hsl(0 72% 55% / 0.3)', color: 'hsl(0 72% 55%)' }}>
                          <Trash2 className="h-3.5 w-3.5" /> Excluir ({selectedIds.size})
                        </button>
                      }
                      <button onClick={() => {setSelectionMode(false);setSelectedIds(new Set());}} className={pillBtn} style={pillStyle}>Cancelar</button>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              {categoriaFilter && <button onClick={() => setCategoriaFilter('')} className="text-xs text-primary hover:underline">✕ {categoriaFilter}</button>}
              {companyFilter && <button onClick={() => setCompanyFilter(null)} className="text-xs text-primary hover:underline">✕ Empresa</button>}
            </div>
          </div>

          {/* Toolbar */}
          <Toolbar search={search} onSearchChange={setSearch} statusFilter={statusFilter} onStatusChange={setStatusFilter} setorFilter={setorFilter} onSetorChange={setSetorFilter} departments={departments} isSmartSearching={isSmartSearching} />

          {/* Stats */}
          <StatsCards tools={tools} />

          {/* Grid */}
          {isLoading ?
          <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
            </div> :
          isError ?
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <p className="text-lg">Erro ao carregar ferramentas</p>
              <button onClick={() => refetch()} className={`${pillBtn} gap-2`} style={pillStyle}>
                <RefreshCw className="h-4 w-4" /> Tentar novamente
              </button>
            </div> :
          filtered.length === 0 ?
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <p className="text-lg">Nenhuma ferramenta encontrada</p>
              <p className="text-sm">Tente ajustar os filtros ou crie uma nova ferramenta</p>
            </div> :

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
              {filtered.map((tool) =>
            <ToolCard
              key={tool.id}
              tool={tool}
              onOpenDrawer={handleOpenDrawer}
              onOpenWhatDoes={handleOpenWhatDoes}
              selectionMode={selectionMode}
              isSelected={selectedIds.has(tool.id)}
              onToggleSelect={toggleSelect}
              onUpdated={() => queryClient.invalidateQueries({ queryKey: ['tools'] })}
              hasExtraStructure={extraStructureIds.has(tool.id)} />

            )}
            </div>
          }
        </div>
      </div>

      <ConfigDrawer
        tool={selectedTool}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onUpdated={() => queryClient.invalidateQueries({ queryKey: ['tools'] })}
        onDeleted={() => queryClient.invalidateQueries({ queryKey: ['tools'] })}
        initialTab={drawerTab}
        companies={companies}
        departments={departments}
        onNavigateToTool={(t) => {
          setSelectedTool(t);
          setDrawerTab('configurar');
        }} />
      

      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />

      <ImportPreviewDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        existingTools={tools}
        onImportComplete={() => queryClient.invalidateQueries({ queryKey: ['tools'] })} />

      <ImportJsonDialog
        open={importJsonOpen}
        onOpenChange={setImportJsonOpen}
        onComplete={() => queryClient.invalidateQueries({ queryKey: ['tools'] })} />
      

      <CompanyManager
        open={companyManagerOpen}
        onOpenChange={setCompanyManagerOpen}
        companies={companies}
        onUpdated={() => queryClient.invalidateQueries({ queryKey: ['companies'] })} />
      

      <DepartmentManager
        open={departmentManagerOpen}
        onOpenChange={setDepartmentManagerOpen}
        departments={departments}
        onUpdated={() => queryClient.invalidateQueries({ queryKey: ['departments'] })} />
      
      <UserManagerPopup open={userManagerOpen} onOpenChange={setUserManagerOpen} />
      <WhatsAppConfigDialog open={whatsappConfigOpen} onOpenChange={setWhatsappConfigOpen} />
      {user && <ArchivedToolsDialog open={archivedOpen} onOpenChange={setArchivedOpen} userId={user.id} />}

      {passwordCompany &&
      <CompanyPasswordDialog
        open={!!passwordCompany}
        onOpenChange={(v) => !v && setPasswordCompany(null)}
        companyName={passwordCompany.name}
        correctPassword={(passwordCompany as any).access_password || ''}
        onSuccess={handlePasswordSuccess} />

      }

      <FloatingActionButton hidden={drawerOpen} />
      <FloatingLeftMenu hidden={drawerOpen} />

      {/* Scroll-to-top arrow */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed left-24 bottom-6 z-40 flex h-10 w-10 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110"
          style={{ background: 'hsl(0 0% 100% / 0.08)', border: '1px solid hsl(0 0% 100% / 0.12)', backdropFilter: 'blur(8px)' }}
          title="Voltar ao topo"
        >
          <ArrowUp className="h-4 w-4 text-muted-foreground" />
        </button>
      )}

      {/* Client recommendation popup */}
      {showRecommendation && tools.length > 0 && (
        <ToolRecommendationPopup
          tools={tools}
          onOpenTool={(tool) => {
            setShowRecommendation(false);
            handleOpenDrawer(tool);
          }}
        />
      )}

      {/* Bulk delete confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ferramentas?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir {selectedIds.size} ferramenta(s)?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);

};

export default Biblioteca;
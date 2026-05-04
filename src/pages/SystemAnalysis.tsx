import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Database, Code, Shield, Layers, Link2, HardDrive, Users, FileText, Package, GitBranch, Globe, ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, Info, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface TableInfo {
  name: string;
  rowCount: number;
  columns: string[];
}

interface SystemData {
  tables: TableInfo[];
  edgeFunctions: string[];
  storageBuckets: { name: string; public: boolean }[];
  totalTools: number;
  totalUsers: number;
  totalCategories: number;
  totalCompanies: number;
  totalBlocks: number;
  totalFiles: number;
  totalLinks: number;
  totalSocialCards: number;
  totalProcesses: number;
  totalNotes: number;
  totalAccessLogs: number;
  totalVersions: number;
  totalDepartments: number;
  totalWechatShares: number;
}

const COMPONENTS = [
  { name: 'BulkActions', desc: 'Ações em lote para ferramentas selecionadas' },
  { name: 'CategoryCards', desc: 'Cards de categorias com ícones' },
  { name: 'CompanyFilter', desc: 'Filtro por empresa' },
  { name: 'CompanyManager', desc: 'Gerenciamento de empresas' },
  { name: 'CompanyPasswordDialog', desc: 'Diálogo de senha da empresa' },
  { name: 'ConfigDrawer', desc: 'Drawer de estrutura/configuração da ferramenta' },
  { name: 'CopyButton', desc: 'Botão de cópia com feedback' },
  { name: 'DepartmentManager', desc: 'Gerenciamento de departamentos/setores' },
  { name: 'FloatingActionButton', desc: 'Botão flutuante de ação rápida' },
  { name: 'GptLinkInput', desc: 'Input de links GPT com suporte multi-valor' },
  { name: 'ImportPreviewDialog', desc: 'Preview de importação de ferramentas' },
  { name: 'LoginDialog', desc: 'Diálogo de login simplificado' },
  { name: 'NavLink', desc: 'Link de navegação' },
  { name: 'NotesPopup', desc: 'Popup de notas pessoais' },
  { name: 'ProcessesPopup', desc: 'Popup de processos organizacionais' },
  { name: 'SocialCardDrawer', desc: 'Editor de cards sociais' },
  { name: 'SocialCards', desc: 'Exibição de cards sociais' },
  { name: 'StatsCards', desc: 'Cards de estatísticas do dashboard' },
  { name: 'ToolCard', desc: 'Card individual de ferramenta' },
  { name: 'ToolRecommendationPopup', desc: 'Popup de recomendação de ferramentas' },
  { name: 'Toolbar', desc: 'Barra de busca e filtros' },
  { name: 'UserManagerPopup', desc: 'Popup de gerenciamento de usuários' },
  { name: 'WeChatPopup', desc: 'Popup de compartilhamento WeChat' },
  { name: 'WhatsAppConfigDialog', desc: 'Configuração da integração WhatsApp' },
];

const PAGES = [
  { name: 'Biblioteca', route: '/', desc: 'Página principal com catálogo de ferramentas' },
  { name: 'PostarFerramenta', route: '/postar', desc: 'Formulário de criação de ferramenta' },
  { name: 'EmpresaPage', route: '/empresa/:slug', desc: 'Página de ferramentas por empresa' },
  { name: 'SystemAnalysis', route: '/sistema', desc: 'Análise completa do sistema (esta página)' },
];

const EDGE_FUNCTIONS = [
  { name: 'export-tools', desc: 'Exporta ferramentas em formato estruturado', auth: false },
  { name: 'import-tools', desc: 'Importa ferramentas de arquivo externo', auth: false },
  { name: 'manage-users', desc: 'Gerencia criação/edição/exclusão de usuários', auth: false },
  { name: 'seed-users', desc: 'Seed inicial de usuários (bootstrap)', auth: false },
  { name: 'send-whatsapp-audit', desc: 'Envia notificações de auditoria via WhatsApp (Z-API)', auth: false },
  { name: 'smart-search', desc: 'Busca inteligente com IA (Gemini)', auth: false },
];

const INTEGRATIONS = [
  { name: 'Supabase (Lovable Cloud)', desc: 'Backend, banco de dados, autenticação, storage e Edge Functions', icon: Database },
  { name: 'Z-API (WhatsApp)', desc: 'Notificações de auditoria em tempo real via WhatsApp', icon: Globe },
  { name: 'Lovable AI (Gemini)', desc: 'Busca inteligente semântica por linguagem natural', icon: Code },
  { name: 'Capacitor', desc: 'Build nativo para Android e iOS', icon: Package },
];

const DEPENDENCIES = [
  { name: 'react', version: '^18.3.1', desc: 'Biblioteca UI principal' },
  { name: 'react-router-dom', version: '^6.30.1', desc: 'Roteamento SPA' },
  { name: '@supabase/supabase-js', version: '^2.98.0', desc: 'SDK do backend' },
  { name: '@tanstack/react-query', version: '^5.83.0', desc: 'Cache e sincronização de dados' },
  { name: 'tailwindcss-animate', version: '^1.0.7', desc: 'Animações CSS' },
  { name: 'recharts', version: '^2.15.4', desc: 'Gráficos e visualização de dados' },
  { name: 'zod', version: '^3.25.76', desc: 'Validação de schemas' },
  { name: 'xlsx', version: '^0.18.5', desc: 'Manipulação de planilhas Excel' },
  { name: 'lucide-react', version: '^0.462.0', desc: 'Ícones SVG' },
  { name: '@tiptap/react', version: '^3.22.2', desc: 'Editor rich-text' },
  { name: '@capacitor/core', version: '^8.3.0', desc: 'Runtime nativo mobile' },
  { name: 'sonner', version: '^1.7.4', desc: 'Notificações toast' },
  { name: 'date-fns', version: '^3.6.0', desc: 'Manipulação de datas' },
];

const DB_TABLES = [
  { name: 'tools', desc: 'Ferramentas cadastradas no sistema', key: 'totalTools' },
  { name: 'tool_credentials', desc: 'Credenciais sensíveis (isoladas por RLS)', key: null },
  { name: 'tool_blocks', desc: 'Blocos de conteúdo personalizáveis', key: 'totalBlocks' },
  { name: 'tool_links', desc: 'Vínculos entre ferramentas (many-to-many)', key: 'totalLinks' },
  { name: 'tool_access_logs', desc: 'Logs de acesso e auditoria', key: 'totalAccessLogs' },
  { name: 'tool_versions', desc: 'Histórico de versões (snapshots)', key: 'totalVersions' },
  { name: 'tool_favorites', desc: 'Favoritos por usuário', key: null },
  { name: 'knowledge_files', desc: 'Arquivos da base de conhecimento', key: 'totalFiles' },
  { name: 'categories', desc: 'Categorias dinâmicas com ícones', key: 'totalCategories' },
  { name: 'companies', desc: 'Empresas com logo, wallpaper e senha', key: 'totalCompanies' },
  { name: 'departments', desc: 'Departamentos/setores', key: 'totalDepartments' },
  { name: 'social_cards', desc: 'Cards sociais e configuração de wallpaper', key: 'totalSocialCards' },
  { name: 'processes', desc: 'Processos organizacionais', key: 'totalProcesses' },
  { name: 'process_attachments', desc: 'Anexos de processos', key: null },
  { name: 'notes', desc: 'Notas pessoais por usuário', key: 'totalNotes' },
  { name: 'user_roles', desc: 'Papéis de usuário (editor/readonly)', key: null },
  { name: 'admin_action_logs', desc: 'Logs de ações administrativas', key: null },
  { name: 'site_settings', desc: 'Configurações globais do site', key: null },
  { name: 'wechat_shares', desc: 'Compartilhamentos temporários WeChat', key: 'totalWechatShares' },
];

const STORAGE_BUCKETS = [
  { name: 'tool-images', public: true, desc: 'Imagens de ferramentas, wallpapers e social cards' },
  { name: 'knowledge-files', public: false, desc: 'Arquivos da base de conhecimento (PDF, DOCX, MD, etc.)' },
  { name: 'company-logos', public: true, desc: 'Logos de empresas' },
  { name: 'category-icons', public: true, desc: 'Ícones de categorias' },
  { name: 'social-card-icons', public: true, desc: 'Ícones de cards sociais' },
  { name: 'site-assets', public: true, desc: 'Assets gerais do site' },
  { name: 'process-files', public: true, desc: 'Arquivos de processos' },
];

function Section({ title, icon: Icon, children, defaultOpen = true }: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="border-border/40 bg-card/80 backdrop-blur">
      <CardHeader className="cursor-pointer select-none py-4 px-5" onClick={() => setOpen(o => !o)}>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Icon className="h-5 w-5 text-primary" />
          {title}
          {open ? <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" /> : <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />}
        </CardTitle>
      </CardHeader>
      {open && <CardContent className="pt-0 px-5 pb-5">{children}</CardContent>}
    </Card>
  );
}

export default function SystemAnalysis() {
  const { isEditor, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Sessão expirada'); return; }

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/export-system-markdown`;
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const disposition = res.headers.get('Content-Disposition');
      const match = disposition?.match(/filename="(.+)"/);
      a.download = match?.[1] || `sistema-export-${new Date().toISOString().slice(0,10)}.md`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      toast.success('Exportação concluída!');
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro na exportação: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isEditor) {
      navigate('/');
    }
  }, [authLoading, isEditor, navigate]);

  useEffect(() => {
    if (!isEditor) return;
    async function load() {
      setLoading(true);
      const [tools, categories, companies, blocks, files, links, socialCards, processes, notes, accessLogs, versions, departments, wechatShares] = await Promise.all([
        supabase.from('tools').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('companies').select('id', { count: 'exact', head: true }),
        supabase.from('tool_blocks' as any).select('id', { count: 'exact', head: true }),
        supabase.from('knowledge_files').select('id', { count: 'exact', head: true }),
        supabase.from('tool_links' as any).select('id', { count: 'exact', head: true }),
        supabase.from('social_cards' as any).select('id', { count: 'exact', head: true }),
        supabase.from('processes').select('id', { count: 'exact', head: true }),
        supabase.from('notes').select('id', { count: 'exact', head: true }),
        supabase.from('tool_access_logs' as any).select('id', { count: 'exact', head: true }),
        supabase.from('tool_versions').select('id', { count: 'exact', head: true }),
        supabase.from('departments').select('id', { count: 'exact', head: true }),
        supabase.from('wechat_shares' as any).select('id', { count: 'exact', head: true }),
      ]);
      setData({
        tables: [],
        edgeFunctions: [],
        storageBuckets: [],
        totalTools: tools.count || 0,
        totalUsers: 0,
        totalCategories: categories.count || 0,
        totalCompanies: companies.count || 0,
        totalBlocks: blocks.count || 0,
        totalFiles: files.count || 0,
        totalLinks: links.count || 0,
        totalSocialCards: socialCards.count || 0,
        totalProcesses: processes.count || 0,
        totalNotes: notes.count || 0,
        totalAccessLogs: accessLogs.count || 0,
        totalVersions: versions.count || 0,
        totalDepartments: departments.count || 0,
        totalWechatShares: wechatShares.count || 0,
      });
      setLoading(false);
    }
    load();
  }, [isEditor]);

  if (authLoading || !isEditor) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-accent transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              Análise do Sistema
            </h1>
            <p className="text-sm text-muted-foreground">Estrutura completa, módulos, integrações e dados</p>
          </div>
          <Button
            onClick={handleExport}
            disabled={exporting || loading}
            variant="outline"
            size="sm"
            className="ml-auto shrink-0"
          >
            {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            {exporting ? 'Exportando...' : 'Exportar .md'}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overview Stats */}
            <Section title="Visão Geral — Dados em Tempo Real" icon={Layers}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[
                  { label: 'Ferramentas', value: data?.totalTools },
                  { label: 'Categorias', value: data?.totalCategories },
                  { label: 'Empresas', value: data?.totalCompanies },
                  { label: 'Departamentos', value: data?.totalDepartments },
                  { label: 'Blocos', value: data?.totalBlocks },
                  { label: 'Arquivos BC', value: data?.totalFiles },
                  { label: 'Vínculos', value: data?.totalLinks },
                  { label: 'Cards Sociais', value: data?.totalSocialCards },
                  { label: 'Processos', value: data?.totalProcesses },
                  { label: 'Notas', value: data?.totalNotes },
                  { label: 'Logs de Acesso', value: data?.totalAccessLogs },
                  { label: 'Versões', value: data?.totalVersions },
                  { label: 'WeChat Shares', value: data?.totalWechatShares },
                ].map(s => (
                  <div key={s.label} className="rounded-lg border border-border/40 bg-muted/30 p-3 text-center">
                    <div className="text-2xl font-bold text-primary">{s.value ?? '—'}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Database Tables */}
            <Section title={`Banco de Dados — ${DB_TABLES.length} tabelas`} icon={Database}>
              <div className="space-y-2">
                {DB_TABLES.map(t => (
                  <div key={t.name} className="flex items-start gap-3 py-2 border-b border-border/20 last:border-0">
                    <Badge variant="outline" className="font-mono text-[11px] shrink-0 mt-0.5">{t.name}</Badge>
                    <span className="text-sm text-muted-foreground flex-1">{t.desc}</span>
                    {t.key && data && (
                      <span className="text-xs font-medium text-primary shrink-0">
                        {(data as any)[t.key]} registros
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Section>

            {/* Pages & Routes */}
            <Section title={`Páginas & Rotas — ${PAGES.length} páginas`} icon={GitBranch}>
              <div className="space-y-2">
                {PAGES.map(p => (
                  <div key={p.name} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                    <Badge variant="secondary" className="font-mono text-[11px] shrink-0">{p.route}</Badge>
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground flex-1">{p.desc}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Components */}
            <Section title={`Componentes — ${COMPONENTS.length} componentes`} icon={Layers} defaultOpen={false}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COMPONENTS.map(c => (
                  <div key={c.name} className="flex items-start gap-2 py-1.5">
                    <span className="text-sm font-medium text-foreground shrink-0">{c.name}</span>
                    <span className="text-xs text-muted-foreground">{c.desc}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Edge Functions */}
            <Section title={`Backend Functions — ${EDGE_FUNCTIONS.length} funções`} icon={Code}>
              <div className="space-y-2">
                {EDGE_FUNCTIONS.map(f => (
                  <div key={f.name} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                    <Badge variant="outline" className="font-mono text-[11px] shrink-0">{f.name}</Badge>
                    <span className="text-sm text-muted-foreground flex-1">{f.desc}</span>
                    <Badge variant={f.auth ? 'default' : 'secondary'} className="text-[10px]">
                      {f.auth ? 'JWT' : 'Público'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Section>

            {/* Storage */}
            <Section title={`Storage — ${STORAGE_BUCKETS.length} buckets`} icon={HardDrive}>
              <div className="space-y-2">
                {STORAGE_BUCKETS.map(b => (
                  <div key={b.name} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                    <Badge variant="outline" className="font-mono text-[11px] shrink-0">{b.name}</Badge>
                    <span className="text-sm text-muted-foreground flex-1">{b.desc}</span>
                    <Badge variant={b.public ? 'secondary' : 'default'} className="text-[10px]">
                      {b.public ? 'Público' : 'Privado'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Section>

            {/* Integrations */}
            <Section title={`Integrações Externas — ${INTEGRATIONS.length} integrações`} icon={Link2}>
              <div className="space-y-3">
                {INTEGRATIONS.map(i => (
                  <div key={i.name} className="flex items-start gap-3 py-2 border-b border-border/20 last:border-0">
                    <i.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-medium">{i.name}</span>
                      <p className="text-xs text-muted-foreground">{i.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Dependencies */}
            <Section title={`Dependências — ${DEPENDENCIES.length} principais`} icon={Package} defaultOpen={false}>
              <div className="space-y-1.5">
                {DEPENDENCIES.map(d => (
                  <div key={d.name} className="flex items-center gap-3 py-1.5 border-b border-border/20 last:border-0">
                    <span className="font-mono text-xs font-medium text-foreground w-44 shrink-0">{d.name}</span>
                    <span className="font-mono text-[11px] text-muted-foreground/60 w-20 shrink-0">{d.version}</span>
                    <span className="text-xs text-muted-foreground">{d.desc}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Security Model */}
            <Section title="Modelo de Segurança" icon={Shield}>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span><strong>RLS ativo</strong> em todas as tabelas com políticas baseadas em <code className="text-xs bg-muted px-1 rounded">has_role()</code></span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span><strong>Credenciais isoladas</strong> na tabela <code className="text-xs bg-muted px-1 rounded">tool_credentials</code> — acesso exclusivo para editores</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span><strong>Papéis separados</strong> na tabela <code className="text-xs bg-muted px-1 rounded">user_roles</code> (editor / readonly)</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span><strong>View protegida</strong> <code className="text-xs bg-muted px-1 rounded">companies_public</code> oculta senhas de empresas</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span><strong>Função segura</strong> <code className="text-xs bg-muted px-1 rounded">get_tool_prompt()</code> com SECURITY DEFINER</span>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-accent-foreground shrink-0 mt-0.5" />
                  <span><strong>Auditoria em tempo real</strong> via WhatsApp para ações críticas</span>
                </div>
              </div>
            </Section>

            {/* Architecture Summary */}
            <Section title="Arquitetura Geral" icon={GitBranch}>
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong className="text-foreground">Frontend:</strong> React 18 + Vite 5 + TypeScript 5 + Tailwind CSS v3 + shadcn/ui</p>
                <p><strong className="text-foreground">Backend:</strong> Lovable Cloud (Supabase) — PostgreSQL, Auth, Storage, Edge Functions (Deno)</p>
                <p><strong className="text-foreground">Mobile:</strong> Capacitor 8 (Android + iOS) com builds via GitHub Actions</p>
                <p><strong className="text-foreground">Roteamento:</strong> HashRouter (SPA) com 4 rotas principais</p>
                <p><strong className="text-foreground">Estado:</strong> React Query para cache/sync + Context API para autenticação</p>
                <p><strong className="text-foreground">Busca:</strong> Deep Search local + Smart Search com IA (Gemini) como fallback</p>
                <p><strong className="text-foreground">Auditoria:</strong> Logs no banco + notificações WhatsApp via Z-API</p>
                <p><strong className="text-foreground">Arquivos suportados:</strong> PDF, TXT, DOCX, XLSX, CSV, JSON, Markdown</p>
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2, Download, ExternalLink, Plus, Clipboard, Save, RotateCcw, BarChart3, MessageCircle, Image as ImageIcon, FileDown, Copy as CopyIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Tool, KnowledgeFile, parseRecursos, parseAcoes, ToolRecursos, ToolAcao, MODELOS_RECOMENDADOS, CATEGORIAS, ToolAccessLog, categoriaToToolType, toolTypeToCategoria, toolStatusToAcoes } from '@/types/tool';
import type { Department } from '@/lib/departments';
import { updateTool, softDeleteTool, duplicateTool, fetchKnowledgeFiles, uploadKnowledgeFile, deleteKnowledgeFile, downloadKnowledgeFile, uploadToolImage, deleteToolImage, logToolAccess, fetchToolAccessLogs, fetchToolAccessStats, fetchToolCredentials, upsertToolCredentials, fetchToolPrompt, fetchToolLinks, createToolLink, deleteToolLink, fetchTools } from '@/lib/api';
import { copyToClipboard } from '@/lib/clipboard';
import CopyButton from '@/components/CopyButton';
import GptLinkInput from '@/components/GptLinkInput';
import { downloadToolAsTxt } from '@/lib/txtTemplates';
import { ExportToolButton } from './tools/ExportToolButton';
import { ToolExportData } from '@/types/tool';
import { Button } from '@/components/ui/button';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { GENERATOR_OPTIONS } from '@/lib/gptAutocomplete';
import type { Company } from '@/components/CompanyFilter';

const WHATSAPP_URL = 'https://wa.me/message/CXZEURMC7SRMC1';

interface ConfigDrawerProps {
  tool: Tool | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
  initialTab?: 'configurar' | 'processo';
  companies?: Company[];
  departments?: Department[];
  onNavigateToTool?: (tool: Tool) => void;
}

// Parse/serialize multi-link fields (backward compatible: plain text → array of 1)
const MULTI_LINK_PREFIX = '%%MULTI%%';
function parseMultiLink(raw: string): string[] {
  if (!raw) return [''];
  if (raw.startsWith(MULTI_LINK_PREFIX)) {
    try { const arr = JSON.parse(raw.slice(MULTI_LINK_PREFIX.length)); return arr.length ? arr : ['']; } catch {}
  }
  return [raw];
}
function serializeMultiLink(list: string[]): string | null {
  const filtered = list.filter(v => v.trim());
  if (filtered.length === 0) return null;
  if (filtered.length === 1) return filtered[0]; // backward compat
  return MULTI_LINK_PREFIX + JSON.stringify(list);
}

const ConfigDrawer: React.FC<ConfigDrawerProps> = ({ tool, open, onClose, onUpdated, onDeleted, initialTab = 'configurar', companies = [], departments = [], onNavigateToTool }) => {
  const { user, isEditor } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Fields
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [linkAcesso, setLinkAcesso] = useState('');
  const [instrucoes, setInstrucoes] = useState('');
  const [quebraGelos, setQuebraGelos] = useState<string[]>([]);
  const [modeloRecomendado, setModeloRecomendado] = useState('');
  const [recursos, setRecursos] = useState<ToolRecursos>({ webSearch: false, appsBeta: false, lousa: false, imagens: false, codeInterpreter: false });
  const [acoes, setAcoes] = useState<ToolAcao[]>([]);
  const [funcao, setFuncao] = useState('');
  const [promptFinal, setPromptFinal] = useState('');
  const [categoria, setCategoria] = useState('');
  const [setorDepartamento, setSetorDepartamento] = useState('');
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [credentialEmail, setCredentialEmail] = useState('');
  const [credentialSenha, setCredentialSenha] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');
  const [credentialAnonPublic, setCredentialAnonPublic] = useState('');
  const [credentialPublishKey, setCredentialPublishKey] = useState('');
  const [credentialSecretKey, setCredentialSecretKey] = useState('');
  const [credentialServiceRole, setCredentialServiceRole] = useState('');
  const [credentialProjectId, setCredentialProjectId] = useState('');
  const [credentialApiList, setCredentialApiList] = useState<string[]>(['']);
  const [credentialApiLabels, setCredentialApiLabels] = useState<string[]>(['']);

  const [printProcessoUrl, setPrintProcessoUrl] = useState('');
  const [printResultadoUrl, setPrintResultadoUrl] = useState('');
  const [linkContexto, setLinkContexto] = useState('');
  const [linkCriacaoPromptList, setLinkCriacaoPromptList] = useState<string[]>(['']);
  const [linkCtxTransBase, setLinkCtxTransBase] = useState('');
  const [linkGptTransBase, setLinkGptTransBase] = useState('');
  const [linkGptUsadoList, setLinkGptUsadoList] = useState<string[]>(['']);
  const [gerador, setGerador] = useState('');
  const [linkBlueprint, setLinkBlueprint] = useState('');
  const [extraPrompts, setExtraPrompts] = useState<string[]>([]);
  const [corCartao, setCorCartao] = useState<string | null>(null);
  
  // Tool links (Assistentes <-> Automações)
  const [toolLinks, setToolLinks] = useState<any[]>([]);
  const [allTools, setAllTools] = useState<Tool[]>([]);
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  // Date update toggle
  const [shouldUpdateDate, setShouldUpdateDate] = useState(false);
  // Navigation stack for linked tools
  const [drawerStack, setDrawerStack] = useState<string[]>([]);

  // Audit
  const [auditLogs, setAuditLogs] = useState<ToolAccessLog[]>([]);
  const [auditStats, setAuditStats] = useState({ total: 0, views: 0, structures: 0, whatDoes: 0, access: 0, contact: 0 });
  const [showAudit, setShowAudit] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (tool && open) {
      setTitulo(tool.titulo);
      setDescricao(tool.descricao || '');
      setLinkAcesso(tool.link_acesso_original || '');
      setInstrucoes(tool.instrucoes || '');
      setQuebraGelos(tool.quebra_gelos || []);
      setModeloRecomendado(tool.modelo_recomendado || '');
      setRecursos(parseRecursos(tool.recursos));
      setAcoes(parseAcoes(tool.acoes));
      setFuncao(tool.funcao || '');
      setPromptFinal('');
      // Categoria is now the primary classification
      setCategoria(tool.categoria || toolTypeToCategoria(tool.tool_type || 'gpt'));
      setSetorDepartamento(tool.setores || '');
      setEmpresaId(tool.empresa_id || null);
      setCredentialEmail('');
      setCredentialSenha('');
      setCredentialUrl('');
      setCredentialAnonPublic('');
      setCredentialPublishKey('');
      setCredentialSecretKey('');
      setCredentialServiceRole('');
      setCredentialProjectId('');
      setCredentialApiList(['']);
      setCredentialApiLabels(['']);
      if (isEditor && tool.id) {
        fetchToolCredentials(tool.id).then(creds => {
          setCredentialEmail(creds.credential_email || '');
          setCredentialSenha(creds.credential_senha || '');
          setCredentialUrl(creds.credential_url || '');
          setCredentialAnonPublic(creds.credential_anon_public || '');
          setCredentialPublishKey(creds.credential_publish_key || '');
          setCredentialSecretKey(creds.credential_secret_key || '');
          setCredentialServiceRole(creds.credential_service_role || '');
          setCredentialProjectId(creds.credential_project_id || '');
          const apis = parseMultiLink(creds.credential_api || '');
          setCredentialApiList(apis);
          const labels = Array.isArray(creds.api_labels) ? creds.api_labels : [];
          setCredentialApiLabels(apis.map((_, i) => labels[i] || ''));
          // Parse composite prompt data
          const raw = creds.prompt_final || '';
          parsePromptData(raw);
        }).catch(() => {});
      } else if (user && tool.id) {
        // Readonly users can get prompt_final via security definer function
        fetchToolPrompt(tool.id).then(prompt => {
          parsePromptData(prompt || '');
        }).catch(() => {});
      }
      // Load tool links for Assistentes/Automações
      if (tool.id) {
        fetchToolLinks(tool.id).then(setToolLinks).catch(() => {});
        fetchTools().then(setAllTools).catch(() => {});
      }
      setPrintProcessoUrl(tool.print_processo_url || '');
      setPrintResultadoUrl(tool.print_resultado_url || '');
      setLinkContexto(tool.link_contexto || '');
      setLinkCriacaoPromptList(parseMultiLink(tool.link_criacao_prompt || tool.link_gpt_criacao_prompt || ''));
      setLinkCtxTransBase(tool.link_contexto_transformacao_base_conhecimento || '');
      setLinkGptTransBase(tool.link_gpt_transformacao_base_conhecimento || '');
      setLinkGptUsadoList(parseMultiLink(tool.link_gpt_pronto || tool.link_gpt_transformacao_contexto || ''));
      setGerador('');
      setLinkBlueprint('');
      setExtraPrompts([]);
      setCorCartao(tool.cor_cartao || null);
      setEditMode(false);
      setShouldUpdateDate(false);
      setDrawerStack([]);
      loadKnowledgeFiles(tool.id);
      const profile = !user ? 'visitante' : isEditor ? 'editor' : 'leitor';
      logToolAccess(tool.id, 'open_structure', profile, user?.id, user?.email);
      if (isEditor) loadAudit(tool.id);
    }
  }, [tool, open]);

  const loadKnowledgeFiles = async (toolId: string) => { try { setKnowledgeFiles(await fetchKnowledgeFiles(toolId)); } catch {} };
  const loadAudit = async (toolId: string) => { try { const [l, s] = await Promise.all([fetchToolAccessLogs(toolId), fetchToolAccessStats(toolId)]); setAuditLogs(l); setAuditStats(s); } catch {} };

  // Prompt serialization helpers — store main prompt + extra prompts as JSON
  const PROMPT_JSON_PREFIX = '%%PROMPTS_JSON%%';

  const parsePromptData = (raw: string) => {
    if (raw.startsWith(PROMPT_JSON_PREFIX)) {
      try {
        const data = JSON.parse(raw.slice(PROMPT_JSON_PREFIX.length));
        setPromptFinal(data.main || '');
        setExtraPrompts(data.extra || []);
        return;
      } catch {}
    }
    // Legacy: plain text prompt, no extras
    setPromptFinal(raw);
    setExtraPrompts([]);
  };

  const serializePromptData = (): string => {
    // If there are extra prompts with content, use JSON format
    const hasExtras = extraPrompts.some(p => p.trim());
    if (hasExtras) {
      return PROMPT_JSON_PREFIX + JSON.stringify({ main: promptFinal, extra: extraPrompts });
    }
    // Otherwise just store the main prompt as plain text (backward compatible)
    return promptFinal;
  };

  // Derive tool_type from categoria
  const tt = categoriaToToolType(categoria);

  const handleSave = async () => {
    if (!tool || !user) return;
    if (!categoria) { toast({ description: 'Selecione a categoria antes de salvar', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      // Auto-generate description if link exists but descricao is empty
      let autoDescricao = descricao;
      if (linkAcesso && !descricao.trim()) {
        const titleLower = titulo.toLowerCase().replace(/[^a-záàâãéèêíïóôõöúçñ\s]/gi, '').trim();
        autoDescricao = `Ferramenta utilizada para ${titleLower} de forma prática e automatizada.`;
        setDescricao(autoDescricao);
      }
      const updates: any = {
        titulo, descricao: autoDescricao || null, link_acesso_original: linkAcesso || null,
        instrucoes, quebra_gelos: quebraGelos, modelo_recomendado: modeloRecomendado || null,
        recursos: recursos as any, acoes: acoes as any,
        funcao: funcao || null,
        tool_type: tt, categoria: categoria || null,
        setores: setorDepartamento || null,
        empresa_id: empresaId || null,
        print_processo_url: printProcessoUrl || null, print_resultado_url: printResultadoUrl || null,
        link_contexto: linkContexto || null, link_criacao_prompt: serializeMultiLink(linkCriacaoPromptList),
        link_contexto_transformacao_base_conhecimento: linkCtxTransBase || null,
        link_gpt_transformacao_base_conhecimento: linkGptTransBase || null,
        link_gpt_pronto: serializeMultiLink(linkGptUsadoList),
        cor_cartao: corCartao || null,
      };
      if (shouldUpdateDate) {
        updates.atualizado_em = new Date().toISOString();
      }
      await updateTool(tool.id, updates, user.id);
      // Save credentials separately — serialize prompt data
      await upsertToolCredentials(tool.id, {
        credential_email: credentialEmail || null,
        credential_senha: credentialSenha || null,
        prompt_final: serializePromptData() || null,
        credential_url: credentialUrl || null,
        credential_anon_public: credentialAnonPublic || null,
        credential_publish_key: credentialPublishKey || null,
        credential_secret_key: credentialSecretKey || null,
        credential_service_role: credentialServiceRole || null,
        credential_project_id: credentialProjectId || null,
        credential_api: serializeMultiLink(credentialApiList),
        api_labels: credentialApiLabels.slice(0, credentialApiList.length),
      });
      setEditMode(false);
      onUpdated();
      toast({ description: 'Ferramenta salva com sucesso' });
    } catch (err: any) { toast({ description: err.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!tool || !user) return;
    try { await softDeleteTool(tool.id, user.id); onDeleted(); onClose(); toast({ description: 'Ferramenta excluída' }); }
    catch (err: any) { toast({ description: err.message, variant: 'destructive' }); }
  };

  const [duplicating, setDuplicating] = useState(false);
  const handleDuplicate = async () => {
    if (!tool || !user) return;
    setDuplicating(true);
    try {
      const copy = await duplicateTool(tool.id, user.id);
      toast({ description: `Ferramenta duplicada como "${copy.titulo}"` });
      onUpdated();
      onClose();
    } catch (err: any) {
      toast({ description: err.message || 'Erro ao duplicar', variant: 'destructive' });
    } finally {
      setDuplicating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!tool || !user || !e.target.files?.[0]) return;
    try { const url = await uploadToolImage(tool.id, e.target.files[0]); await updateTool(tool.id, { image_url: url }, user.id); onUpdated(); toast({ description: 'Imagem atualizada' }); }
    catch (err: any) { toast({ description: err.message, variant: 'destructive' }); }
  };

  const handleRemoveImage = async () => {
    if (!tool || !user || !tool.image_url) return;
    try { await deleteToolImage(tool.image_url); await updateTool(tool.id, { image_url: null }, user.id); onUpdated(); } catch {}
  };

  const handlePrintUpload = async (field: 'print_processo_url' | 'print_resultado_url', e: React.ChangeEvent<HTMLInputElement>) => {
    if (!tool || !user || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { toast({ description: 'Use PNG, JPG ou WebP.', variant: 'destructive' }); return; }
    try { const url = await uploadToolImage(tool.id, file); await updateTool(tool.id, { [field]: url } as any, user.id); if (field === 'print_processo_url') setPrintProcessoUrl(url); else setPrintResultadoUrl(url); onUpdated(); toast({ description: 'Print atualizado' }); }
    catch (err: any) { toast({ description: err.message, variant: 'destructive' }); }
  };

  const handleRemovePrint = async (field: 'print_processo_url' | 'print_resultado_url') => {
    if (!tool || !user) return;
    try { await updateTool(tool.id, { [field]: null } as any, user.id); if (field === 'print_processo_url') setPrintProcessoUrl(''); else setPrintResultadoUrl(''); onUpdated(); } catch {}
  };

  const handleKnowledgeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!tool || !user || !e.target.files?.length) return;
    const files = Array.from(e.target.files);
    for (const file of files) {
      try {
        await uploadKnowledgeFile(tool.id, file, '', user.id);
      } catch (err: any) {
        toast({ description: `Erro ao enviar ${file.name}: ${err.message}`, variant: 'destructive' });
      }
    }
    await loadKnowledgeFiles(tool.id);
    toast({ description: `${files.length} arquivo(s) enviado(s)` });
  };

  const handleKnowledgeDrop = async (file: File) => {
    if (!tool || !user) return;
    try {
      await uploadKnowledgeFile(tool.id, file, '', user.id);
      await loadKnowledgeFiles(tool.id);
      toast({ description: 'Arquivo enviado' });
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
  };

  const handleKnowledgeBulkDrop = async (files: File[]) => {
    if (!tool || !user) return;
    for (const file of files) {
      try {
        await uploadKnowledgeFile(tool.id, file, '', user.id);
      } catch (err: any) {
        toast({ description: `Erro ao enviar ${file.name}: ${err.message}`, variant: 'destructive' });
      }
    }
    await loadKnowledgeFiles(tool.id);
    toast({ description: `${files.length} arquivo(s) enviado(s)` });
  };


  const handlePrintDrop = async (field: 'print_processo_url' | 'print_resultado_url', file: File) => {
    if (!tool || !user) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { toast({ description: 'Use PNG, JPG ou WebP.', variant: 'destructive' }); return; }
    try { const url = await uploadToolImage(tool.id, file); await updateTool(tool.id, { [field]: url } as any, user.id); if (field === 'print_processo_url') setPrintProcessoUrl(url); else setPrintResultadoUrl(url); onUpdated(); toast({ description: 'Print atualizado' }); }
    catch (err: any) { toast({ description: err.message, variant: 'destructive' }); }
  };

  const handleDownloadFile = async (kf: KnowledgeFile) => {
    if (!user) return;
    try { const blob = await downloadKnowledgeFile(kf.storage_path); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = kf.file_name; a.click(); URL.revokeObjectURL(url); }
    catch (err: any) { toast({ description: err.message, variant: 'destructive' }); }
  };

  const handleDeleteFile = async (kf: KnowledgeFile) => {
    try { await deleteKnowledgeFile(kf.id, kf.storage_path); await loadKnowledgeFiles(tool!.id); toast({ description: 'Arquivo removido' }); }
    catch (err: any) { toast({ description: err.message, variant: 'destructive' }); }
  };

  const handleCopyAll = () => {
    if (!tool || !user) return;
    const parts: string[] = [];
    parts.push(`Nome: ${titulo}`);
    if (funcao) parts.push(`Função: ${funcao}`);
    if (descricao) parts.push(`Descrição: ${descricao}`);
    if (linkAcesso) parts.push(`Link: ${linkAcesso}`);
    if (instrucoes) parts.push(`Instruções:\n${instrucoes}`);
    if (credentialEmail) parts.push(`Email: ${credentialEmail}`);
    if (credentialSenha) parts.push(`Senha: ${credentialSenha}`);
    if (linkContexto) parts.push(`Link de Contexto: ${linkContexto}`);
    linkCriacaoPromptList.forEach((v, i) => { if (v.trim()) parts.push(`Link Criação Prompt ${i + 1}°: ${v}`); });
    if (linkCtxTransBase) parts.push(`Link Ctx Trans Base: ${linkCtxTransBase}`);
    if (linkGptTransBase) parts.push(`Link GPT Trans Base: ${linkGptTransBase}`);
    linkGptUsadoList.forEach((v, i) => { if (v.trim()) parts.push(`Link GPT Usado ${i + 1}°: ${v}`); });
    if (linkBlueprint) parts.push(`Link do Blueprint: ${linkBlueprint}`);
    if (gerador) parts.push(`Gerador: ${gerador}`);
    if (promptFinal) parts.push(`Prompt:\n${promptFinal}`);
    extraPrompts.forEach((p, i) => { if (p.trim()) parts.push(`Prompt ${i + 1}:\n${p}`); });
    if (modeloRecomendado) parts.push(`Modelo Recomendado: ${modeloRecomendado}`);
    if (quebraGelos.length > 0) parts.push(`Quebra-gelos:\n${quebraGelos.join('\n')}`);
    copyToClipboard(parts.join('\n\n'), 'Tudo copiado');
  };

  const handleExportTxt = () => {
    if (!tool) return;
    const empresaNome = companies.find(c => c.id === empresaId)?.name || '';
    downloadToolAsTxt({ ...tool, titulo, descricao, funcao, instrucoes, link_acesso_original: linkAcesso, link_contexto: linkContexto, link_criacao_prompt: serializeMultiLink(linkCriacaoPromptList) || '', link_contexto_transformacao_base_conhecimento: linkCtxTransBase, link_gpt_transformacao_base_conhecimento: linkGptTransBase, link_gpt_pronto: serializeMultiLink(linkGptUsadoList) || '', prompt_final: promptFinal, modelo_recomendado: modeloRecomendado, recursos, credential_email: credentialEmail, credential_senha: credentialSenha, tool_type: tt, categoria, status: tool.status }, empresaNome);
  };

  if (!open || !tool) return null;

  const isVisitor = !user;
  const canCopy = !!user;
  const canDownload = !!user;

  // Dark theme improved readability classes
  const fieldBg = editMode ? 'bg-secondary/60 border-border/80 text-foreground' : 'bg-secondary/30 border-transparent text-foreground/90 cursor-default';
  const labelClass = 'text-muted-foreground';
  const sectionBorder = 'border-border/40';

  // Blur class for visitors
  const blurClass = isVisitor ? 'blur-[6px] select-none pointer-events-none' : '';

  const toolExportData: Partial<ToolExportData> = {
    nome: titulo,
    funcao: funcao,
    descricao: descricao,
    instrucoes: instrucoes,
    credenciais: {
      login: credentialEmail,
      email: credentialEmail,
      senha: credentialSenha,
      url: credentialUrl,
      keys: {
        anon_public: credentialAnonPublic,
        publish_key: credentialPublishKey,
        secret_key: credentialSecretKey,
        service_role: credentialServiceRole,
        project_id: credentialProjectId,
      },
      apis: credentialApiList.map((valor, i) => ({ 
        nome: credentialApiLabels[i] || `API ${i + 1}`,
        valor: valor || '',
        ordem: i + 1 
      })),
    },
    links: {
      acesso: linkAcesso,
      blueprint: linkBlueprint,
      gerador: gerador,
    },
    gpts: {
      criacao_prompt: linkCriacaoPromptList.map(url => ({ nome: 'GPT de Criação', url: url || '' })),
      usados: linkGptUsadoList.map(url => ({ nome: 'GPT Usado', url: url || '' })),
    },
    base_conhecimento: {
      arquivos: knowledgeFiles.map(f => ({
        nome: f.file_name,
        tipo: '', 
        tamanho: 0,
        url: '', 
        path: f.storage_path,
        uploadedAt: f.uploaded_at
      })),
    },

    prompt: promptFinal,
    modelo_recomendado: modeloRecomendado,
    features: {
      busca_web: recursos.webSearch,
      apps_beta: recursos.appsBeta,
      lousa: recursos.lousa,
      geracao_imagens: recursos.imagens,
      interprete_codigo: recursos.codeInterpreter,
    },
    quebra_gelos: quebraGelos,
    ferramentas_vinculadas: toolLinks.map(l => ({
      id: l.target_tool_id,
      nome: allTools.find(t => t.id === l.target_tool_id)?.titulo || 'Ferramenta'
    })),
    status: toolStatusToAcoes(tool?.status || 'draft').toLowerCase(),
    historico: acoes.map(a => ({
      id: a.id,
      titulo: a.titulo,
      descricao: a.descricao
    }))
  };

  return (

    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[540px] flex-col border-l border-border bg-background">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Configurar ferramenta</h2>
          <div className="flex items-center gap-2">
            {isEditor && (
              <button onClick={() => setEditMode(!editMode)} className={`rounded-full px-3 py-1 text-[12px] font-medium transition-all ${editMode ? 'bg-primary/20 text-primary border border-primary/30' : ''}`}
                style={!editMode ? { background: 'hsl(0 0% 100% / 0.06)', border: '1px solid hsl(0 0% 100% / 0.10)', color: 'hsl(0 0% 70%)' } : {}}>
                {editMode ? 'Modo edição' : 'Modo leitura'}
              </button>
            )}
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent"><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="px-6 pt-5">
              <TabsList className="w-full bg-secondary/50">
                <TabsTrigger value="configurar" className="flex-1 text-xs">Configurar</TabsTrigger>
                <TabsTrigger value="processo" className="flex-1 text-xs">Processo e resultado</TabsTrigger>
              </TabsList>
            </div>

            {/* ====== CONFIGURAR TAB — DARK THEME IMPROVED ====== */}
            <TabsContent value="configurar" className="mt-0">
              <div className="px-6 py-5 space-y-5 min-h-full">

                {/* Classification — editor edit mode */}
                {isEditor && editMode && (
                  <div className={`space-y-3 p-4 rounded-xl border ${sectionBorder} bg-secondary/20`}>
                    <p className={`text-xs ${labelClass} uppercase tracking-wider font-semibold`}>Classificação</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground/70">Categoria *</label>
                        <Select value={categoria || '_none'} onValueChange={(v) => setCategoria(v === '_none' ? '' : v)}>
                          <SelectTrigger className="h-9 text-sm bg-secondary/60 border-border/80 text-foreground"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="_none">Sem categoria</SelectItem>
                            {CATEGORIAS.map(c => <SelectItem key={c.nome} value={c.nome}>{c.nome}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        </div>

                        {/* Color selection */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground/70">Cor do Card</label>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="color" 
                              value={corCartao || '#000000'} 
                              onChange={(e) => setCorCartao(e.target.value)}
                              className="w-10 h-10 p-1 bg-secondary/60 border-border/80"
                            />
                            {corCartao && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setCorCartao(null)}
                                className="h-8 text-[10px]"
                              >
                                Resetar
                              </Button>
                            )}
                          </div>
                        </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground/70">Setor / Departamento</label>
                        <Select value={setorDepartamento || '_none'} onValueChange={(v) => setSetorDepartamento(v === '_none' ? '' : v)}>
                          <SelectTrigger className="h-9 text-sm bg-secondary/60 border-border/80 text-foreground"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="_none">Sem setor</SelectItem>
                            {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {companies.length > 0 && (
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground/70">Empresa (opcional)</label>
                        <Select value={empresaId || '_none'} onValueChange={(v) => setEmpresaId(v === '_none' ? null : v)}>
                          <SelectTrigger className="h-9 text-sm bg-secondary/60 border-border/80 text-foreground"><SelectValue placeholder="Sem empresa" /></SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="_none">Sem empresa</SelectItem>
                            {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                {/* Image */}
                <div className="space-y-2">
                  <label className={`text-xs ${labelClass} uppercase tracking-wider font-medium`}>IMAGEM DE CAPA</label>
                  <div className="h-[160px] overflow-hidden rounded-2xl border border-border/50 relative">
                    {tool.image_url ? (
                      <img src={tool.image_url} alt={tool.titulo} className="h-full w-full object-cover cursor-pointer" onClick={() => setLightboxUrl(tool.image_url)} />
                    ) : (
                      <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${getGradient(tool.titulo)}`}>
                        <span className="text-4xl font-bold text-foreground/40">{getInitials(tool.titulo)}</span>
                      </div>
                    )}
                    {editMode && isEditor && (
                      <div className="absolute bottom-2 right-2 flex gap-2">
                        <label className="flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-medium cursor-pointer" style={{ background: 'hsl(0 0% 0% / 0.7)', color: 'hsl(0 0% 85%)' }}><Upload className="h-3 w-3" /> Upload<input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} /></label>
                        {tool.image_url && <button onClick={handleRemoveImage} className="flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-medium" style={{ background: 'hsl(0 0% 0% / 0.7)', color: 'hsl(0 72% 55%)' }}><Trash2 className="h-3 w-3" /> Remover</button>}
                      </div>
                    )}
                  </div>
                  {editMode && isEditor && (
                    <label className="flex items-center gap-2 rounded-xl border border-dashed border-border/60 p-3 cursor-pointer hover:bg-secondary/30 transition-colors">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Clique para selecionar uma imagem de capa</span>
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>

                {/* === UNIVERSAL FIELDS — All types show all fields in edit mode, only filled in read mode === */}

                {/* NOME — always shown */}
                <FieldRow label="NOME" labelClass={labelClass}>
                  <div className={blurClass + ' flex items-center gap-1.5 flex-1'}>
                    <Input value={titulo} onChange={(e) => setTitulo(e.target.value.toUpperCase())} readOnly={!editMode} className={`text-sm h-9 flex-1 ${fieldBg}`} />
                  </div>
                </FieldRow>

                {/* FUNÇÃO */}
                {(editMode || funcao) && (
                  <FieldRow label="FUNÇÃO" labelClass={labelClass}>
                    <div className={blurClass + ' flex-1'}>
                      <Textarea value={funcao} onChange={(e) => setFuncao(e.target.value)} readOnly={!editMode} rows={3} className={`text-sm resize-none ${fieldBg}`} />
                      {canCopy && funcao && <div className="flex gap-0.5 mt-1"><CopyButton text={funcao} label="Copiar função" /></div>}
                    </div>
                  </FieldRow>
                )}

                {/* DESCRIÇÃO */}
                {(editMode || descricao) && (
                  <FieldRow label="DESCRIÇÃO" labelClass={labelClass}>
                    <div className={blurClass + ' flex items-center gap-1.5 flex-1'}>
                      <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} readOnly={!editMode} className={`text-sm h-9 flex-1 ${fieldBg}`} />
                      {canCopy && descricao && <CopyButton text={descricao} />}
                    </div>
                  </FieldRow>
                )}

                {/* INSTRUÇÕES */}
                {(editMode || instrucoes) && (
                  <FieldRow label="INSTRUÇÕES" labelClass={labelClass}>
                    <div className={blurClass + ' flex-1'}>
                      <Textarea value={instrucoes} onChange={(e) => setInstrucoes(e.target.value)} readOnly={!editMode} rows={6} className={`text-sm resize-none whitespace-pre-wrap ${fieldBg}`} />
                      {canCopy && instrucoes && <div className="flex gap-0.5 mt-1"><CopyButton text={instrucoes} label="Copiar" /><CopyButton text={instrucoes.replace(/\n/g, ' ')} label="Sem quebras" /></div>}
                    </div>
                  </FieldRow>
                )}

                {/* CREDENCIAIS — editor only */}
                {isEditor && (editMode || credentialEmail || credentialSenha || credentialUrl || credentialAnonPublic || credentialPublishKey || credentialSecretKey || credentialServiceRole || credentialProjectId || credentialApiList.some(v => v)) && (
                  <div className={`border-t ${sectionBorder} pt-4 space-y-3`}>
                    <p className={`text-xs ${labelClass} uppercase tracking-wider font-semibold`}>CREDENCIAIS (somente editor)</p>
                    {(editMode || credentialEmail) && (
                      <FieldRow label="EMAIL" labelClass={labelClass}>
                        <Input value={credentialEmail} onChange={(e) => setCredentialEmail(e.target.value)} readOnly={!editMode} className={`text-sm h-9 flex-1 ${fieldBg}`} />
                        {credentialEmail && <CopyButton text={credentialEmail} />}
                      </FieldRow>
                    )}
                    {(editMode || credentialSenha) && (
                      <FieldRow label="SENHA" labelClass={labelClass}>
                        <Input value={credentialSenha} onChange={(e) => setCredentialSenha(e.target.value)} readOnly={!editMode} type="text" className={`text-sm h-9 flex-1 ${fieldBg}`} />
                        {credentialSenha && <CopyButton text={credentialSenha} />}
                      </FieldRow>
                    )}
                    {(editMode || credentialUrl) && (
                      <FieldRow label="URL" labelClass={labelClass}>
                        <Input value={credentialUrl} onChange={(e) => setCredentialUrl(e.target.value)} readOnly={!editMode} placeholder="https://..." className={`text-sm h-9 flex-1 ${fieldBg}`} />
                        {credentialUrl && <CopyButton text={credentialUrl} />}
                      </FieldRow>
                    )}
                    {(editMode || credentialAnonPublic) && (
                      <FieldRow label="ANON PUBLIC" labelClass={labelClass}>
                        <Input value={credentialAnonPublic} onChange={(e) => setCredentialAnonPublic(e.target.value)} readOnly={!editMode} className={`text-sm h-9 flex-1 ${fieldBg}`} />
                        {credentialAnonPublic && <CopyButton text={credentialAnonPublic} />}
                      </FieldRow>
                    )}
                    {(editMode || credentialPublishKey) && (
                      <FieldRow label="PUBLISH KEY" labelClass={labelClass}>
                        <Input value={credentialPublishKey} onChange={(e) => setCredentialPublishKey(e.target.value)} readOnly={!editMode} className={`text-sm h-9 flex-1 ${fieldBg}`} />
                        {credentialPublishKey && <CopyButton text={credentialPublishKey} />}
                      </FieldRow>
                    )}
                    {(editMode || credentialSecretKey) && (
                      <FieldRow label="SECRET KEY" labelClass={labelClass}>
                        <Input value={credentialSecretKey} onChange={(e) => setCredentialSecretKey(e.target.value)} readOnly={!editMode} type="text" className={`text-sm h-9 flex-1 ${fieldBg}`} />
                        {credentialSecretKey && <CopyButton text={credentialSecretKey} />}
                      </FieldRow>
                    )}
                    {(editMode || credentialServiceRole) && (
                      <FieldRow label="SERVICE ROLE" labelClass={labelClass}>
                        <Input value={credentialServiceRole} onChange={(e) => setCredentialServiceRole(e.target.value)} readOnly={!editMode} type="text" className={`text-sm h-9 flex-1 ${fieldBg}`} />
                        {credentialServiceRole && <CopyButton text={credentialServiceRole} />}
                      </FieldRow>
                    )}
                    {(editMode || credentialProjectId) && (
                      <FieldRow label="PROJECT ID" labelClass={labelClass}>
                        <Input value={credentialProjectId} onChange={(e) => setCredentialProjectId(e.target.value)} readOnly={!editMode} className={`text-sm h-9 flex-1 ${fieldBg}`} />
                        {credentialProjectId && <CopyButton text={credentialProjectId} />}
                      </FieldRow>
                    )}
                    {(editMode || credentialApiList.some(v => v)) && (
                      <div className="space-y-2">
                        <p className={`text-[10px] ${labelClass} uppercase tracking-wider`}>API</p>
                        {credentialApiList.map((val, idx) => {
                          const label = credentialApiLabels[idx] || '';
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-center gap-1">
                                {editMode ? (
                                  <Input
                                    value={label}
                                    onChange={(e) => { const c = [...credentialApiLabels]; while (c.length <= idx) c.push(''); c[idx] = e.target.value; setCredentialApiLabels(c); }}
                                    placeholder={`Nome (ex: API ${idx + 1})`}
                                    className={`text-[10px] h-6 flex-1 ${fieldBg} placeholder:text-muted-foreground/40`}
                                  />
                                ) : (
                                  <span className="text-[10px] text-muted-foreground/70 flex-1 truncate">{label || `${idx + 1}° API`}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-muted-foreground/60 w-5 shrink-0">{idx + 1}°</span>
                                <Input value={val} onChange={(e) => { const c = [...credentialApiList]; c[idx] = e.target.value; setCredentialApiList(c); }} readOnly={!editMode} type="text" className={`text-sm h-9 flex-1 ${fieldBg}`} />
                                {val && <CopyButton text={val} />}
                                {editMode && credentialApiList.length > 1 && (
                                  <button onClick={() => {
                                    const c = credentialApiList.filter((_, i) => i !== idx);
                                    const l = credentialApiLabels.filter((_, i) => i !== idx);
                                    setCredentialApiList(c.length ? c : ['']);
                                    setCredentialApiLabels(l.length ? l : ['']);
                                  }} className="text-destructive/70 hover:text-destructive text-xs px-1">✕</button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {editMode && (
                          <button onClick={() => { setCredentialApiList([...credentialApiList, '']); setCredentialApiLabels([...credentialApiLabels, '']); }} className="text-[11px] text-primary/70 hover:text-primary">+ Adicionar API</button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* LINK DE ACESSO */}
                {(editMode || linkAcesso) && (
                  <FieldRow label="LINK DE ACESSO" labelClass={labelClass}>
                    <div className={blurClass + ' flex items-center gap-1.5 flex-1'}>
                      <Input value={linkAcesso} onChange={(e) => setLinkAcesso(e.target.value)} readOnly={!editMode} placeholder="https://..." className={`text-sm h-9 flex-1 ${fieldBg}`} />
                      {canCopy && linkAcesso && <CopyButton text={linkAcesso} />}
                      {!isVisitor && linkAcesso && <a href={linkAcesso} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-accent"><ExternalLink className="h-3.5 w-3.5 text-muted-foreground" /></a>}
                    </div>
                  </FieldRow>
                )}

                {/* LINK DO BLUEPRINT */}
                {(editMode || linkBlueprint) && (
                  <FieldRow label="LINK DO BLUEPRINT" labelClass={labelClass}>
                    <div className={blurClass + ' flex items-center gap-1.5 flex-1'}>
                      <Input value={linkBlueprint || ''} onChange={(e) => setLinkBlueprint(e.target.value)} readOnly={!editMode} className={`text-sm h-9 flex-1 ${fieldBg}`} />
                      {canCopy && linkBlueprint && <CopyButton text={linkBlueprint} />}
                    </div>
                  </FieldRow>
                )}

                {/* GERADOR */}
                {(editMode || gerador) && (
                  <FieldRow label="GERADOR" labelClass={labelClass}>
                    <div className={blurClass + ' flex-1'}>
                      {editMode ? (
                        <Select value={gerador || '_none'} onValueChange={(v) => setGerador(v === '_none' ? '' : v)}>
                          <SelectTrigger className="h-9 text-sm bg-secondary/60 border-border/80 text-foreground"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                          <SelectContent className="bg-card border-border">
                            <SelectItem value="_none">Nenhum</SelectItem>
                            {GENERATOR_OPTIONS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      ) : <Input value={gerador} readOnly className={`text-sm h-9 ${fieldBg}`} />}
                    </div>
                  </FieldRow>
                )}

                {/* LINK DO GPT DE CRIAÇÃO DO PROMPT — multi */}
                {(editMode || linkCriacaoPromptList.some(v => v.trim())) && (
                  <div className="space-y-2">
                    {linkCriacaoPromptList.map((val, idx) => (
                      <FieldRow key={`criacao-${idx}`} label={`${idx + 1}° LINK DO GPT DE CRIAÇÃO DO PROMPT`} labelClass={labelClass}>
                        <div className={blurClass + ' flex items-center gap-1.5 flex-1'}>
                          {editMode ? <GptLinkInput value={val} onChange={(v) => { const copy = [...linkCriacaoPromptList]; copy[idx] = v; setLinkCriacaoPromptList(copy); }} className={`text-sm h-9 ${fieldBg}`} category="prompt_builder" />
                            : <Input value={val} readOnly className={`text-sm h-9 ${fieldBg}`} />}
                          {canCopy && val && <CopyButton text={val} />}
                          {editMode && linkCriacaoPromptList.length > 1 && (
                            <button type="button" onClick={() => setLinkCriacaoPromptList(linkCriacaoPromptList.filter((_, i) => i !== idx))} className="text-destructive hover:text-destructive/80 text-xs px-1">✕</button>
                          )}
                        </div>
                      </FieldRow>
                    ))}
                    {editMode && (
                      <button type="button" onClick={() => setLinkCriacaoPromptList([...linkCriacaoPromptList, ''])} className="text-xs text-primary hover:underline ml-1">+ Adicionar link</button>
                    )}
                  </div>
                )}

                {/* LINK DO GPT USADO — multi */}
                {(editMode || linkGptUsadoList.some(v => v.trim())) && (
                  <div className="space-y-2">
                    {linkGptUsadoList.map((val, idx) => (
                      <FieldRow key={`usado-${idx}`} label={`${idx + 1}° LINK DO GPT USADO`} labelClass={labelClass}>
                        <div className={blurClass + ' flex items-center gap-1.5 flex-1'}>
                          {editMode ? <GptLinkInput value={val} onChange={(v) => { const copy = [...linkGptUsadoList]; copy[idx] = v; setLinkGptUsadoList(copy); }} className={`text-sm h-9 ${fieldBg}`} category="all" />
                            : <Input value={val} readOnly className={`text-sm h-9 ${fieldBg}`} />}
                          {canCopy && val && <CopyButton text={val} />}
                          {editMode && linkGptUsadoList.length > 1 && (
                            <button type="button" onClick={() => setLinkGptUsadoList(linkGptUsadoList.filter((_, i) => i !== idx))} className="text-destructive hover:text-destructive/80 text-xs px-1">✕</button>
                          )}
                        </div>
                      </FieldRow>
                    ))}
                    {editMode && (
                      <button type="button" onClick={() => setLinkGptUsadoList([...linkGptUsadoList, ''])} className="text-xs text-primary hover:underline ml-1">+ Adicionar link</button>
                    )}
                  </div>
                )}

                {/* Knowledge files — with drag-and-drop */}
                {(editMode || knowledgeFiles.length > 0) && (
                  <KnowledgeDropZone editMode={editMode} isEditor={isEditor} labelClass={labelClass} blurClass={blurClass} knowledgeFiles={knowledgeFiles} canDownload={canDownload} onUpload={handleKnowledgeUpload} onDrop={handleKnowledgeBulkDrop} onDownload={handleDownloadFile} onDelete={handleDeleteFile} />
                )}

                {/* PROMPT — main prompt */}
                {(editMode || promptFinal) && (
                  <FieldRow label="PROMPT" labelClass={labelClass}>
                    <div className={blurClass + ' flex-1'}>
                      <Textarea value={promptFinal} onChange={(e) => setPromptFinal(e.target.value)} readOnly={!editMode} rows={6} className={`text-sm resize-none whitespace-pre-wrap ${fieldBg}`} />
                      {canCopy && promptFinal && <div className="flex gap-0.5 mt-1"><CopyButton text={promptFinal} label="Copiar" /><CopyButton text={promptFinal.replace(/\n/g, ' ')} label="Sem quebras" /></div>}
                    </div>
                  </FieldRow>
                )}

                {/* EXTRA PROMPTS — PROMPT 2, 3, ... */}
                {extraPrompts.map((p, i) => (
                  (editMode || p) ? (
                    <div key={i}>
                      <FieldRow label={`PROMPT ${i + 2}`} labelClass={labelClass}>
                        <div className={blurClass + ' flex-1'}>
                          <Textarea value={p} onChange={(e) => { const n = [...extraPrompts]; n[i] = e.target.value; setExtraPrompts(n); }} readOnly={!editMode} rows={3} className={`text-sm resize-none whitespace-pre-wrap ${fieldBg}`} />
                          <div className="flex items-center gap-1 mt-1">
                            {canCopy && p && <CopyButton text={p} label={`Copiar prompt ${i + 2}`} />}
                            {editMode && <button onClick={() => setExtraPrompts(extraPrompts.filter((_, j) => j !== i))} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>}
                          </div>
                        </div>
                      </FieldRow>
                    </div>
                  ) : null
                ))}
                {editMode && <button onClick={() => setExtraPrompts([...extraPrompts, ''])} className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"><Plus className="h-3 w-3" /> Adicionar prompt</button>}

                {/* MODELO RECOMENDADO */}
                {(editMode || modeloRecomendado) && (
                  <FieldRow label="MODELO RECOMENDADO" labelClass={labelClass}>
                    <div className={blurClass + ' flex items-center gap-1.5 flex-1'}>
                      {editMode ? (
                        <Select value={modeloRecomendado || '_none'} onValueChange={(v) => setModeloRecomendado(v === '_none' ? '' : v)}>
                          <SelectTrigger className="h-9 text-sm bg-secondary/60 border-border/80 text-foreground"><SelectValue /></SelectTrigger>
                          <SelectContent className="bg-card border-border">{MODELOS_RECOMENDADOS.map(m => <SelectItem key={m} value={m === 'Nenhum modelo recomendado' ? '_none' : m}>{m}</SelectItem>)}</SelectContent>
                        </Select>
                      ) : <Input value={modeloRecomendado} readOnly className={`text-sm h-9 ${fieldBg}`} />}
                    </div>
                  </FieldRow>
                )}

                {/* ITENS MARCADOS NO GPT (Recursos) */}
                {(editMode || Object.values(recursos).some(Boolean)) && (
                  <div className="space-y-1.5">
                    <label className={`text-xs ${labelClass} uppercase tracking-wider font-medium`}>ITENS MARCADOS NO GPT</label>
                    <div className={blurClass}>
                      {([['webSearch', 'Busca na web'], ['appsBeta', 'Aplicativos (beta)'], ['lousa', 'Lousa'], ['imagens', 'Geração de imagens'], ['codeInterpreter', 'Intérprete de código']] as const).map(([key, label]) => (
                        (editMode || recursos[key]) ? (
                          <div key={key} className="flex items-center justify-between py-1.5">
                            <span className="text-sm text-foreground/80">{label}</span>
                            <Switch checked={recursos[key]} onCheckedChange={(v) => editMode && setRecursos({ ...recursos, [key]: v })} disabled={!editMode} className="scale-90" />
                          </div>
                        ) : null
                      ))}
                    </div>
                  </div>
                )}

                {/* QUEBRA-GELOS */}
                {(editMode || quebraGelos.length > 0) && (
                  <div className="space-y-1.5">
                    <label className={`text-xs ${labelClass} uppercase tracking-wider font-medium`}>QUEBRA-GELOS</label>
                    <div className={blurClass}>
                      {quebraGelos.map((qg, i) => (
                        <div key={i} className="flex items-center gap-2 mt-1">
                          <Input value={qg} onChange={(e) => { const n = [...quebraGelos]; n[i] = e.target.value; setQuebraGelos(n); }} readOnly={!editMode} className={`text-sm h-8 flex-1 ${fieldBg}`} />
                          {canCopy && qg && <CopyButton text={qg} />}
                          {editMode && <button onClick={() => setQuebraGelos(quebraGelos.filter((_, j) => j !== i))} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>}
                        </div>
                      ))}
                      {editMode && <button onClick={() => setQuebraGelos([...quebraGelos, ''])} className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"><Plus className="h-3 w-3" /> Adicionar</button>}
                    </div>
                  </div>
                )}

                {/* Ferramentas vinculadas */}
                {(editMode || toolLinks.length > 0) && (
                  <div className="space-y-1.5">
                    <label className={`text-xs ${labelClass} uppercase tracking-wider font-medium`}>FERRAMENTAS VINCULADAS</label>
                    <div className={blurClass}>
                      {toolLinks.length === 0 && <p className="text-xs text-muted-foreground/50">Nenhuma ferramenta vinculada</p>}
                      {toolLinks.map((link) => {
                        const linkedId = link.source_tool_id === tool?.id ? link.target_tool_id : link.source_tool_id;
                        const linkedTool = allTools.find(t => t.id === linkedId);
                        return (
                          <div key={link.id} className="flex items-center gap-2 rounded-lg px-3 py-2 border border-border/50 bg-secondary/20 mt-1 cursor-pointer hover:bg-secondary/40 transition-colors"
                            onClick={() => { if (linkedTool && onNavigateToTool) onNavigateToTool(linkedTool); }}
                          >
                            <span className="text-sm text-foreground flex-1 truncate">{linkedTool?.titulo || linkedId}</span>
                            <span className="text-[10px] text-muted-foreground/50 px-1.5 py-0.5 rounded bg-secondary/50">{linkedTool?.categoria}</span>
                            {editMode && isEditor && (
                              <button onClick={(e) => { e.stopPropagation(); deleteToolLink(link.id).then(() => fetchToolLinks(tool!.id).then(setToolLinks)); }} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                            )}
                          </div>
                        );
                      })}
                      {editMode && isEditor && (
                        <div className="mt-2 space-y-1">
                          <Input value={linkSearchQuery} onChange={(e) => setLinkSearchQuery(e.target.value)} placeholder="Buscar ferramenta para vincular..." className={`text-sm h-8 ${fieldBg}`} />
                          {linkSearchQuery && (
                            <div className="max-h-[120px] overflow-y-auto rounded-lg border border-border/50 bg-secondary/30">
                              {allTools
                                .filter(t => {
                                  return t.id !== tool?.id && t.titulo.toLowerCase().includes(linkSearchQuery.toLowerCase()) && !toolLinks.some(l => l.source_tool_id === t.id || l.target_tool_id === t.id);
                                })
                                .slice(0, 5)
                                .map(t => (
                                  <button key={t.id} onClick={() => {
                                    createToolLink(tool!.id, t.id).then(() => { fetchToolLinks(tool!.id).then(setToolLinks); setLinkSearchQuery(''); });
                                  }} className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-accent truncate">
                                    {t.titulo}
                                  </button>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* === ARTES / DOCUMENTO — minimal, already have NOME and LINK DE ACESSO === */}

                {/* Status — editor edit mode */}
                {isEditor && editMode && (
                  <div className="space-y-1.5">
                    <label className={`text-xs ${labelClass} uppercase tracking-wider font-medium`}>STATUS</label>
                    <Select value={tool?.status || 'active'} onValueChange={(v) => {
                      if (tool && user) updateTool(tool.id, { status: v } as any, user.id).then(() => onUpdated());
                    }}>
                      <SelectTrigger className="h-9 text-sm bg-secondary/60 border-border/80 text-foreground"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        <SelectItem value="active">Ativa</SelectItem>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="archived">Arquivada</SelectItem>
                        <SelectItem value="outdated">Desatualizada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* HISTÓRICO DE CRIAÇÃO — show for all types */}
                <div className="space-y-1.5">
                  <label className={`text-xs ${labelClass} uppercase tracking-wider font-medium`}>HISTÓRICO DE CRIAÇÃO</label>
                  <div className={blurClass}>
                    {acoes.length === 0 && <p className="text-xs text-muted-foreground/50">Nenhuma ação</p>}
                    {acoes.map((a, i) => {
                      const urlRegex = /(https?:\/\/[^\s]+)/g;
                      const renderClickableText = (text: string) => {
                        if (!text) return null;
                        const parts = text.split(urlRegex);
                        return parts.map((part, idx) =>
                          urlRegex.test(part) ? (
                            <a key={idx} href={part} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80 break-all cursor-pointer" onClick={(e) => e.stopPropagation()}>{part}</a>
                          ) : <span key={idx}>{part}</span>
                        );
                      };
                      return (
                        <div key={a.id || i} className="flex items-start gap-2 rounded-lg px-3 py-2 border border-border/50 bg-secondary/20 mt-1">
                          <div className="flex-1 space-y-1">
                            {editMode ? (
                              <>
                                <Input value={a.titulo} onChange={(e) => { const n = [...acoes]; n[i] = { ...a, titulo: e.target.value }; setAcoes(n); }} placeholder="Título" className={`text-sm h-8 ${fieldBg}`} />
                                <Input value={a.descricao} onChange={(e) => { const n = [...acoes]; n[i] = { ...a, descricao: e.target.value }; setAcoes(n); }} placeholder="Descrição" className={`text-sm h-8 ${fieldBg}`} />
                              </>
                            ) : (
                              <>
                                <p className="text-sm font-medium select-text">{renderClickableText(a.titulo)}</p>
                                <p className="text-sm text-muted-foreground select-text break-all">{renderClickableText(a.descricao)}</p>
                              </>
                            )}
                          </div>
                          {canCopy && <CopyButton text={`${a.titulo}: ${a.descricao}`} />}
                          {editMode && <button onClick={() => setAcoes(acoes.filter((_, j) => j !== i))} className="mt-1 text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>}
                        </div>
                      );
                    })}
                    {editMode && <button onClick={() => setAcoes([...acoes, { id: crypto.randomUUID(), titulo: '', descricao: '' }])} className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"><Plus className="h-3 w-3" /> Adicionar ação</button>}
                  </div>
                </div>

                {/* Audit — editor only */}
                {isEditor && (
                  <div className={`border-t ${sectionBorder} pt-4`}>
                    <button onClick={() => setShowAudit(!showAudit)} className={`flex items-center gap-2 text-xs ${labelClass} uppercase tracking-wider font-medium hover:text-foreground w-full`}>
                      <BarChart3 className="h-3.5 w-3.5" /> Auditoria de acesso <span className="ml-auto text-muted-foreground/30">{showAudit ? '▲' : '▼'}</span>
                    </button>
                    {showAudit && (
                      <div className="mt-3 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          {[{ label: 'Total', value: auditStats.total }, { label: 'Estrutura', value: auditStats.structures }, { label: 'O QUE FAZ?', value: auditStats.whatDoes }, { label: 'Acessar', value: auditStats.access }, { label: 'Contato', value: auditStats.contact }, { label: 'Views', value: auditStats.views }].map(s => (
                            <div key={s.label} className="rounded-lg p-2 text-center bg-secondary/30 border border-border/30">
                              <p className="text-lg font-bold text-foreground">{s.value}</p>
                              <p className="text-[10px] text-muted-foreground/60">{s.label}</p>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-1 max-h-[200px] overflow-y-auto">
                          {auditLogs.slice(0, 20).map(log => (
                            <div key={log.id} className="flex items-center gap-2 text-[11px] px-2 py-1.5 rounded bg-secondary/20 border border-border/30">
                              <span className="text-muted-foreground/50 min-w-[100px]">{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                              <span className="text-foreground/70">{log.event_type}</span>
                              <span className="text-muted-foreground/40">{log.access_profile}</span>
                              <span className="text-muted-foreground/30 ml-auto">{log.os_name}/{log.browser_name}</span>
                            </div>
                          ))}
                          {auditLogs.length === 0 && <p className="text-xs text-muted-foreground/40 text-center py-2">Nenhum acesso registrado</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* ====== PROCESSO E RESULTADO TAB — stays dark ====== */}
            <TabsContent value="processo" className="space-y-6 px-6 py-5">
              {/* Designs category: show profile image preview */}
              {(categoria === 'Designs' || categoria === 'Arte') && tool?.image_url && (
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Preview da imagem de perfil</label>
                  <div className="rounded-xl overflow-hidden border border-border/30 max-w-[300px]">
                    <img src={tool.image_url} alt={tool.titulo} className="w-full h-auto object-cover cursor-pointer" onClick={() => setLightboxUrl(tool.image_url!)} />
                  </div>
                </div>
              )}
              <PrintBlock label="Print do processo" description="Mostra ao leitor como executar esta ferramenta." imageUrl={printProcessoUrl} onUpload={(e) => handlePrintUpload('print_processo_url', e)} onRemove={() => handleRemovePrint('print_processo_url')} onView={(url) => setLightboxUrl(url)} editMode={editMode} isEditor={isEditor} onDrop={(file) => handlePrintDrop('print_processo_url', file)} />
              <PrintBlock label="Print do resultado" description="Mostra ao leitor qual resultado esta ferramenta entrega." imageUrl={printResultadoUrl} onUpload={(e) => handlePrintUpload('print_resultado_url', e)} onRemove={() => handleRemovePrint('print_resultado_url')} onView={(url) => setLightboxUrl(url)} editMode={editMode} isEditor={isEditor} onDrop={(file) => handlePrintDrop('print_resultado_url', file)} />
              
              {/* Test Data Upload Section */}
              <TestDataBlock toolId={tool.id} editMode={editMode} isEditor={isEditor} labelClass={labelClass} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 space-y-3">
          {editMode && isEditor && (
            <div className="flex gap-2">
              <div className="flex items-center gap-2 mr-auto">
                <Switch checked={shouldUpdateDate} onCheckedChange={setShouldUpdateDate} />
                <span className="text-xs text-muted-foreground">Atualizar data</span>
              </div>
              <Button onClick={handleSave} disabled={saving} className="flex-1 h-10 rounded-xl"><Save className="h-4 w-4 mr-1" /> Salvar</Button>
              <Button variant="outline" onClick={() => setEditMode(false)} className="h-10 rounded-xl"><RotateCcw className="h-4 w-4 mr-1" /> Cancelar</Button>
              <Button variant="outline" onClick={handleDuplicate} disabled={duplicating} className="h-10 rounded-xl" title="Duplicar ferramenta"><CopyIcon className="h-4 w-4" /></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="destructive" className="h-10 rounded-xl"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader><AlertDialogTitle>Excluir ferramenta?</AlertDialogTitle><AlertDialogDescription>A ferramenta "{titulo}" será marcada como excluída.</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
          <div className="flex gap-2">
            {isVisitor && <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex-1"><Button variant="outline" className="w-full h-10 rounded-xl"><MessageCircle className="h-4 w-4 mr-2" /> Entrar em contato</Button></a>}
            {!isVisitor && linkAcesso && <a href={linkAcesso} target="_blank" rel="noopener noreferrer" className="flex-1" onClick={() => logToolAccess(tool.id, 'access_tool_link', isEditor ? 'editor' : 'leitor', user?.id, user?.email)}><Button variant="outline" className="w-full h-10 rounded-xl"><ExternalLink className="h-4 w-4 mr-2" /> Acessar ferramenta</Button></a>}
            {canCopy && <Button onClick={handleExportTxt} variant="outline" className="flex-1 h-10 rounded-xl"><FileDown className="h-4 w-4 mr-2" /> Exportar Estrutura</Button>}
            {isEditor && (
              <ExportToolButton 
                toolData={toolExportData} 
                fileName={titulo}
                className="h-10 rounded-xl flex-1"
              />
            )}
            {isEditor && <Button onClick={handleExportTxt} variant="outline" className="h-10 rounded-xl" title="Exportar TXT"><FileDown className="h-4 w-4" /></Button>}

          </div>
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 bg-background/95 border-border">
          {lightboxUrl && <img src={lightboxUrl} alt="Preview" className="w-full h-full object-contain max-h-[85vh]" />}
        </DialogContent>
      </Dialog>
    </>
  );
};

// Helper components
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getGradient(name: string): string {
  const hash = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const gradients = ['from-blue-600/40 to-cyan-600/20', 'from-purple-600/40 to-pink-600/20', 'from-emerald-600/40 to-teal-600/20', 'from-emerald-600/40 to-green-600/20', 'from-rose-600/40 to-red-600/20', 'from-indigo-600/40 to-violet-600/20'];
  return gradients[hash % gradients.length];
}

interface PrintBlockProps {
  label: string; description: string; imageUrl: string;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void; onView: (url: string) => void;
  editMode: boolean; isEditor: boolean;
  onDrop?: (file: File) => void;
}

const PrintBlock: React.FC<PrintBlockProps> = ({ label, description, imageUrl, onUpload, onRemove, onView, editMode, isEditor, onDrop }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const dragCounter = React.useRef(0);

  const handleDragEnter = (e: React.DragEvent) => { if (!isEditor || !editMode) return; e.preventDefault(); e.stopPropagation(); dragCounter.current++; if (e.dataTransfer.types.includes('Files')) setIsDragging(true); };
  const handleDragOver = (e: React.DragEvent) => { if (!isEditor || !editMode) return; e.preventDefault(); e.stopPropagation(); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current--; if (dragCounter.current <= 0) { dragCounter.current = 0; setIsDragging(false); } };
  const handleDrop2 = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current = 0; setIsDragging(false); if (!isEditor || !editMode || !onDrop) return; const files = e.dataTransfer.files; if (files.length > 0) onDrop(files[0]); };

  return (
    <div className="space-y-2" onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop2}>
      <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{label}</label>
      <p className="text-xs text-muted-foreground/60">{description}</p>
      <div className={`rounded-xl border overflow-hidden relative transition-all ${isDragging ? 'ring-2 ring-primary scale-[1.01]' : ''}`} style={{ background: 'hsl(0 0% 100% / 0.02)', borderColor: isDragging ? 'hsl(210 100% 60% / 0.5)' : 'hsl(var(--border))' }}>
        {isDragging && <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none rounded-xl" style={{ background: 'hsl(210 100% 60% / 0.12)' }}><p className="text-sm font-medium text-primary">Solte para enviar</p></div>}
        {imageUrl ? (
          <div className="relative">
            <img src={imageUrl} alt={label} className="w-full max-h-[300px] object-contain cursor-pointer" onClick={() => onView(imageUrl)} />
            {editMode && isEditor && (
              <div className="absolute bottom-2 right-2 flex gap-2">
                <label className="flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-medium cursor-pointer" style={{ background: 'hsl(0 0% 0% / 0.7)', color: 'hsl(0 0% 85%)' }}><Upload className="h-3 w-3" /> Substituir<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onUpload} /></label>
                <button onClick={onRemove} className="flex h-8 items-center gap-1 rounded-lg px-3 text-xs font-medium" style={{ background: 'hsl(0 0% 0% / 0.7)', color: 'hsl(0 72% 55%)' }}><Trash2 className="h-3 w-3" /> Remover</button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground/30">
            <ImageIcon className="h-10 w-10 mb-2" />
            <p className="text-xs">{editMode && isEditor ? 'Arraste uma imagem ou clique para enviar' : 'Nenhum print adicionado'}</p>
            {editMode && isEditor && <label className="mt-3 flex items-center gap-1 text-xs text-primary cursor-pointer hover:underline"><Upload className="h-3 w-3" /> Enviar imagem<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onUpload} /></label>}
          </div>
        )}
      </div>
    </div>
  );
};

// Knowledge files with drag-and-drop
interface KnowledgeDropZoneProps {
  editMode: boolean; isEditor: boolean; labelClass: string; blurClass: string;
  knowledgeFiles: import('@/types/tool').KnowledgeFile[];
  canDownload: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (files: File[]) => void;
  onDownload: (kf: import('@/types/tool').KnowledgeFile) => void;
  onDelete: (kf: import('@/types/tool').KnowledgeFile) => void;
}

const KnowledgeDropZone: React.FC<KnowledgeDropZoneProps> = ({ editMode, isEditor, labelClass, blurClass, knowledgeFiles, canDownload, onUpload, onDrop, onDownload, onDelete }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const dragCounter = React.useRef(0);

  const handleDragEnter = (e: React.DragEvent) => { if (!isEditor || !editMode) return; e.preventDefault(); e.stopPropagation(); dragCounter.current++; if (e.dataTransfer.types.includes('Files')) setIsDragging(true); };
  const handleDragOver = (e: React.DragEvent) => { if (!isEditor || !editMode) return; e.preventDefault(); e.stopPropagation(); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current--; if (dragCounter.current <= 0) { dragCounter.current = 0; setIsDragging(false); } };
  const handleDrop2 = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current = 0; setIsDragging(false); if (!isEditor || !editMode) return; const files = Array.from(e.dataTransfer.files); if (files.length > 0) onDrop(files); };

  return (
    <div className={`space-y-1.5 relative rounded-xl transition-all ${isDragging ? 'ring-2 ring-primary' : ''}`} onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop2} style={isDragging ? { background: 'hsl(210 100% 60% / 0.06)' } : {}}>
      {isDragging && <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none rounded-xl"><p className="text-sm font-medium text-primary">Solte para enviar arquivo</p></div>}
      <div className="flex items-center justify-between">
        <label className={`text-xs ${labelClass} uppercase tracking-wider font-medium`}>ARQUIVOS BASE DE CONHECIMENTO</label>
        {editMode && isEditor && <label className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"><Upload className="h-3 w-3" /> Upload<input type="file" accept=".pdf,.txt,.docx,.md,.xlsx,.xls,.csv,.json,.apk" multiple className="hidden" onChange={onUpload} /></label>}
      </div>
      <div className={blurClass}>
        {knowledgeFiles.length === 0 && <p className="text-xs text-muted-foreground/50">{editMode && isEditor ? 'Arraste arquivos aqui ou clique em Upload' : 'Nenhum arquivo'}</p>}
        {knowledgeFiles.map(kf => (
          <div key={kf.id} className="flex items-center justify-between rounded-lg px-3 py-2 border border-border/50 bg-secondary/20 mt-1">
            <div className="flex-1 min-w-0"><p className="text-sm text-foreground truncate">{kf.file_name}</p><p className="text-[10px] text-muted-foreground/50">{new Date(kf.uploaded_at).toLocaleDateString()}</p></div>
            <div className="flex items-center gap-1 ml-2">
              {canDownload && <button onClick={() => onDownload(kf)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent"><Download className="h-3.5 w-3.5 text-muted-foreground" /></button>}
              {editMode && isEditor && <button onClick={() => onDelete(kf)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FieldRow: React.FC<{ label: string; labelClass: string; children: React.ReactNode }> = ({ label, labelClass, children }) => (
  <div className="space-y-1.5">
    <label className={`text-xs ${labelClass} uppercase tracking-wider font-medium block`}>{label}</label>
    <div className="flex items-center gap-1.5">{children}</div>
  </div>
);

// Test data upload for Processo tab
interface TestDataBlockProps {
  toolId: string;
  editMode: boolean;
  isEditor: boolean;
  labelClass: string;
}

const TestDataBlock: React.FC<TestDataBlockProps> = ({ toolId, editMode, isEditor, labelClass }) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const [testText, setTestText] = React.useState('');
  const [attachments, setAttachments] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const dragCounter = React.useRef(0);

  const loadAttachments = React.useCallback(async () => {
    try {
      const { data } = await (await import('@/integrations/supabase/client')).supabase
        .from('process_attachments' as any)
        .select('*')
        .eq('process_id', toolId)
        .order('uploaded_at', { ascending: false });
      setAttachments((data || []) as any[]);
    } catch {}
  }, [toolId]);

  React.useEffect(() => { loadAttachments(); }, [loadAttachments]);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const path = `test-data/${toolId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('process-files').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('process-files').getPublicUrl(path);
      await supabase.from('process_attachments' as any).insert({
        process_id: toolId,
        file_name: file.name,
        file_url: urlData.publicUrl,
      } as any);
      await loadAttachments();
      toast({ description: `Arquivo "${file.name}" enviado` });
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current++; if (e.dataTransfer.types.includes('Files')) setIsDragging(true); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dragCounter.current--; if (dragCounter.current <= 0) { dragCounter.current = 0; setIsDragging(false); } };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); dragCounter.current = 0; setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(f => handleFileUpload(f));
  };

  const handleDeleteAttachment = async (att: any) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.from('process_attachments' as any).delete().eq('id', att.id);
      await loadAttachments();
      toast({ description: 'Arquivo removido' });
    } catch {}
  };

  const canManage = isEditor && editMode;

  return (
    <div className="space-y-3">
      <label className={`text-xs ${labelClass} uppercase tracking-wider font-medium`}>DADOS PARA TESTE</label>
      {canManage && (
        <p className="text-xs text-muted-foreground/60">Envie arquivos (Excel, CSV, PDF, DOCX) ou digite texto para testar a ferramenta.</p>
      )}

      {/* Text input — only editors in edit mode */}
      {canManage && (
        <textarea
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          placeholder="Digite ou cole dados de teste aqui..."
          rows={4}
          className="w-full rounded-xl border border-border/50 bg-secondary/30 p-3 text-sm text-foreground resize-none whitespace-pre-wrap focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
      )}

      {/* Drop zone — only editors in edit mode */}
      {canManage && (
        <div
          className={`rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border/40 hover:border-border/60'}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => {
            const inp = document.createElement('input');
            inp.type = 'file';
            inp.multiple = true;
            inp.accept = '.xlsx,.xls,.csv,.pdf,.docx,.doc,.txt,.json,.md';
            inp.onchange = (ev: any) => {
              const files = Array.from(ev.target.files || []) as File[];
              files.forEach(f => handleFileUpload(f));
            };
            inp.click();
          }}
        >
          <Upload className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground/50">{isDragging ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}</p>
          <p className="text-[10px] text-muted-foreground/30 mt-1">Excel, CSV, PDF, DOCX, TXT, JSON</p>
        </div>
      )}

      {loading && <p className="text-xs text-muted-foreground animate-pulse">Enviando...</p>}

      {/* Attached files — visible to everyone, downloadable */}
      {attachments.length > 0 ? (
        <div className="space-y-1">
          {attachments.map((att: any) => (
            <div key={att.id} className="flex items-center justify-between rounded-lg px-3 py-2 border border-border/50 bg-secondary/20">
              <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-foreground truncate flex-1 hover:text-primary transition-colors">
                {att.file_name}
              </a>
              <div className="flex items-center gap-1 ml-2">
                <a href={att.file_url} download className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent" title="Baixar"><Download className="h-3.5 w-3.5 text-muted-foreground" /></a>
                {canManage && (
                  <button onClick={() => handleDeleteAttachment(att)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !canManage && <p className="text-xs text-muted-foreground/40 italic">Sem dados de teste anexados.</p>
      )}
    </div>
  );
};

export default ConfigDrawer;

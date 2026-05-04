import React, { useState, useEffect } from 'react';

const LAST_TOOL_PREFS_KEY = 'wemerson:last-tool-prefs';
type LastToolPrefs = { categoria?: string; setor?: string };

function loadLastToolPrefs(): LastToolPrefs {
  try {
    const raw = localStorage.getItem(LAST_TOOL_PREFS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveLastToolPrefs(prefs: LastToolPrefs) {
  try { localStorage.setItem(LAST_TOOL_PREFS_KEY, JSON.stringify(prefs)); } catch { /* noop */ }
}
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Link2, Loader2, AlertCircle, CheckCircle2, Search, Upload, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { createTool } from '@/lib/api';
import { CATEGORIAS, SETORES, categoriaToToolType } from '@/types/tool';
import { parseTxtImport, txtToToolData, downloadTxtTemplate } from '@/lib/txtTemplates';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface DetectedData {
  title: string;
  description: string;
  image: string | null;
  url: string;
  categoria: string;
  confidence: 'alta' | 'media' | 'baixa';
  platform: string;
}

function detectFromUrl(url: string): DetectedData {
  const lower = url.toLowerCase();
  let categoria = 'Sistema';
  let confidence: 'alta' | 'media' | 'baixa' = 'baixa';
  let platform = 'Desconhecido';

  if (lower.includes('chat.openai.com') || lower.includes('chatgpt.com')) {
    categoria = 'GPT'; confidence = 'alta'; platform = 'ChatGPT';
  } else if (lower.includes('make.com') || lower.includes('integromat')) {
    categoria = 'Automação'; confidence = 'alta'; platform = 'Make';
  } else if (lower.includes('zapier.com')) {
    categoria = 'Automação'; confidence = 'alta'; platform = 'Zapier';
  } else if (lower.includes('canva.com') || lower.includes('figma.com') || lower.includes('midjourney')) {
    categoria = 'Arte'; confidence = 'media'; platform = 'Design Tool';
  } else if (lower.includes('docs.google') || lower.includes('notion.so')) {
    categoria = 'Documento'; confidence = 'media'; platform = 'Docs';
  }

  let title = '';
  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split('/').filter(Boolean);
    title = pathParts[pathParts.length - 1]?.replace(/[-_]/g, ' ') || parsed.hostname.replace('www.', '');
    title = title.charAt(0).toUpperCase() + title.slice(1);
  } catch {
    title = 'Nova Ferramenta';
  }

  return { title, description: '', image: null, url, categoria, confidence, platform };
}

const PostarFerramenta: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [url, setUrl] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState<DetectedData | null>(null);
  const [saving, setSaving] = useState(false);
  const [txtResult, setTxtResult] = useState<Record<string, string> | null>(null);

  const [draftTitle, setDraftTitle] = useState('');
  const [draftDesc, setDraftDesc] = useState('');
  const [draftCategoria, setDraftCategoria] = useState('');
  const [draftSetor, setDraftSetor] = useState('');

  // Restore last used categoria/setor on mount
  useEffect(() => {
    const prefs = loadLastToolPrefs();
    if (prefs.categoria) setDraftCategoria(prefs.categoria);
    if (prefs.setor) setDraftSetor(prefs.setor);
    console.log('[PostarFerramenta:restorePrefs]', prefs);
  }, []);

  const handleDetect = async () => {
    if (!url.trim()) return;
    let validUrl = url.trim();
    if (!validUrl.startsWith('http')) validUrl = 'https://' + validUrl;
    try { new URL(validUrl); } catch {
      toast({ description: 'URL inválida', variant: 'destructive' });
      return;
    }
    setDetecting(true);
    await new Promise(r => setTimeout(r, 1200));
    const data = detectFromUrl(validUrl);
    setDetected(data);
    setDraftTitle(data.title);
    setDraftDesc(data.description);
    // Preserve last-used categoria if already set; otherwise use auto-detected
    setDraftCategoria((prev) => prev || data.categoria);
    setDetecting(false);
  };

  const handleTxtUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    const parsed = parseTxtImport(content);
    const toolData = txtToToolData(parsed);
    setTxtResult(parsed);
    setDraftTitle(toolData.titulo.toUpperCase());
    setDraftDesc('');
    // Preserve last-used categoria if already set; otherwise use TXT-detected
    setDraftCategoria((prev) => prev || toolData.categoria || '');
    setDetected({
      title: toolData.titulo,
      description: '',
      image: null,
      url: toolData.link_acesso_original || '',
      categoria: toolData.categoria || '',
      confidence: toolData.titulo ? 'alta' : 'baixa',
      platform: 'TXT Import',
    });
    toast({ description: `TXT importado: ${Object.keys(parsed).length - 1} campos detectados` });
  };

  const handleSaveDraft = async () => {
    if (!user) {
      toast({ description: 'Faça login para salvar', variant: 'destructive' });
      return;
    }
    if (!draftTitle.trim() || !draftCategoria) {
      toast({ description: 'Preencha ao menos o título e categoria', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const toolPayload: any = {
        titulo: draftTitle.trim().toUpperCase(),
        descricao: draftDesc,
        status: 'draft',
        tool_type: categoriaToToolType(draftCategoria),
        categoria: draftCategoria || null,
        setores: draftSetor || null,
        link_acesso_original: detected?.url || url,
      };
      if (txtResult) {
        const extra = txtToToolData(txtResult);
        Object.assign(toolPayload, {
          funcao: extra.funcao || null,
          instrucoes: extra.instrucoes || null,
          link_contexto: extra.link_contexto || null,
          link_criacao_prompt: extra.link_criacao_prompt || null,
          link_contexto_transformacao_base_conhecimento: extra.link_contexto_transformacao_base_conhecimento || null,
          link_gpt_transformacao_base_conhecimento: extra.link_gpt_transformacao_base_conhecimento || null,
          prompt_final: extra.prompt_final || null,
          modelo_recomendado: extra.modelo_recomendado || null,
          credential_email: extra.credential_email || null,
          credential_senha: extra.credential_senha || null,
          status: extra.status || 'draft',
        });
      }
      await createTool(toolPayload, user.id);
      const prefs: LastToolPrefs = { categoria: draftCategoria, setor: draftSetor };
      saveLastToolPrefs(prefs);
      console.log('[PostarFerramenta:savePrefs]', prefs);
      toast({ description: 'Rascunho salvo com sucesso' });
      navigate('/');
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const text = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
    if (text) {
      setUrl(text);
      setDetected(null);
      setTxtResult(null);
    }
  };

  const confidenceColors = {
    alta: { bg: 'rgba(52,245,163,0.15)', border: '#34F5A3', text: '#34F5A3', label: 'Alta confiança' },
    media: { bg: 'rgba(255,138,0,0.15)', border: '#FF8A00', text: '#FF8A00', label: 'Média confiança' },
    baixa: { bg: 'rgba(255,100,100,0.15)', border: '#FF6464', text: '#FF6464', label: 'Baixa confiança' },
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50">
        <div className="mx-auto flex max-w-[800px] items-center px-6 py-3 gap-3">
          <button onClick={() => navigate('/')} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Postar ferramenta</h1>
        </div>
      </div>

      <div className="mx-auto max-w-[800px] px-6 py-10 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Postar ferramenta</h2>
          <p className="text-sm text-muted-foreground">
            Cole ou arraste o link, ou faça upload de um TXT modelo para gerar um rascunho automático.
          </p>
        </div>

        {/* Three entry methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border-2 border-dashed p-6 text-center transition-all" style={{ borderColor: 'hsl(0 0% 100% / 0.12)', background: 'hsl(0 0% 100% / 0.02)' }}>
            <Link2 className="h-6 w-6 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-xs font-medium text-foreground mb-3">Colar link</p>
            <div className="flex items-center gap-2">
              <Input value={url} onChange={(e) => { setUrl(e.target.value); setDetected(null); setTxtResult(null); }} placeholder="https://..." className="h-9 text-sm bg-secondary/50 border-border flex-1" onKeyDown={(e) => e.key === 'Enter' && handleDetect()} />
              <Button onClick={handleDetect} disabled={detecting || !url.trim()} size="sm" className="h-9 px-3 font-bold text-white" style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', boxShadow: '0 4px 12px rgba(22,163,74,0.35)' }}>
                {detecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-dashed p-6 text-center transition-all flex flex-col items-center justify-center" style={{ borderColor: 'hsl(0 0% 100% / 0.12)', background: 'hsl(0 0% 100% / 0.02)' }} onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
            <Link2 className="h-6 w-6 mb-3 text-muted-foreground/40" />
            <p className="text-xs font-medium text-foreground mb-1">Arrastar link</p>
            <p className="text-[10px] text-muted-foreground/50">Arraste um link para esta área</p>
          </div>

          <div className="rounded-2xl border-2 border-dashed p-6 text-center transition-all flex flex-col items-center justify-center" style={{ borderColor: 'hsl(0 0% 100% / 0.12)', background: 'hsl(0 0% 100% / 0.02)' }}>
            <FileText className="h-6 w-6 mb-3 text-muted-foreground/40" />
            <p className="text-xs font-medium text-foreground mb-3">Upload TXT</p>
            <label className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium cursor-pointer transition-all" style={{ background: 'hsl(0 0% 100% / 0.06)', border: '1px solid hsl(0 0% 100% / 0.10)', color: 'hsl(0 0% 85%)' }}>
              <Upload className="h-3.5 w-3.5" /> Escolher arquivo
              <input type="file" accept=".txt" className="hidden" onChange={handleTxtUpload} />
            </label>
          </div>
        </div>

        {/* TXT template export */}
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-medium transition-all hover:bg-accent" style={{ background: 'hsl(0 0% 100% / 0.06)', border: '1px solid hsl(0 0% 100% / 0.10)', color: 'hsl(0 0% 75%)' }}>
                <Download className="h-3.5 w-3.5" /> Baixar modelo TXT
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card border-border">
              {CATEGORIAS.map(c => (
                <DropdownMenuItem key={c.nome} onClick={() => downloadTxtTemplate(c.toolType)}>
                  {c.nome}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {detecting && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Analisando link e detectando metadados...</p>
          </div>
        )}

        {detected && !detecting && (
          <div className="rounded-2xl border p-6 space-y-5" style={{ background: 'hsl(0 0% 100% / 0.03)', borderColor: 'hsl(0 0% 100% / 0.08)' }}>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium" style={{ background: confidenceColors[detected.confidence].bg, border: `1px solid ${confidenceColors[detected.confidence].border}`, color: confidenceColors[detected.confidence].text }}>
                {detected.confidence === 'alta' ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                {confidenceColors[detected.confidence].label}
              </span>
              <span className="text-xs text-muted-foreground">Plataforma: {detected.platform}</span>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Título</label>
                <Input value={draftTitle} onChange={(e) => setDraftTitle(e.target.value.toUpperCase())} className="h-9 text-sm bg-secondary/50 border-border" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Descrição</label>
                <Input value={draftDesc} onChange={(e) => setDraftDesc(e.target.value)} placeholder="Descrição curta..." className="h-9 text-sm bg-secondary/50 border-border" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Categoria *</label>
                  <Select value={draftCategoria || '_none'} onValueChange={(v) => setDraftCategoria(v === '_none' ? '' : v)}>
                    <SelectTrigger className="h-9 text-sm bg-secondary/50 border-border"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="_none">Selecionar...</SelectItem>
                      {CATEGORIAS.map(c => <SelectItem key={c.nome} value={c.nome}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Setor / Departamento</label>
                  <Select value={draftSetor || '_none'} onValueChange={(v) => setDraftSetor(v === '_none' ? '' : v)}>
                    <SelectTrigger className="h-9 text-sm bg-secondary/50 border-border"><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="_none">Sem setor</SelectItem>
                      {SETORES.filter(s => s !== 'Todas as ferramentas').map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {detected.url && (
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">URL original</label>
                  <Input value={detected.url} readOnly className="h-9 text-sm bg-transparent border-transparent cursor-default text-muted-foreground" />
                </div>
              )}

              {txtResult && (
                <div className="space-y-1.5 border-t border-border/50 pt-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Campos importados do TXT</p>
                  <div className="grid grid-cols-1 gap-1 max-h-[200px] overflow-y-auto">
                    {Object.entries(txtResult).filter(([k]) => k !== '_type').map(([k, v]) => (
                      <div key={k} className="flex items-start gap-2 text-xs py-1">
                        <span className="text-muted-foreground/60 min-w-[180px] font-medium">{k}</span>
                        <span className="text-foreground/80 truncate">{v || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button onClick={handleSaveDraft} disabled={saving} className="flex-1 h-10 font-bold text-white uppercase tracking-[0.5px]" style={{ background: 'linear-gradient(135deg, #22C55E, #16A34A)', boxShadow: '0 4px 12px rgba(22,163,74,0.35)' }}>
                {saving ? 'Salvando...' : 'Salvar rascunho'}
              </Button>
              <Button variant="outline" onClick={() => { setDetected(null); setTxtResult(null); }} className="h-10">Cancelar</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostarFerramenta;

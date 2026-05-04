import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Copy, Download, Trash2, Clock, FileText, Link2, MessageSquare, Loader2, CloudUpload, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchWeChatShares, createWeChatShare, updateWeChatShare, deleteWeChatShare, uploadWeChatFile } from '@/lib/api';
import { copyToClipboard } from '@/lib/clipboard';
import { toast } from '@/hooks/use-toast';
import { sendAudit } from '@/lib/audit';

interface ChatDocsPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface WeChatShare {
  id: string;
  content_type: string;
  text_content: string | null;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  expires_at: string;
  shared_by_name: string | null;
  device_info: string | null;
}

const ChatDocsPopup: React.FC<ChatDocsPopupProps> = ({ open, onOpenChange }) => {
  const { isEditor, user } = useAuth();
  const [shares, setShares] = useState<WeChatShare[]>([]);
  const [textInput, setTextInput] = useState('');
  const [sending, setSending] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = React.useRef(0);
  const currentDraftId = useRef<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getSharerInfo = () => {
    if (user?.email) {
      const name = user.email.replace(/@.*$/, '');
      return { shared_by_name: name, device_info: null };
    }
    const ua = navigator.userAgent;
    const browser = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/?(\S+)/)?.[1] || 'Browser';
    const os = ua.match(/(Windows|Mac|Linux|Android|iOS|iPhone)/i)?.[1] || 'Desconhecido';
    return { shared_by_name: null, device_info: `${browser} · ${os}` };
  };

  useEffect(() => {
    if (open) loadShares();
    if (!open) {
      currentDraftId.current = null;
      setTextInput('');
      setSaveStatus('idle');
    }
  }, [open]);

  const loadShares = async () => {
    try {
      const data = await fetchWeChatShares();
      setShares(data);
    } catch {}
  };

  const autoSave = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setSaveStatus('saving');
    try {
      const isLink = /^https?:\/\//.test(trimmed);
      const contentType = isLink ? 'link' : 'text';

      if (currentDraftId.current) {
        await updateWeChatShare(currentDraftId.current, {
          text_content: trimmed,
          content_type: contentType,
        });
      } else {
        const created: any = await createWeChatShare({
          content_type: contentType,
          text_content: trimmed,
          ...getSharerInfo(),
        });
        currentDraftId.current = created.id;
      }
      await loadShares();
      setSaveStatus('saved');
      sendAudit('chatdocs_texto', `Texto salvo no ChatDocs`, user?.email || 'Visitante', `Conteúdo: ${trimmed.slice(0, 100)}`);
      setTimeout(() => setSaveStatus((s) => s === 'saved' ? 'idle' : s), 2000);
    } catch {
      setSaveStatus('idle');
    }
  }, [user]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTextInput(val);
    setSaveStatus('idle');

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!val.trim()) return;

    debounceTimer.current = setTimeout(() => {
      autoSave(val);
    }, 1500);
  };

  const handleMultiFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setUploading(true);
    for (let i = 0; i < fileArray.length; i++) {
      setUploadProgress(`Enviando ${i + 1}/${fileArray.length}...`);
      try {
        const fileUrl = await uploadWeChatFile(fileArray[i]);
        await createWeChatShare({
          content_type: 'file',
          file_url: fileUrl,
          file_name: fileArray[i].name,
          ...getSharerInfo(),
        });
      } catch (err: any) {
        toast({ description: `Erro ao enviar ${fileArray[i].name}: ${err.message}`, variant: 'destructive' });
      }
    }
    await loadShares();
    const fileNames = fileArray.map(f => f.name).join(', ');
    toast({ description: `${fileArray.length} arquivo(s) enviado(s)` });
    sendAudit('chatdocs_arquivo', `Arquivo(s) enviado(s) no ChatDocs`, user?.email || 'Visitante', `Arquivos: ${fileNames}`);
    setUploading(false);
    setUploadProgress('');
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await handleMultiFileUpload(files);
    e.target.value = '';
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteWeChatShare(id);
      await loadShares();
      toast({ description: 'Item removido' });
    } catch (err: any) {
      toast({ description: err.message, variant: 'destructive' });
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current <= 0) { dragCounter.current = 0; setIsDragging(false); }
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) await handleMultiFileUpload(files);
  };

  const getRemainingTime = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expirado';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const getContentIcon = (type: string) => {
    if (type === 'file') return <FileText className="h-4 w-4" />;
    if (type === 'link') return <Link2 className="h-4 w-4" />;
    return <MessageSquare className="h-4 w-4" />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 border-0 rounded-2xl" style={{ background: 'hsl(220 20% 7%)' }} onInteractOutside={() => onOpenChange(false)}>
        {/* Gradient top bar */}
        <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl" style={{ background: 'linear-gradient(90deg, hsl(210 100% 55%), hsl(260 80% 60%), hsl(210 100% 55%))' }} />

        {/* Header — minimal */}
        <div className="relative px-6 pt-6 pb-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, hsl(210 100% 55% / 0.2), hsl(260 80% 60% / 0.2))', border: '1px solid hsl(210 100% 55% / 0.3)' }}>
              <CloudUpload className="h-6 w-6" style={{ color: 'hsl(210 100% 65%)' }} />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">
          {/* Text/Link Input */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1" style={{ background: 'hsl(0 0% 100% / 0.06)' }} />
              <span className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground/50">Texto ou Link</span>
              <div className="h-px flex-1" style={{ background: 'hsl(0 0% 100% / 0.06)' }} />
            </div>
            <div className="relative">
              <Textarea
                value={textInput}
                onChange={handleTextChange}
                placeholder=""
                className="min-h-[80px] text-sm border-0 text-foreground resize-none rounded-xl placeholder:text-muted-foreground/40 pr-10"
                style={{ background: 'hsl(0 0% 100% / 0.04)' }}
              />
              {saveStatus !== 'idle' && (
                <div className="absolute bottom-2 right-2 flex items-center gap-1">
                  {saveStatus === 'saving' && <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: 'hsl(210 100% 65%)' }} />}
                  {saveStatus === 'saved' && <Check className="h-3.5 w-3.5" style={{ color: 'hsl(142 71% 45%)' }} />}
                  <span className="text-[10px] text-muted-foreground/50">
                    {saveStatus === 'saving' ? 'Salvando...' : 'Salvo'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* File Drop Zone — prominent */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1" style={{ background: 'hsl(0 0% 100% / 0.06)' }} />
              <span className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground/50">{"\n"}</span>
              <div className="h-px flex-1" style={{ background: 'hsl(0 0% 100% / 0.06)' }} />
            </div>
            <label
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-all min-h-[140px] ${isDragging ? 'scale-[1.01]' : ''}`}
              style={{
                borderColor: isDragging ? 'hsl(210 100% 55% / 0.5)' : 'hsl(0 0% 100% / 0.08)',
                background: isDragging ? 'hsl(210 100% 55% / 0.08)' : 'hsl(0 0% 100% / 0.02)',
              }}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isDragging && <div className="absolute inset-0 rounded-xl pointer-events-none" />}
              {uploading ? (
                <>
                  <Loader2 className="h-7 w-7 mb-2 animate-spin" style={{ color: 'hsl(210 100% 65%)' }} />
                  <p className="text-xs font-medium" style={{ color: 'hsl(210 100% 65%)' }}>{uploadProgress}</p>
                </>
              ) : (
                <>
                  <Upload className="h-7 w-7 mb-2" style={{ color: isDragging ? 'hsl(210 100% 65%)' : 'hsl(0 0% 35%)' }} />
                  <p className="text-sm font-medium text-muted-foreground/60">
                    {isDragging ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para enviar'}
                  </p>
                  <p className="text-[11px] text-muted-foreground/35 mt-1">Sincronização temporária</p>
                </>
              )}
              <input type="file" className="hidden" onChange={handleFileInputChange} disabled={uploading} multiple />
            </label>
          </div>

          {/* Shared Content */}
          {shares.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-px flex-1" style={{ background: 'hsl(0 0% 100% / 0.06)' }} />
                <span className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground/50">Conteúdo compartilhado</span>
                <div className="h-px flex-1" style={{ background: 'hsl(0 0% 100% / 0.06)' }} />
              </div>
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="rounded-xl p-3.5 transition-colors"
                    style={{ background: 'hsl(0 0% 100% / 0.03)', border: '1px solid hsl(0 0% 100% / 0.06)' }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: 'hsl(0 0% 100% / 0.05)' }}>
                        {getContentIcon(share.content_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        {share.text_content && (
                          <p className="text-sm text-foreground/90 break-all whitespace-pre-wrap leading-relaxed">{share.text_content}</p>
                        )}
                        {share.file_name && (
                          <p className="text-sm text-foreground/90 truncate">{share.file_name}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ background: 'hsl(210 100% 55% / 0.1)', color: 'hsl(210 100% 65%)' }}>
                            {share.shared_by_name ? `👤 ${share.shared_by_name}` : share.device_info ? `📱 ${share.device_info}` : '👤 Anônimo'}
                          </span>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground/40" />
                            <span className="text-[10px] text-muted-foreground/40">{getRemainingTime(share.expires_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {(
                      <div className="flex items-center gap-1.5 mt-3 pt-2.5" style={{ borderTop: '1px solid hsl(0 0% 100% / 0.05)' }}>
                        {share.text_content && (
                          <button
                            onClick={() => copyToClipboard(share.text_content!, 'Copiado')}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                            style={{ background: 'hsl(0 0% 100% / 0.04)' }}
                          >
                            <Copy className="h-3 w-3" /> Copiar
                          </button>
                        )}
                        {share.file_url && (
                          <a
                            href={share.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                            style={{ background: 'hsl(0 0% 100% / 0.04)' }}
                          >
                            <Download className="h-3 w-3" /> Download
                          </a>
                        )}
                        {isEditor && (
                        <button
                          onClick={() => handleDelete(share.id)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-destructive hover:bg-destructive/10 transition-colors ml-auto"
                        >
                          <Trash2 className="h-3 w-3" /> Remover
                        </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {shares.length === 0 && (
            <div className="text-center py-8 rounded-xl" style={{ background: 'hsl(0 0% 100% / 0.02)' }}>
              <MessageSquare className="h-8 w-8 mx-auto mb-3" style={{ color: 'hsl(0 0% 100% / 0.08)' }} />
              <p className="text-sm text-muted-foreground/50">Nada compartilhado ainda</p>
              <p className="text-[11px] text-muted-foreground/30 mt-1">Compartilhe textos, links ou arquivos</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChatDocsPopup;

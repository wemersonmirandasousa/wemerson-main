import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Plus, Search, Trash2, Copy, StickyNote, Phone } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface NotesPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NotesPopup: React.FC<NotesPopupProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [title, setTitle] = useState('');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Comece a escrever...' }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      if (selectedId) debouncedSave(selectedId, title, editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none min-h-[300px] outline-none text-[#E0E0E0]',
      },
    },
  });

  const selectedNote = notes.find(n => n.id === selectedId);

  const fetchNotes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notes' as any)
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    if (data) setNotes(data as any);
  }, [user]);

  useEffect(() => {
    if (open && user) fetchNotes();
  }, [open, user, fetchNotes]);

  useEffect(() => {
    if (selectedNote && editor) {
      setTitle(selectedNote.title);
      editor.commands.setContent(selectedNote.content || '');
    }
  }, [selectedId]);

  const sendAudit = async (evento: string, descricao: string) => {
    try {
      await supabase.functions.invoke('send-whatsapp-audit', {
        body: { evento, descricao, usuario: user?.email || 'Anônimo' },
      });
    } catch {}
  };

  const debouncedSave = useCallback((id: string, t: string, c: string) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await supabase.from('notes' as any).update({ title: t, content: c, updated_at: new Date().toISOString() } as any).eq('id', id);
      fetchNotes();
      sendAudit('nota_atualizada', `Nota "${t}" editada`);
    }, 1000);
  }, [fetchNotes, user]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (selectedId && editor) debouncedSave(selectedId, val, editor.getHTML());
  };

  const handleCreate = async () => {
    if (!user) return;
    const { data } = await supabase.from('notes' as any).insert({ title: 'Nova nota', content: '', user_id: user.id } as any).select().single();
    if (data) {
      await fetchNotes();
      setSelectedId((data as any).id);
      sendAudit('nota_criada', 'Nova nota criada');
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    const noteTitle = title || 'Sem título';
    await supabase.from('notes' as any).delete().eq('id', selectedId);
    setSelectedId(null);
    setTitle('');
    editor?.commands.setContent('');
    fetchNotes();
    toast({ description: 'Nota excluída' });
    sendAudit('nota_excluida', `Nota "${noteTitle}" excluída`);
  };

  const handleCopy = async () => {
    if (!editor) return;
    const html = editor.getHTML();
    const text = editor.getText();
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ]);
      toast({ description: 'Nota copiada com formatação' });
    } catch {
      await navigator.clipboard.writeText(text);
      toast({ description: 'Nota copiada' });
    }
  };

  const handleSendWhatsApp = async () => {
    if (!editor) return;
    const text = editor.getText();
    if (!text.trim()) { toast({ description: 'Nota vazia' }); return; }
    try {
      await supabase.functions.invoke('send-whatsapp-audit', {
        body: { conteudo: `${title || 'Sem título'}\n\n${text}`, usuario: user?.email || 'Anônimo' },
      });
      toast({ description: 'Nota enviada via WhatsApp' });
    } catch {
      toast({ description: 'Erro ao enviar', variant: 'destructive' });
    }
  };

  const filteredNotes = notes.filter(n =>
    !searchQuery || n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPreview = (content: string) => {
    const text = content.replace(/<[^>]*>/g, '').trim();
    return text.slice(0, 60) || 'Sem conteúdo';
  };

  if (!user) return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" style={{ background: '#0A0A0A', borderColor: '#1A1A1A' }}>
        <div className="text-center py-8">
          <StickyNote className="h-10 w-10 mx-auto mb-3 text-[#22C55E]/40" />
          <p className="text-sm text-[#888]">Faça login para usar as Notas.</p>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-[900px] h-[85vh] max-h-[700px] p-0 overflow-hidden border-none [&>button.absolute]:hidden" style={{ background: '#0A0A0A' }}>
        <div className="flex h-full min-h-0">
          {/* Sidebar */}
          <div className="w-[260px] border-r flex flex-col" style={{ background: '#111111', borderColor: '#1A1A1A' }}>
            <div className="p-3 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#555]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar notas"
                  className="w-full h-8 pl-8 pr-3 rounded-lg text-sm border focus:outline-none focus:ring-1 focus:ring-[#22C55E]/30"
                  style={{ background: '#1A1A1A', borderColor: '#222', color: '#E0E0E0' }}
                />
              </div>
              <button
                onClick={handleCreate}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[#1A1A1A]"
                style={{ color: '#22C55E' }}
              >
                <Plus className="h-4 w-4" /> Nova nota
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {filteredNotes.map(note => (
                <button
                  key={note.id}
                  onClick={() => setSelectedId(note.id)}
                  className="w-full text-left rounded-lg px-3 py-2.5 mb-1 transition-colors"
                  style={{
                    background: selectedId === note.id ? 'rgba(34,197,94,0.15)' : 'transparent',
                    borderLeft: selectedId === note.id ? '2px solid #22C55E' : '2px solid transparent',
                  }}
                >
                  <p className="text-sm font-medium truncate" style={{ color: selectedId === note.id ? '#22C55E' : '#CCC' }}>
                    {note.title || 'Sem título'}
                  </p>
                  <p className="text-[11px] truncate mt-0.5" style={{ color: '#666' }}>
                    {getPreview(note.content)}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#444' }}>
                    {new Date(note.updated_at).toLocaleDateString('pt-BR')}
                  </p>
                </button>
              ))}
              {filteredNotes.length === 0 && (
                <p className="text-xs text-center py-8" style={{ color: '#444' }}>Nenhuma nota</p>
              )}
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 flex min-h-0 flex-col" style={{ background: '#0A0A0A' }}>
            {selectedId ? (
              <>
                <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: '#1A1A1A' }}>
                  <input
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Título"
                    className="flex-1 text-lg font-semibold bg-transparent focus:outline-none"
                    style={{ color: '#E0E0E0' }}
                  />
                  <button onClick={handleSendWhatsApp} className="p-2 rounded-lg hover:bg-[#1A1A1A] transition-colors" title="Enviar via WhatsApp">
                    <Phone className="h-4 w-4 text-[#22C55E]" />
                  </button>
                  <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-[#1A1A1A] transition-colors" title="Copiar">
                    <Copy className="h-4 w-4 text-[#888]" />
                  </button>
                  <button onClick={handleDelete} className="p-2 rounded-lg hover:bg-[#2A1515] transition-colors" title="Excluir">
                    <Trash2 className="h-4 w-4 text-red-400/70" />
                  </button>
                </div>

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  {editor && (
                    <div className="flex items-center gap-1 px-5 py-1.5 border-b shrink-0" style={{ borderColor: '#1A1A1A' }}>
                      {[
                        { label: 'B', cmd: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), className: 'font-bold' },
                        { label: 'I', cmd: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), className: 'italic' },
                        { label: 'H2', cmd: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) },
                        { label: '• Lista', cmd: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') },
                        { label: '1. Lista', cmd: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') },
                        { label: '❝', cmd: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote') },
                      ].map((btn, i) => (
                        <button
                          key={i}
                          onClick={btn.cmd}
                          className={`px-2 py-1 rounded text-xs transition-colors ${btn.className || ''}`}
                          style={{
                            background: btn.active ? 'rgba(34,197,94,0.15)' : 'transparent',
                            color: btn.active ? '#22C55E' : '#666',
                          }}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                    <EditorContent editor={editor} className="h-full [&_.tiptap]:min-h-full [&_.tiptap]:outline-none [&_.tiptap_p]:text-[#E0E0E0] [&_.tiptap_h1]:text-[#F0F0F0] [&_.tiptap_h2]:text-[#F0F0F0] [&_.tiptap_h3]:text-[#F0F0F0] [&_.tiptap_li]:text-[#E0E0E0] [&_.tiptap_blockquote]:border-[#22C55E]/30 [&_.tiptap_blockquote]:text-[#AAA] [&_.ProseMirror-focused]:outline-none" />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <StickyNote className="h-12 w-12 mx-auto mb-3" style={{ color: '#22C55E', opacity: 0.2 }} />
                  <p className="text-sm" style={{ color: '#444' }}>Selecione ou crie uma nota</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotesPopup;

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { fetchDepartments, type Department } from '@/lib/departments';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Paperclip, Upload, ClipboardList, ArrowLeft } from 'lucide-react';
import { sendAudit } from '@/lib/audit';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Process {
  id: string;
  name: string;
  setor: string | null;
  description: string;
  created_at: string;
  updated_at: string;
}

interface Attachment {
  id: string;
  process_id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
}

interface ProcessesPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProcessesPopup: React.FC<ProcessesPopupProps> = ({ open, onOpenChange }) => {
  const { isEditor, user } = useAuth();
  const [processes, setProcesses] = useState<Process[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', setor: '', description: '' });

  const selected = processes.find(p => p.id === selectedId);

  const fetchProcesses = useCallback(async () => {
    const { data } = await supabase.from('processes' as any).select('*').order('created_at', { ascending: false });
    if (data) setProcesses(data as any);
  }, []);

  const fetchAttachmentsForProcess = useCallback(async (pid: string) => {
    const { data } = await supabase.from('process_attachments' as any).select('*').eq('process_id', pid).order('uploaded_at', { ascending: false });
    if (data) setAttachments(data as any);
  }, []);

  useEffect(() => {
    if (open) {
      fetchProcesses();
      fetchDepartments().then(setDepartments).catch(() => {});
    }
  }, [open, fetchProcesses]);

  useEffect(() => {
    if (selectedId) fetchAttachmentsForProcess(selectedId);
  }, [selectedId, fetchAttachmentsForProcess]);

  const handleSelect = (p: Process) => {
    setSelectedId(p.id);
    setForm({ name: p.name, setor: p.setor || '', description: p.description });
    setEditing(false);
    sendAudit('processo_visualizado', `Processo "${p.name}" visualizado`, user?.email || 'Visitante');
  };

  const handleCreate = async () => {
    const { data } = await supabase.from('processes' as any).insert({ name: 'NOVO PROCESSO', setor: '', description: '' } as any).select().single();
    if (data) {
      await fetchProcesses();
      setSelectedId((data as any).id);
      setForm({ name: 'NOVO PROCESSO', setor: '', description: '' });
      setEditing(true);
    }
  };

  const handleSave = async () => {
    if (!selectedId) return;
    await supabase.from('processes' as any).update({
      name: form.name.toUpperCase(),
      setor: form.setor,
      description: form.description.toUpperCase(),
      updated_at: new Date().toISOString(),
    } as any).eq('id', selectedId);
    setEditing(false);
    fetchProcesses();
    toast({ description: 'Processo salvo' });
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    await supabase.from('processes' as any).delete().eq('id', selectedId);
    setSelectedId(null);
    fetchProcesses();
    toast({ description: 'Processo excluído' });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedId || !e.target.files?.length) return;
    for (const file of Array.from(e.target.files)) {
      const path = `${selectedId}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('process-files').upload(path, file);
      if (error) { toast({ description: error.message, variant: 'destructive' }); continue; }
      const { data: { publicUrl } } = supabase.storage.from('process-files').getPublicUrl(path);
      await supabase.from('process_attachments' as any).insert({ process_id: selectedId, file_name: file.name, file_url: publicUrl } as any);
    }
    fetchAttachmentsForProcess(selectedId);
    toast({ description: 'Arquivo(s) anexado(s)' });
  };

  const handleDeleteAttachment = async (att: Attachment) => {
    const path = att.file_url.split('/process-files/')[1];
    if (path) await supabase.storage.from('process-files').remove([decodeURIComponent(path)]);
    await supabase.from('process_attachments' as any).delete().eq('id', att.id);
    if (selectedId) fetchAttachmentsForProcess(selectedId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] h-[600px] p-0 overflow-hidden border-none" style={{ background: '#0A0A0A' }}>
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-[260px] border-r flex flex-col" style={{ background: '#111111', borderColor: '#1A1A1A' }}>
            <div className="p-3">
              {isEditor && (
                <button onClick={handleCreate} className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[#1A1A1A]" style={{ color: '#22C55E' }}>
                  <Plus className="h-4 w-4" /> Novo processo
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {processes.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelect(p)}
                  className="w-full text-left rounded-lg px-3 py-2.5 mb-1 transition-colors"
                  style={{
                    background: selectedId === p.id ? 'rgba(34,197,94,0.15)' : 'transparent',
                    borderLeft: selectedId === p.id ? '2px solid #22C55E' : '2px solid transparent',
                  }}
                >
                  <p className="text-sm font-medium truncate" style={{ color: selectedId === p.id ? '#22C55E' : '#CCC' }}>{p.name}</p>
                  <p className="text-[11px] truncate mt-0.5" style={{ color: '#666' }}>{p.setor || 'Sem setor'}</p>
                </button>
              ))}
              {processes.length === 0 && <p className="text-xs text-center py-8" style={{ color: '#444' }}>Nenhum processo</p>}
            </div>
          </div>

          {/* Detail */}
          <div className="flex-1 flex flex-col overflow-y-auto" style={{ background: '#0A0A0A' }}>
            {selected ? (
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedId(null)} className="p-1.5 rounded-lg hover:bg-[#1A1A1A] md:hidden"><ArrowLeft className="h-4 w-4 text-[#888]" /></button>
                  <h2 className="text-lg font-bold flex-1 truncate" style={{ color: '#E0E0E0' }}>{selected.name}</h2>
                  {isEditor && !editing && (
                    <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="border-[#22C55E]/30 text-[#22C55E] hover:bg-[#22C55E]/10">Editar</Button>
                  )}
                  {isEditor && (
                    <button onClick={handleDelete} className="p-2 rounded-lg hover:bg-[#2A1515]"><Trash2 className="h-4 w-4 text-red-400/70" /></button>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider font-medium mb-1 block" style={{ color: '#22C55E', opacity: 0.7 }}>NOME</label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })}
                      readOnly={!editing}
                      className="font-medium border-[#222] focus:ring-[#22C55E]/30"
                      style={{ background: '#1A1A1A', color: '#E0E0E0' }}
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-medium mb-1 block" style={{ color: '#22C55E', opacity: 0.7 }}>SETOR</label>
                    {editing ? (
                      <Select value={form.setor} onValueChange={(v) => setForm({ ...form, setor: v })}>
                        <SelectTrigger className="border-[#222]" style={{ background: '#1A1A1A', color: '#E0E0E0' }}><SelectValue placeholder="Selecionar setor" /></SelectTrigger>
                        <SelectContent style={{ background: '#1A1A1A', borderColor: '#222' }}>
                          {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={form.setor || 'Sem setor'} readOnly style={{ background: '#1A1A1A', color: '#E0E0E0' }} className="border-[#222]" />
                    )}
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-medium mb-1 block" style={{ color: '#22C55E', opacity: 0.7 }}>COMO O PROCESSO É FEITO</label>
                    <Textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value.toUpperCase() })}
                      readOnly={!editing}
                      rows={8}
                      className="font-mono text-sm border-[#222] focus:ring-[#22C55E]/30"
                      style={{ background: '#1A1A1A', color: '#E0E0E0' }}
                    />
                  </div>
                  {editing && isEditor && (
                    <div className="flex gap-2">
                      <Button onClick={handleSave} className="bg-[#22C55E] text-black hover:bg-[#16A34A]">Salvar</Button>
                      <Button variant="outline" onClick={() => { setEditing(false); if (selected) setForm({ name: selected.name, setor: selected.setor || '', description: selected.description }); }} className="border-[#333] text-[#AAA] hover:bg-[#1A1A1A]">Cancelar</Button>
                    </div>
                  )}
                </div>

                {/* Attachments */}
                <div className="space-y-3">
                  <label className="text-xs uppercase tracking-wider font-medium" style={{ color: '#22C55E', opacity: 0.7 }}>ANEXOS</label>
                  {attachments.map(att => (
                    <div key={att.id} className="flex items-center gap-2 rounded-lg px-3 py-2 border" style={{ borderColor: '#222', background: '#111' }}>
                      <Paperclip className="h-3.5 w-3.5 text-[#22C55E]/60" />
                      <a href={att.file_url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline flex-1 truncate" style={{ color: '#22C55E' }}>{att.file_name}</a>
                      {isEditor && (
                        <button onClick={() => handleDeleteAttachment(att)} className="text-red-400/70 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                      )}
                    </div>
                  ))}
                  {isEditor && (
                    <label className="flex items-center gap-2 cursor-pointer text-sm hover:underline" style={{ color: '#22C55E' }}>
                      <Upload className="h-4 w-4" /> Anexar arquivo
                      <input type="file" multiple className="hidden" onChange={handleFileUpload} />
                    </label>
                  )}
                  {attachments.length === 0 && !isEditor && <p className="text-xs" style={{ color: '#444' }}>Nenhum anexo</p>}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <ClipboardList className="h-12 w-12 mx-auto mb-3" style={{ color: '#22C55E', opacity: 0.2 }} />
                  <p className="text-sm" style={{ color: '#444' }}>Selecione ou crie um processo</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProcessesPopup;

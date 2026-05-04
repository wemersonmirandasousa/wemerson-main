import { supabase } from '@/integrations/supabase/client';
import type { Tool, KnowledgeFile, SocialCard, ToolBlock, ToolAccessLog } from '@/types/tool';
import { parseUserAgent } from '@/types/tool';
import type { Company } from '@/components/CompanyFilter';

// Public columns (excludes credential_email, credential_senha, prompt_final)
const PUBLIC_TOOL_COLUMNS = 'id,titulo,descricao,setores,tags,status,image_url,link_acesso_original,instrucoes,quebra_gelos,modelo_recomendado,link_contexto,link_criacao_prompt,link_gpt_criacao_prompt,link_gpt_transformacao_base_conhecimento,link_contexto_transformacao_base_conhecimento,link_gpt_pronto,funcao,acoes,recursos,links_producao,criado_em,criado_por,atualizado_em,atualizado_por,deleted_at,deleted_by,empresa_id,tool_type,categoria,print_processo_url,print_resultado_url,link_gpt_transformacao_contexto,cor_cartao' as const;

export async function fetchTools() {
  const { data, error } = await supabase
    .from('tools')
    .select(PUBLIC_TOOL_COLUMNS)
    .is('deleted_at' as any, null)
    .or('is_archived.is.null,is_archived.eq.false')
    .order('criado_em', { ascending: false });
  if (error) throw error;
  return (data || []) as Tool[];
}

export async function fetchArchivedTools() {
  const { data, error } = await (supabase as any)
    .from('tools')
    .select(PUBLIC_TOOL_COLUMNS)
    .is('deleted_at', null)
    .eq('is_archived', true)
    .order('atualizado_em', { ascending: false });
  if (error) throw error;
  return (data || []) as Tool[];
}

export async function bulkArchiveTools(ids: string[], userId: string, archived: boolean) {
  const { error } = await (supabase as any)
    .from('tools')
    .update({ is_archived: archived, atualizado_por: userId })
    .in('id', ids);
  if (error) throw error;
}

// Fetch tool IDs that have extra structure data (credentials, knowledge files, or linked tools)
export async function fetchToolsWithExtraStructure(): Promise<Set<string>> {
  const [creds, files, links] = await Promise.all([
    supabase.from('tool_credentials').select('tool_id'),
    supabase.from('knowledge_files').select('tool_id'),
    supabase.from('tool_links').select('source_tool_id,target_tool_id'),
  ]);
  const ids = new Set<string>();
  creds.data?.forEach((r: any) => { if (r.tool_id) ids.add(r.tool_id); });
  files.data?.forEach((r: any) => { if (r.tool_id) ids.add(r.tool_id); });
  links.data?.forEach((r: any) => {
    if (r.source_tool_id) ids.add(r.source_tool_id);
    if (r.target_tool_id) ids.add(r.target_tool_id);
  });
  return ids;
}

// Build a search index mapping tool_id → concatenated searchable text from related tables
export async function fetchToolSearchIndex(): Promise<Record<string, string>> {
  const [blocks, files, creds] = await Promise.all([
    supabase.from('tool_blocks').select('tool_id,titulo,descricao,conteudo'),
    supabase.from('knowledge_files').select('tool_id,file_name,description'),
    supabase.from('tool_credentials').select('tool_id,prompt_final'),
  ]);
  const index: Record<string, string> = {};
  const append = (toolId: string, text: string | null | undefined) => {
    if (!text) return;
    index[toolId] = (index[toolId] || '') + ' ' + text;
  };
  blocks.data?.forEach((r: any) => { append(r.tool_id, r.titulo); append(r.tool_id, r.descricao); append(r.tool_id, r.conteudo); });
  files.data?.forEach((r: any) => { append(r.tool_id, r.file_name); append(r.tool_id, r.description); });
  creds.data?.forEach((r: any) => { append(r.tool_id, r.prompt_final); });
  return index;
}

export async function fetchTool(id: string) {
  const { data, error } = await supabase
    .from('tools')
    .select(PUBLIC_TOOL_COLUMNS)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Tool;
}

// Editor-only: fetches sensitive columns from tool_credentials table
export async function fetchToolCredentials(id: string) {
  const { data, error } = await supabase
    .from('tool_credentials' as any)
    .select('credential_email,credential_senha,prompt_final,credential_url,credential_anon_public,credential_publish_key,credential_secret_key,credential_service_role,credential_project_id,credential_api,api_labels')
    .eq('tool_id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return (data as any as { credential_email: string | null; credential_senha: string | null; prompt_final: string | null; credential_url: string | null; credential_anon_public: string | null; credential_publish_key: string | null; credential_secret_key: string | null; credential_service_role: string | null; credential_project_id: string | null; credential_api: string | null; api_labels: string[] | null }) || { credential_email: null, credential_senha: null, prompt_final: null, credential_url: null, credential_anon_public: null, credential_publish_key: null, credential_secret_key: null, credential_service_role: null, credential_project_id: null, credential_api: null, api_labels: null };
}

// Editor-only: upserts sensitive columns into tool_credentials table
export async function upsertToolCredentials(toolId: string, creds: { credential_email?: string | null; credential_senha?: string | null; prompt_final?: string | null; credential_url?: string | null; credential_anon_public?: string | null; credential_publish_key?: string | null; credential_secret_key?: string | null; credential_service_role?: string | null; credential_project_id?: string | null; credential_api?: string | null; api_labels?: string[] | null }) {
  const { error } = await supabase
    .from('tool_credentials' as any)
    .upsert({ tool_id: toolId, ...creds } as any, { onConflict: 'tool_id' });
  if (error) throw error;
}

export async function createTool(tool: Partial<Tool>, userId: string) {
  const payload: any = {
    titulo: tool.titulo || 'Nova Ferramenta',
    criado_por: userId,
    atualizado_por: userId,
    status: tool.status || 'draft',
    tool_type: tool.tool_type || 'gpt',
  };
  if (tool.descricao !== undefined) payload.descricao = tool.descricao;
  if (tool.setores !== undefined) payload.setores = tool.setores;
  if (tool.categoria !== undefined) payload.categoria = tool.categoria;
  if (tool.link_acesso_original !== undefined) payload.link_acesso_original = tool.link_acesso_original;
  if ((tool as any).empresa_id !== undefined) payload.empresa_id = (tool as any).empresa_id;
  if (tool.funcao !== undefined) payload.funcao = tool.funcao;
  if (tool.instrucoes !== undefined) payload.instrucoes = tool.instrucoes;
  if (tool.link_contexto !== undefined) payload.link_contexto = tool.link_contexto;
  if (tool.link_criacao_prompt !== undefined) payload.link_criacao_prompt = tool.link_criacao_prompt;
  if (tool.link_contexto_transformacao_base_conhecimento !== undefined) payload.link_contexto_transformacao_base_conhecimento = tool.link_contexto_transformacao_base_conhecimento;
  if (tool.link_gpt_transformacao_base_conhecimento !== undefined) payload.link_gpt_transformacao_base_conhecimento = tool.link_gpt_transformacao_base_conhecimento;
  if (tool.modelo_recomendado !== undefined) payload.modelo_recomendado = tool.modelo_recomendado;

  const { data, error } = await supabase
    .from('tools')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Tool;
}

export async function updateTool(id: string, updates: Partial<Tool>, userId: string) {
  const payload: any = { ...updates, atualizado_por: userId };
  const { data, error } = await supabase
    .from('tools')
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Tool;
}

export async function softDeleteTool(id: string, userId: string) {
  const { error } = await supabase
    .from('tools')
    .update({ deleted_at: new Date().toISOString(), atualizado_por: userId, deleted_by: userId } as any)
    .eq('id', id);
  if (error) throw error;
}

export async function bulkSoftDeleteTools(ids: string[], userId: string) {
  const { error } = await supabase
    .from('tools')
    .update({ deleted_at: new Date().toISOString(), atualizado_por: userId, deleted_by: userId } as any)
    .in('id', ids);
  if (error) throw error;
}

export async function deleteTool(id: string) {
  const { error } = await supabase.from('tools').delete().eq('id', id);
  if (error) throw error;
}

// Duplicates a tool, including credentials, blocks, knowledge files (with physical storage copy), and links.
export async function duplicateTool(sourceId: string, userId: string, titlePrefix = '* '): Promise<Tool> {
  console.log('[api:duplicateTool]', { sourceId });
  // 1) Fetch full source row (all columns) — editor RLS allows reading
  const { data: src, error: srcErr } = await supabase
    .from('tools')
    .select('*')
    .eq('id', sourceId)
    .single();
  if (srcErr) throw srcErr;
  if (!src) throw new Error('Ferramenta não encontrada');

  // 2) Build insert payload — strip identity/audit fields
  const { id: _id, criado_em, atualizado_em, criado_por, atualizado_por, deleted_at, deleted_by, version_number, ...rest } = src as any;
  const payload: any = {
    ...rest,
    titulo: `${titlePrefix}${src.titulo}`,
    criado_por: userId,
    atualizado_por: userId,
  };

  const { data: inserted, error: insErr } = await supabase
    .from('tools')
    .insert(payload)
    .select()
    .single();
  if (insErr) throw insErr;
  const newId = (inserted as any).id as string;

  // 3) Copy credentials (editor-only; ignore if missing)
  try {
    const { data: creds } = await supabase
      .from('tool_credentials' as any)
      .select('credential_email,credential_senha,prompt_final,credential_url,credential_anon_public,credential_publish_key,credential_secret_key,credential_service_role,credential_project_id,credential_api,api_labels')
      .eq('tool_id', sourceId)
      .maybeSingle();
    if (creds) {
      await supabase.from('tool_credentials' as any).insert({ tool_id: newId, ...(creds as any) } as any);
    }
  } catch (e) { console.warn('[api:duplicateTool:creds]', e); }

  // 4) Copy tool_blocks (including storage_path references)
  try {
    const { data: blocks } = await supabase
      .from('tool_blocks' as any)
      .select('*')
      .eq('tool_id', sourceId);
    if (blocks && blocks.length > 0) {
      const newBlocks = (blocks as any[]).map(({ id, criado_em, atualizado_em, ...b }) => ({ ...b, tool_id: newId }));
      await supabase.from('tool_blocks' as any).insert(newBlocks as any);
    }
  } catch (e) { console.warn('[api:duplicateTool:blocks]', e); }

  // 5) Copy knowledge_files — physically duplicate storage objects so each tool owns its files
  try {
    const { data: files } = await supabase
      .from('knowledge_files')
      .select('file_name,description,storage_path')
      .eq('tool_id', sourceId);
    if (files && files.length > 0) {
      const newFileRows: any[] = [];
      for (const f of files as any[]) {
        let newPath = f.storage_path;
        try {
          const { data: blob, error: dlErr } = await supabase.storage.from('knowledge-files').download(f.storage_path);
          if (dlErr) throw dlErr;
          const ext = f.storage_path.includes('.') ? '.' + f.storage_path.split('.').pop() : '';
          const baseName = (f.storage_path.split('/').pop() || 'file').replace(/\.[^.]+$/, '');
          newPath = `${newId}/${Date.now()}_${baseName}${ext}`;
          const { error: upErr } = await supabase.storage.from('knowledge-files').upload(newPath, blob);
          if (upErr) throw upErr;
        } catch (e) {
          console.warn('[api:duplicateTool:storage-copy]', f.storage_path, e);
          // fallback: reuse original storage_path so the row still references a valid file
          newPath = f.storage_path;
        }
        newFileRows.push({ tool_id: newId, file_name: f.file_name, description: f.description, storage_path: newPath, uploaded_by: userId });
      }
      if (newFileRows.length > 0) {
        await supabase.from('knowledge_files').insert(newFileRows as any);
      }
    }
  } catch (e) { console.warn('[api:duplicateTool:files]', e); }

  // 6) Copy outgoing tool_links (source_tool_id = sourceId)
  try {
    const { data: links } = await supabase
      .from('tool_links' as any)
      .select('target_tool_id,link_type')
      .eq('source_tool_id', sourceId);
    if (links && links.length > 0) {
      const newLinks = (links as any[]).map((l) => ({ source_tool_id: newId, target_tool_id: l.target_tool_id, link_type: l.link_type }));
      await supabase.from('tool_links' as any).insert(newLinks as any);
    }
  } catch { /* ignore */ }

  return inserted as Tool;
}

// Knowledge files
export async function fetchKnowledgeFiles(toolId: string) {
  const { data, error } = await supabase
    .from('knowledge_files')
    .select('*')
    .eq('tool_id', toolId)
    .order('uploaded_at', { ascending: false });
  if (error) throw error;
  return data as KnowledgeFile[];
}

const ALLOWED_KNOWLEDGE_TYPES = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/json',
  'text/markdown',
  'application/vnd.android.package-archive',
];

export async function uploadKnowledgeFile(toolId: string, file: File, description: string, userId: string) {
  if (!ALLOWED_KNOWLEDGE_TYPES.includes(file.type) && !file.name.match(/\.(md|markdown|csv|apk)$/i)) {
    throw new Error('Tipo de arquivo não permitido. Use PDF, TXT, DOCX, XLSX, CSV, Markdown ou APK.');
  }
  // Sanitize filename: lowercase, remove accents, replace spaces, remove special chars
  const ext = file.name.includes('.') ? '.' + file.name.split('.').pop()!.toLowerCase() : '';
  const baseName = file.name.replace(/\.[^.]+$/, '');
  const sanitized = baseName
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.\-_]/g, '') || 'file';
  const path = `${toolId}/${Date.now()}_${sanitized}${ext}`;
  const { error: uploadError } = await supabase.storage.from('knowledge-files').upload(path, file);
  if (uploadError) throw uploadError;
  const { data, error } = await supabase
    .from('knowledge_files')
    .insert({ tool_id: toolId, file_name: file.name, description, storage_path: path, uploaded_by: userId })
    .select()
    .single();
  if (error) throw error;
  return data as KnowledgeFile;
}

export async function deleteKnowledgeFile(fileId: string, storagePath: string) {
  await supabase.storage.from('knowledge-files').remove([storagePath]);
  const { error } = await supabase.from('knowledge_files').delete().eq('id', fileId);
  if (error) throw error;
}

export async function downloadKnowledgeFile(storagePath: string) {
  const { data, error } = await supabase.storage.from('knowledge-files').download(storagePath);
  if (error) throw error;
  return data;
}

// Images
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function uploadToolImage(toolId: string, file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.');
  }
  const path = `${toolId}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage.from('tool-images').upload(path, file);
  if (uploadError) throw uploadError;
  const { data: urlData } = supabase.storage.from('tool-images').getPublicUrl(path);
  return urlData.publicUrl;
}

export async function deleteToolImage(imageUrl: string) {
  const path = imageUrl.split('/tool-images/')[1];
  if (path) {
    await supabase.storage.from('tool-images').remove([path]);
  }
}

// Social cards
export async function fetchSocialCards() {
  const { data, error } = await supabase
    .from('social_cards' as any)
    .select('id, titulo, descricao, button_label, url, icon, image_url, ordem, ativo, criado_em, criado_por, atualizado_em, atualizado_por')
    .eq('ativo', true)
    .order('ordem', { ascending: true });
  if (error) throw error;
  return (data || []) as unknown as SocialCard[];
}

export async function createSocialCard(card: Partial<SocialCard>, userId: string) {
  const { data, error } = await supabase
    .from('social_cards' as any)
    .insert({ ...card, criado_por: userId, atualizado_por: userId } as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as SocialCard;
}

export async function updateSocialCard(id: string, updates: Partial<SocialCard>, userId: string) {
  const payload: any = { ...updates, atualizado_por: userId };

  const { data, error } = await supabase
    .from('social_cards' as any)
    .update(payload)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as SocialCard;
}

export async function deleteSocialCard(id: string) {
  const { error } = await supabase.from('social_cards' as any).delete().eq('id', id);
  if (error) throw error;
}

// Tool Blocks
export async function fetchToolBlocks(toolId: string) {
  const { data, error } = await supabase
    .from('tool_blocks' as any)
    .select('*')
    .eq('tool_id', toolId)
    .order('ordem', { ascending: true });
  if (error) throw error;
  return (data || []) as unknown as ToolBlock[];
}

export async function createToolBlock(block: Partial<ToolBlock>) {
  const { data, error } = await supabase
    .from('tool_blocks' as any)
    .insert(block as any)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as ToolBlock;
}

export async function updateToolBlock(id: string, updates: Partial<ToolBlock>) {
  const { data, error } = await supabase
    .from('tool_blocks' as any)
    .update(updates as any)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as unknown as ToolBlock;
}

export async function deleteToolBlock(id: string) {
  const { error } = await supabase.from('tool_blocks' as any).delete().eq('id', id);
  if (error) throw error;
}

// Audit / Access logs
export async function logToolAccess(toolId: string, eventType: string, profile: string, userId?: string | null, userName?: string | null) {
  const ua = navigator.userAgent;
  const parsed = parseUserAgent(ua);
  await supabase.from('tool_access_logs' as any).insert({
    tool_id: toolId,
    event_type: eventType,
    access_profile: profile,
    user_id: userId || null,
    user_name: userName || null,
    user_agent: ua,
    device_name: parsed.device,
    os_name: parsed.os,
    browser_name: parsed.browser,
  } as any);
}

export async function fetchToolAccessLogs(toolId: string) {
  const { data, error } = await supabase
    .from('tool_access_logs' as any)
    .select('*')
    .eq('tool_id', toolId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []) as unknown as ToolAccessLog[];
}

export async function fetchToolAccessStats(toolId: string) {
  const { data, error } = await supabase
    .from('tool_access_logs' as any)
    .select('event_type')
    .eq('tool_id', toolId);
  if (error) return { total: 0, views: 0, structures: 0, whatDoes: 0, access: 0, contact: 0 };
  const logs = (data || []) as any[];
  return {
    total: logs.length,
    views: logs.filter(l => l.event_type === 'view_tool').length,
    structures: logs.filter(l => l.event_type === 'open_structure').length,
    whatDoes: logs.filter(l => l.event_type === 'open_process_result').length,
    access: logs.filter(l => l.event_type === 'access_tool_link').length,
    contact: logs.filter(l => l.event_type === 'contact_click').length,
  };
}

// Fetch access counts per tool for ranking
export async function fetchToolAccessCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('tool_access_logs' as any)
    .select('tool_id');
  if (error) return {};
  const counts: Record<string, number> = {};
  for (const row of (data || []) as any[]) {
    counts[row.tool_id] = (counts[row.tool_id] || 0) + 1;
  }
  return counts;
}
// Fetch prompt_final for any authenticated user (via security definer function)
export async function fetchToolPrompt(toolId: string): Promise<string> {
  const { data, error } = await supabase.rpc('get_tool_prompt', { _tool_id: toolId });
  if (error) throw error;
  return (data as string) || '';
}

// Tool links CRUD
export async function fetchToolLinks(toolId: string) {
  const { data, error } = await supabase
    .from('tool_links' as any)
    .select('*')
    .or(`source_tool_id.eq.${toolId},target_tool_id.eq.${toolId}`);
  if (error) throw error;
  return (data || []) as any[];
}

export async function createToolLink(sourceToolId: string, targetToolId: string, linkType = 'depends_on') {
  const { data, error } = await supabase
    .from('tool_links' as any)
    .insert({ source_tool_id: sourceToolId, target_tool_id: targetToolId, link_type: linkType } as any)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteToolLink(id: string) {
  const { error } = await supabase.from('tool_links' as any).delete().eq('id', id);
  if (error) throw error;
}

export async function fetchCompanies() {
  const { data, error } = await supabase
    .from('companies' as any)
    .select('id,name,logo_url,slug,created_at,access_password,wallpaper_url')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as unknown as Company[];
}

// Categories
export interface Category {
  id: string;
  name: string;
  icon_url: string | null;
  ordem: number;
  created_at: string;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories' as any)
    .select('*')
    .order('ordem', { ascending: true });
  if (error) throw error;
  return (data || []) as unknown as Category[];
}

export async function updateCategory(id: string, updates: Partial<Category>) {
  const { error } = await supabase
    .from('categories' as any)
    .update(updates as any)
    .eq('id', id);
  if (error) throw error;
}

export async function uploadCategoryIcon(categoryId: string, file: File): Promise<string> {
  const path = `${categoryId}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage.from('category-icons').upload(path, file);
  if (uploadError) throw uploadError;
  const { data: urlData } = supabase.storage.from('category-icons').getPublicUrl(path);
  return urlData.publicUrl;
}

// Social card icon upload
export async function uploadSocialCardIcon(cardId: string, file: File): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.');
  }
  const path = `social-cards/${cardId}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage.from('tool-images').upload(path, file);
  if (uploadError) throw uploadError;
  const { data: urlData } = supabase.storage.from('tool-images').getPublicUrl(path);
  const publicUrl = urlData.publicUrl;
  // Update the social card record with the new icon URL
  await supabase
    .from('social_cards' as any)
    .update({ image_url: publicUrl } as any)
    .eq('id', cardId);
  return publicUrl;
}

// Send WhatsApp audit for any site action
export async function sendWhatsAppAudit(evento: string, descricao: string, usuario?: string | null) {
  try {
    await supabase.functions.invoke('send-whatsapp-audit', {
      body: { evento, descricao, usuario: usuario || 'Visitante' },
    });
  } catch {
    // Silent fail — audit should not block UX
  }
}

// Wallpaper management — stores wallpaper config in social_cards with icon='wallpaper'
export async function fetchWallpaper(): Promise<string | null> {
  const { data, error } = await supabase
    .from('social_cards' as any)
    .select('url')
    .eq('icon', 'wallpaper')
    .eq('ativo', true)
    .maybeSingle();
  if (error) return null;
  return (data as any)?.url || null;
}

export async function saveWallpaper(url: string, userId: string): Promise<void> {
  // Try update first
  const { data: existing } = await supabase
    .from('social_cards' as any)
    .select('id')
    .eq('icon', 'wallpaper')
    .single();
  if (existing) {
    await supabase
      .from('social_cards' as any)
      .update({ url, atualizado_por: userId } as any)
      .eq('id', (existing as any).id);
  } else {
    await supabase
      .from('social_cards' as any)
      .insert({ titulo: 'Wallpaper', icon: 'wallpaper', url, button_label: 'wallpaper', descricao: 'Site wallpaper', ordem: 998, ativo: true, criado_por: userId, atualizado_por: userId } as any);
  }
}

export async function uploadWallpaper(file: File, userId: string): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.');
  }
  const path = `wallpaper/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage.from('tool-images').upload(path, file);
  if (uploadError) throw uploadError;
  const { data: urlData } = supabase.storage.from('tool-images').getPublicUrl(path);
  const publicUrl = urlData.publicUrl;
  await saveWallpaper(publicUrl, userId);
  return publicUrl;
}

// WeChat shares
export async function fetchWeChatShares() {
  const { data, error } = await supabase
    .from('wechat_shares' as any)
    .select('*')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as any[];
}

export async function createWeChatShare(share: { content_type: string; text_content?: string; file_url?: string; file_name?: string; shared_by_name?: string; device_info?: string }) {
  const { data, error } = await supabase
    .from('wechat_shares' as any)
    .insert(share as any)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateWeChatShare(id: string, updates: { text_content?: string; content_type?: string }) {
  const { error } = await supabase.from('wechat_shares' as any).update(updates as any).eq('id', id);
  if (error) throw error;
}

export async function deleteWeChatShare(id: string) {
  const { error } = await supabase.from('wechat_shares' as any).delete().eq('id', id);
  if (error) throw error;
}

export async function uploadWeChatFile(file: File): Promise<string> {
  const path = `wechat/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage.from('tool-images').upload(path, file);
  if (uploadError) throw uploadError;
  const { data: urlData } = supabase.storage.from('tool-images').getPublicUrl(path);
  return urlData.publicUrl;
}

// Company wallpaper
export async function uploadCompanyWallpaper(companyId: string, file: File): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.');
  }
  const path = `company-wallpaper/${companyId}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage.from('tool-images').upload(path, file);
  if (uploadError) throw uploadError;
  const { data: urlData } = supabase.storage.from('tool-images').getPublicUrl(path);
  return urlData.publicUrl;
}

// Smart search
export async function smartSearchTools(query: string, tools: { id: string; titulo: string; funcao: string | null; descricao: string | null }[]): Promise<{ id: string; relevance: number }[]> {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const resp = await fetch(`https://${projectId}.supabase.co/functions/v1/smart-search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
    body: JSON.stringify({ query, tools }),
  });
  if (!resp.ok) throw new Error('Smart search failed');
  const data = await resp.json();
  return data.results || [];
}

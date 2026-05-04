import { Tool } from "@/types/tool";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

/**
 * Exports the system tools data to a JSON file as a faithful mirror of each tool.
 * Includes 100% of fields, preserving original formatting (line breaks, spacing),
 * empty fields, long texts, lists, credentials and uploads (name + download URL).
 *
 * Structure is symmetric to the import format so the file can be re-imported without loss.
 */

const KNOWLEDGE_BUCKET = "knowledge-files";

// Parses serialized %%MULTI%% JSON arrays used for multi-credentials/links.
const parseMulti = (val: any): any => {
  if (typeof val !== "string") return val ?? "";
  if (val.startsWith("%%MULTI%%")) {
    try {
      return JSON.parse(val.slice("%%MULTI%%".length));
    } catch {
      return val;
    }
  }
  return val;
};

const buildPublicUrl = (path: string | null | undefined): string => {
  if (!path) return "";
  try {
    const { data } = supabase.storage.from(KNOWLEDGE_BUCKET).getPublicUrl(path);
    return data?.publicUrl || "";
  } catch {
    return "";
  }
};

// Batched .in() helper
async function fetchInBatches<T = any>(
  table: string,
  column: string,
  ids: string[],
  selectClause = "*"
): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const batch = ids.slice(i, i + 100);
    const { data, error } = await (supabase as any)
      .from(table)
      .select(selectClause)
      .in(column, batch);
    if (error) {
      console.error(`[ExportSystem:${table}]`, error);
      continue;
    }
    if (data) out.push(...(data as T[]));
  }
  return out;
}

export const exportSystemData = async (tools: Tool[]) => {
  console.log("[ExportSystem:tools]", tools);

  try {
    if (!tools || tools.length === 0) {
      toast({
        title: "Aviso",
        description: "Nenhuma ferramenta encontrada para exportar.",
        variant: "destructive",
      });
      return;
    }

    const toolIds = tools.map((t) => t.id);

    // Parallel fetch of every related dataset
    const [
      credentials,
      knowledgeFiles,
      blocks,
      linksOut,
      linksIn,
      versions,
      companies,
      categories,
    ] = await Promise.all([
      fetchInBatches<any>("tool_credentials", "tool_id", toolIds),
      fetchInBatches<any>("knowledge_files", "tool_id", toolIds),
      fetchInBatches<any>("tool_blocks", "tool_id", toolIds),
      fetchInBatches<any>("tool_links", "source_tool_id", toolIds),
      fetchInBatches<any>("tool_links", "target_tool_id", toolIds),
      fetchInBatches<any>("tool_versions", "tool_id", toolIds),
      supabase.from("companies").select("*").then((r) => r.data || []),
      supabase.from("categories").select("*").then((r) => r.data || []),
    ]);

    const credsMap: Record<string, any> = {};
    credentials.forEach((c: any) => (credsMap[c.tool_id] = c));

    const kfMap: Record<string, any[]> = {};
    knowledgeFiles.forEach((kf: any) => {
      (kfMap[kf.tool_id] ||= []).push(kf);
    });

    const blocksMap: Record<string, any[]> = {};
    blocks.forEach((b: any) => {
      (blocksMap[b.tool_id] ||= []).push(b);
    });
    Object.values(blocksMap).forEach((arr) =>
      arr.sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
    );

    const linksOutMap: Record<string, any[]> = {};
    linksOut.forEach((l: any) => {
      (linksOutMap[l.source_tool_id] ||= []).push(l);
    });

    const linksInMap: Record<string, any[]> = {};
    linksIn.forEach((l: any) => {
      (linksInMap[l.target_tool_id] ||= []).push(l);
    });

    const versionsMap: Record<string, any[]> = {};
    versions.forEach((v: any) => {
      (versionsMap[v.tool_id] ||= []).push(v);
    });
    Object.values(versionsMap).forEach((arr) =>
      arr.sort((a, b) => (a.version_number ?? 0) - (b.version_number ?? 0))
    );

    const toolsById: Record<string, Tool> = {};
    tools.forEach((t) => (toolsById[t.id] = t));

    const companiesById: Record<string, any> = {};
    (companies as any[]).forEach((c) => (companiesById[c.id] = c));

    // Build faithful per-tool export
    const enrichedTools = tools.map((tool) => {
      const tc = credsMap[tool.id] || {};
      const kfs = kfMap[tool.id] || [];

      // Knowledge files with download URL
      const arquivos = kfs.map((kf) => ({
        id: kf.id ?? "",
        nome: kf.file_name ?? "",
        descricao: kf.description ?? "",
        storage_path: kf.storage_path ?? "",
        download_url: buildPublicUrl(kf.storage_path),
        is_archived: !!kf.is_archived,
        uploaded_by: kf.uploaded_by ?? null,
        uploaded_at: kf.uploaded_at ?? "",
      }));

      // Multi-credential expansion (URLs / API keys may be %%MULTI%% serialized)
      const multiUrls = parseMulti(tc.credential_url);
      const multiApis = parseMulti(tc.credential_api);
      const apiLabels = Array.isArray(tc.api_labels) ? tc.api_labels : [];

      // Outgoing & incoming links to other tools
      const ferramentas_vinculadas = (linksOutMap[tool.id] || []).map((l) => {
        const target = toolsById[l.target_tool_id];
        return {
          id: l.target_tool_id,
          nome: target?.titulo ?? "",
          link_type: l.link_type ?? "depends_on",
          direction: "out",
        };
      });
      const ferramentas_referenciam = (linksInMap[tool.id] || []).map((l) => {
        const source = toolsById[l.source_tool_id];
        return {
          id: l.source_tool_id,
          nome: source?.titulo ?? "",
          link_type: l.link_type ?? "depends_on",
          direction: "in",
        };
      });

      const empresa = tool.empresa_id ? companiesById[tool.empresa_id] : null;

      return {
        // Identity
        id: tool.id,
        nome: tool.titulo ?? "",
        funcao: tool.funcao ?? "",
        descricao: tool.descricao ?? "",
        instrucoes: tool.instrucoes ?? "",

        // Classification
        classificacao: {
          categoria: tool.categoria ?? "",
          tool_type: tool.tool_type ?? "",
          setor_departamento: tool.setores ?? "",
          tags: Array.isArray(tool.tags) ? tool.tags : [],
          empresa_id: tool.empresa_id ?? null,
          empresa_nome: empresa?.name ?? "",
        },

        // Cover image
        imagem_capa: {
          url: tool.image_url ?? "",
          cor_cartao: tool.cor_cartao ?? "",
          print_processo_url: tool.print_processo_url ?? "",
          print_resultado_url: tool.print_resultado_url ?? "",
        },

        // Credentials (raw + parsed multi)
        credenciais: {
          login: tc.credential_email ?? "",
          email: tc.credential_email ?? "",
          senha: tc.credential_senha ?? "",
          url: typeof multiUrls === "string" ? multiUrls : "",
          urls: Array.isArray(multiUrls) ? multiUrls : [],
          keys: {
            anon_public: tc.credential_anon_public ?? "",
            publish_key: tc.credential_publish_key ?? "",
            secret_key: tc.credential_secret_key ?? "",
            service_role: tc.credential_service_role ?? "",
            project_id: tc.credential_project_id ?? "",
          },
          apis: Array.isArray(multiApis)
            ? multiApis.map((v: any, idx: number) => ({
                nome: apiLabels[idx]?.nome ?? apiLabels[idx] ?? `API ${idx + 1}`,
                valor: typeof v === "string" ? v : (v?.valor ?? ""),
                ordem: idx,
              }))
            : multiApis
            ? [{ nome: apiLabels[0]?.nome ?? "API", valor: String(multiApis), ordem: 0 }]
            : [],
          api_labels_raw: apiLabels,
        },

        // Links
        links: {
          acesso: tool.link_acesso_original ?? "",
          contexto: tool.link_contexto ?? "",
          criacao_prompt: tool.link_criacao_prompt ?? "",
          gpt_criacao_prompt: tool.link_gpt_criacao_prompt ?? "",
          gpt_pronto: tool.link_gpt_pronto ?? "",
          gpt_transformacao_contexto: tool.link_gpt_transformacao_contexto ?? "",
          gpt_transformacao_base_conhecimento: tool.link_gpt_transformacao_base_conhecimento ?? "",
          contexto_transformacao_base_conhecimento: tool.link_contexto_transformacao_base_conhecimento ?? "",
          links_producao: tool.links_producao ?? {},
        },

        // GPTs related
        gpts: {
          criacao_prompt: tool.link_criacao_prompt
            ? [{ nome: "Criação do Prompt", url: tool.link_criacao_prompt }]
            : [],
          usados: tool.link_gpt_pronto
            ? [{ nome: "GPT Pronto", url: tool.link_gpt_pronto }]
            : [],
        },

        // Knowledge base files (name + download link)
        base_conhecimento: {
          arquivos,
        },

        // Prompt
        prompt: tc.prompt_final ?? "",

        // Recommended model
        modelo_recomendado: tool.modelo_recomendado ?? "",

        // Marked items / features
        itens_marcados: tool.recursos ?? {},
        features: {
          busca_web: !!(tool.recursos as any)?.webSearch,
          apps_beta: !!(tool.recursos as any)?.appsBeta,
          lousa: !!(tool.recursos as any)?.lousa,
          geracao_imagens: !!(tool.recursos as any)?.imagens,
          interprete_codigo: !!(tool.recursos as any)?.codeInterpreter,
        },

        // Ice breakers
        quebra_gelos: Array.isArray(tool.quebra_gelos) ? tool.quebra_gelos : [],

        // Linked tools (both directions)
        ferramentas_vinculadas,
        ferramentas_referenciam,

        // Status
        status: tool.status ?? "draft",
        is_archived: !!tool.is_archived,
        deleted_at: tool.deleted_at ?? null,
        deleted_by: tool.deleted_by ?? null,

        // Creation history
        historico: {
          criado_em: tool.criado_em ?? "",
          criado_por: tool.criado_por ?? null,
          atualizado_em: tool.atualizado_em ?? "",
          atualizado_por: tool.atualizado_por ?? null,
          version_number: tool.version_number ?? 1,
          origem: tool.origem ?? "manual",
          origem_detalhe: tool.origem_detalhe ?? "",
          imported_from_file_name: tool.imported_from_file_name ?? "",
          acoes: Array.isArray(tool.acoes) ? tool.acoes : [],
          versoes: (versionsMap[tool.id] || []).map((v) => ({
            id: v.id,
            version_number: v.version_number,
            snapshot: v.snapshot,
            changed_by: v.changed_by,
            changed_fields: v.changed_fields ?? [],
            change_summary: v.change_summary ?? "",
            created_at: v.created_at,
          })),
        },

        // Visual content blocks (preserve ALL content + formatting)
        blocos: (blocksMap[tool.id] || []).map((b) => ({
          id: b.id,
          block_type: b.block_type,
          titulo: b.titulo ?? "",
          descricao: b.descricao ?? "",
          conteudo: b.conteudo ?? "",
          ordem: b.ordem ?? 0,
          aba: b.aba ?? "configurar",
          visibility_visitor: !!b.visibility_visitor,
          visibility_reader: !!b.visibility_reader,
          visibility_editor: !!b.visibility_editor,
          storage_path: b.storage_path ?? "",
          download_url: b.storage_path ? buildPublicUrl(b.storage_path) : "",
          criado_em: b.criado_em,
          atualizado_em: b.atualizado_em,
        })),

        // Raw row — guarantees zero data loss for re-import
        _raw: {
          tool,
          credentials: tc,
          knowledge_files: kfs,
        },
      };
    });

    const exportData = {
      meta: {
        exportedAt: new Date().toISOString(),
        count: enrichedTools.length,
        version: "2.0.0",
        format: "wemerson-tool-mirror",
        description:
          "Espelho fiel das ferramentas. Preserva 100% dos campos, formatação original, listas, credenciais e arquivos (com link de download). Compatível com reimportação.",
      },
      categorias_disponiveis: categories,
      empresas_referenciadas: companies,
      tools: enrichedTools,
    };

    console.log("[ExportSystem:enriched]", exportData);

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sistema-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída!",
      description: `${enrichedTools.length} ferramentas exportadas (espelho fiel, com anexos e credenciais).`,
    });
  } catch (error: any) {
    console.error("[ExportSystem:error]", error);
    toast({
      title: "Erro na exportação",
      description: error.message,
      variant: "destructive",
    });
  }
};

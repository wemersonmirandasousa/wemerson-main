

# Plano: Botão de Exportação Completa do Sistema em Markdown

## Resumo
Criar uma Edge Function `export-system-markdown` que gera um único arquivo Markdown (.md) contendo toda a estrutura, dados, configurações e código do sistema. Um botão será adicionado à página de Análise do Sistema (`/#/sistema`) para disparar o download.

## O que será exportado

O arquivo Markdown terá a seguinte estrutura hierárquica:

```text
# Sistema Wemerson — Exportação Completa
## 1. Arquitetura Geral
## 2. Banco de Dados
### 2.1 Tabela: tools (dados completos de cada ferramenta)
### 2.2 Tabela: categories
### 2.3 Tabela: companies
### ... (todas as 19 tabelas com estrutura + dados)
## 3. Credenciais (tool_credentials — dados completos)
## 4. Blocos de Conteúdo (tool_blocks)
## 5. Arquivos da Base de Conhecimento (metadados)
## 6. Processos e Anexos
## 7. Social Cards
## 8. Notas
## 9. Configurações do Site (site_settings)
## 10. Vínculos entre Ferramentas (tool_links)
## 11. Versões (tool_versions — snapshots)
## 12. Logs de Acesso
## 13. Logs Administrativos
## 14. Storage Buckets
## 15. Edge Functions
## 16. Integrações Externas
## 17. Dependências e Bibliotecas
## 18. Componentes UI
## 19. Rotas e Páginas
## 20. Modelo de Segurança (RLS)
## 21. Tipos e Schemas TypeScript
```

## Implementação técnica

### 1. Edge Function: `supabase/functions/export-system-markdown/index.ts`
- Autenticação obrigatória + verificação de role `editor`
- Usa `SUPABASE_SERVICE_ROLE_KEY` para acessar todos os dados sem restrição RLS
- Consulta todas as 19 tabelas com `SELECT *` (sem limit, paginando se necessário)
- Gera o Markdown com estrutura hierárquica H1/H2/H3
- Dados tabulares formatados como tabelas Markdown ou blocos de código
- Campos JSON formatados com code blocks
- Retorna o arquivo `.md` como download

### 2. UI: Botão na página `SystemAnalysis.tsx`
- Botão "Exportar Sistema Completo (.md)" na seção do header
- Progress indicator durante a geração
- Download automático do arquivo ao completar

### 3. Dados incluídos (100% sem resumo)
- Cada registro de cada tabela será serializado na íntegra
- Credenciais sensíveis incluídas (apenas editores podem exportar)
- Snapshots de versões incluídos em blocos JSON
- Metadados de arquivos da base de conhecimento (nomes, paths)
- Configurações do site (Z-API tokens, etc.)

### 4. Otimização para RAG
- Separadores claros entre seções (`---`)
- Cada ferramenta como bloco autônomo com todos os campos
- Metadados contextuais em cada seção (contagem, relações)
- Sem redundância entre seções

## Arquivos modificados
- **Criado:** `supabase/functions/export-system-markdown/index.ts`
- **Editado:** `src/pages/SystemAnalysis.tsx` (botão de exportação)


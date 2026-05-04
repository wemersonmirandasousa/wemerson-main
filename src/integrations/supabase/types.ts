export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_action_logs: {
        Row: {
          action_type: string
          created_at: string
          id: string
          summary: string | null
          target_id: string | null
          target_name: string | null
          target_type: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          summary?: string | null
          target_id?: string | null
          target_name?: string | null
          target_type?: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          summary?: string | null
          target_id?: string | null
          target_name?: string | null
          target_type?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          icon_url: string | null
          id: string
          name: string
          ordem: number | null
        }
        Insert: {
          created_at?: string | null
          icon_url?: string | null
          id?: string
          name: string
          ordem?: number | null
        }
        Update: {
          created_at?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          ordem?: number | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          access_password: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string | null
          wallpaper_url: string | null
        }
        Insert: {
          access_password?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug?: string | null
          wallpaper_url?: string | null
        }
        Update: {
          access_password?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string | null
          wallpaper_url?: string | null
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      knowledge_files: {
        Row: {
          description: string | null
          file_name: string
          id: string
          is_archived: boolean | null
          storage_path: string
          tool_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          description?: string | null
          file_name: string
          id?: string
          is_archived?: boolean | null
          storage_path: string
          tool_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          description?: string | null
          file_name?: string
          id?: string
          is_archived?: boolean | null
          storage_path?: string
          tool_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_files_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: string
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      process_attachments: {
        Row: {
          file_name: string
          file_url: string
          id: string
          process_id: string
          uploaded_at: string | null
        }
        Insert: {
          file_name: string
          file_url: string
          id?: string
          process_id: string
          uploaded_at?: string | null
        }
        Update: {
          file_name?: string
          file_url?: string
          id?: string
          process_id?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_attachments_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      processes: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          name: string
          setor: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          name: string
          setor?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          name?: string
          setor?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      social_cards: {
        Row: {
          ativo: boolean | null
          atualizado_em: string
          atualizado_por: string | null
          button_label: string | null
          criado_em: string
          criado_por: string | null
          descricao: string | null
          icon: string | null
          id: string
          image_url: string | null
          ordem: number | null
          titulo: string
          url: string | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string
          atualizado_por?: string | null
          button_label?: string | null
          criado_em?: string
          criado_por?: string | null
          descricao?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          ordem?: number | null
          titulo: string
          url?: string | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string
          atualizado_por?: string | null
          button_label?: string | null
          criado_em?: string
          criado_por?: string | null
          descricao?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          ordem?: number | null
          titulo?: string
          url?: string | null
        }
        Relationships: []
      }
      tool_access_logs: {
        Row: {
          access_profile: string
          browser_name: string | null
          created_at: string
          device_name: string | null
          event_type: string
          id: string
          ip_address: string | null
          os_name: string | null
          tool_id: string
          user_agent: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          access_profile?: string
          browser_name?: string | null
          created_at?: string
          device_name?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          os_name?: string | null
          tool_id: string
          user_agent?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          access_profile?: string
          browser_name?: string | null
          created_at?: string
          device_name?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          os_name?: string | null
          tool_id?: string
          user_agent?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_access_logs_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_blocks: {
        Row: {
          aba: string | null
          atualizado_em: string
          block_type: string
          conteudo: string | null
          criado_em: string
          descricao: string | null
          id: string
          ordem: number | null
          storage_path: string | null
          titulo: string
          tool_id: string
          visibility_editor: boolean | null
          visibility_reader: boolean | null
          visibility_visitor: boolean | null
        }
        Insert: {
          aba?: string | null
          atualizado_em?: string
          block_type?: string
          conteudo?: string | null
          criado_em?: string
          descricao?: string | null
          id?: string
          ordem?: number | null
          storage_path?: string | null
          titulo?: string
          tool_id: string
          visibility_editor?: boolean | null
          visibility_reader?: boolean | null
          visibility_visitor?: boolean | null
        }
        Update: {
          aba?: string | null
          atualizado_em?: string
          block_type?: string
          conteudo?: string | null
          criado_em?: string
          descricao?: string | null
          id?: string
          ordem?: number | null
          storage_path?: string | null
          titulo?: string
          tool_id?: string
          visibility_editor?: boolean | null
          visibility_reader?: boolean | null
          visibility_visitor?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_blocks_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_credentials: {
        Row: {
          api_labels: Json | null
          credential_anon_public: string | null
          credential_api: string | null
          credential_email: string | null
          credential_project_id: string | null
          credential_publish_key: string | null
          credential_secret_key: string | null
          credential_senha: string | null
          credential_service_role: string | null
          credential_url: string | null
          id: string
          prompt_final: string | null
          tool_id: string
        }
        Insert: {
          api_labels?: Json | null
          credential_anon_public?: string | null
          credential_api?: string | null
          credential_email?: string | null
          credential_project_id?: string | null
          credential_publish_key?: string | null
          credential_secret_key?: string | null
          credential_senha?: string | null
          credential_service_role?: string | null
          credential_url?: string | null
          id?: string
          prompt_final?: string | null
          tool_id: string
        }
        Update: {
          api_labels?: Json | null
          credential_anon_public?: string | null
          credential_api?: string | null
          credential_email?: string | null
          credential_project_id?: string | null
          credential_publish_key?: string | null
          credential_secret_key?: string | null
          credential_senha?: string | null
          credential_service_role?: string | null
          credential_url?: string | null
          id?: string
          prompt_final?: string | null
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_credentials_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: true
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_favorites: {
        Row: {
          created_at: string
          id: string
          tool_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tool_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tool_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_favorites_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_links: {
        Row: {
          created_at: string
          id: string
          link_type: string
          source_tool_id: string
          target_tool_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link_type?: string
          source_tool_id: string
          target_tool_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link_type?: string
          source_tool_id?: string
          target_tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_links_source_tool_id_fkey"
            columns: ["source_tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_links_target_tool_id_fkey"
            columns: ["target_tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_versions: {
        Row: {
          change_summary: string | null
          changed_by: string | null
          changed_fields: string[] | null
          created_at: string
          id: string
          snapshot: Json
          tool_id: string
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          changed_by?: string | null
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          snapshot: Json
          tool_id: string
          version_number?: number
        }
        Update: {
          change_summary?: string | null
          changed_by?: string | null
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          snapshot?: Json
          tool_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "tool_versions_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          acoes: Json | null
          atualizado_em: string
          atualizado_por: string | null
          categoria: string | null
          cor_cartao: string | null
          criado_em: string
          criado_por: string | null
          deleted_at: string | null
          deleted_by: string | null
          descricao: string | null
          empresa_id: string | null
          funcao: string | null
          id: string
          image_url: string | null
          imported_from_file_name: string | null
          instrucoes: string | null
          is_archived: boolean | null
          link_acesso_original: string | null
          link_contexto: string | null
          link_contexto_transformacao_base_conhecimento: string | null
          link_criacao_prompt: string | null
          link_gpt_criacao_prompt: string | null
          link_gpt_pronto: string | null
          link_gpt_transformacao_base_conhecimento: string | null
          link_gpt_transformacao_contexto: string | null
          links_producao: Json | null
          modelo_recomendado: string | null
          origem: string | null
          origem_detalhe: string | null
          print_processo_url: string | null
          print_resultado_url: string | null
          quebra_gelos: string[] | null
          recursos: Json | null
          setores: string | null
          status: string | null
          tags: string[] | null
          titulo: string
          tool_type: string | null
          version_number: number | null
        }
        Insert: {
          acoes?: Json | null
          atualizado_em?: string
          atualizado_por?: string | null
          categoria?: string | null
          cor_cartao?: string | null
          criado_em?: string
          criado_por?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          empresa_id?: string | null
          funcao?: string | null
          id?: string
          image_url?: string | null
          imported_from_file_name?: string | null
          instrucoes?: string | null
          is_archived?: boolean | null
          link_acesso_original?: string | null
          link_contexto?: string | null
          link_contexto_transformacao_base_conhecimento?: string | null
          link_criacao_prompt?: string | null
          link_gpt_criacao_prompt?: string | null
          link_gpt_pronto?: string | null
          link_gpt_transformacao_base_conhecimento?: string | null
          link_gpt_transformacao_contexto?: string | null
          links_producao?: Json | null
          modelo_recomendado?: string | null
          origem?: string | null
          origem_detalhe?: string | null
          print_processo_url?: string | null
          print_resultado_url?: string | null
          quebra_gelos?: string[] | null
          recursos?: Json | null
          setores?: string | null
          status?: string | null
          tags?: string[] | null
          titulo: string
          tool_type?: string | null
          version_number?: number | null
        }
        Update: {
          acoes?: Json | null
          atualizado_em?: string
          atualizado_por?: string | null
          categoria?: string | null
          cor_cartao?: string | null
          criado_em?: string
          criado_por?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          empresa_id?: string | null
          funcao?: string | null
          id?: string
          image_url?: string | null
          imported_from_file_name?: string | null
          instrucoes?: string | null
          is_archived?: boolean | null
          link_acesso_original?: string | null
          link_contexto?: string | null
          link_contexto_transformacao_base_conhecimento?: string | null
          link_criacao_prompt?: string | null
          link_gpt_criacao_prompt?: string | null
          link_gpt_pronto?: string | null
          link_gpt_transformacao_base_conhecimento?: string | null
          link_gpt_transformacao_contexto?: string | null
          links_producao?: Json | null
          modelo_recomendado?: string | null
          origem?: string | null
          origem_detalhe?: string | null
          print_processo_url?: string | null
          print_resultado_url?: string | null
          quebra_gelos?: string[] | null
          recursos?: Json | null
          setores?: string | null
          status?: string | null
          tags?: string[] | null
          titulo?: string
          tool_type?: string | null
          version_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tools_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tools_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "companies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_passwords: {
        Row: {
          password: string
          updated_at: string
          user_id: string
        }
        Insert: {
          password: string
          updated_at?: string
          user_id: string
        }
        Update: {
          password?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wechat_shares: {
        Row: {
          content_type: string
          created_at: string
          device_info: string | null
          expires_at: string
          file_name: string | null
          file_url: string | null
          id: string
          shared_by_name: string | null
          text_content: string | null
        }
        Insert: {
          content_type?: string
          created_at?: string
          device_info?: string | null
          expires_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          shared_by_name?: string | null
          text_content?: string | null
        }
        Update: {
          content_type?: string
          created_at?: string
          device_info?: string | null
          expires_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          shared_by_name?: string | null
          text_content?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      companies_public: {
        Row: {
          created_at: string | null
          id: string | null
          logo_url: string | null
          name: string | null
          slug: string | null
          wallpaper_url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          logo_url?: string | null
          name?: string | null
          slug?: string | null
          wallpaper_url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          logo_url?: string | null
          name?: string | null
          slug?: string | null
          wallpaper_url?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_tool_prompt: { Args: { _tool_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "editor" | "readonly"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["editor", "readonly"],
    },
  },
} as const

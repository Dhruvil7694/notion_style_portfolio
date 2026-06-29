export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      content: {
        Row: {
          ai_summary: string | null
          concepts: string[]
          content: Json
          created_at: string
          excerpt: string | null
          expertise_slugs: string[]
          faq: Json
          featured_image: string | null
          id: string
          key_takeaways: string[]
          published_at: string | null
          search_vector: unknown
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          tags: string[]
          title: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          concepts?: string[]
          content?: Json
          created_at?: string
          excerpt?: string | null
          expertise_slugs?: string[]
          faq?: Json
          featured_image?: string | null
          id?: string
          key_takeaways?: string[]
          published_at?: string | null
          search_vector?: unknown
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          title: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          concepts?: string[]
          content?: Json
          created_at?: string
          excerpt?: string | null
          expertise_slugs?: string[]
          faq?: Json
          featured_image?: string | null
          id?: string
          key_takeaways?: string[]
          published_at?: string | null
          search_vector?: unknown
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[]
          title?: string
          type?: Database["public"]["Enums"]["content_type"]
          updated_at?: string
        }
        Relationships: []
      }
      expertise_areas: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          featured: boolean
          icon_name: string | null
          id: string
          key_takeaways: string[]
          keywords: string[]
          related_expertise_slugs: string[]
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          summary: string | null
          title: string
          updated_at: string
          why_it_matters: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          featured?: boolean
          icon_name?: string | null
          id?: string
          key_takeaways?: string[]
          keywords?: string[]
          related_expertise_slugs?: string[]
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          title: string
          updated_at?: string
          why_it_matters?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          featured?: boolean
          icon_name?: string | null
          id?: string
          key_takeaways?: string[]
          keywords?: string[]
          related_expertise_slugs?: string[]
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          why_it_matters?: string | null
        }
        Relationships: []
      }
      technology_registry: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          display_order: number
          documentation_url: string | null
          featured: boolean
          id: string
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          summary: string | null
          title: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          documentation_url?: string | null
          featured?: boolean
          id?: string
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          title: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          documentation_url?: string | null
          featured?: boolean
          id?: string
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      concept_registry: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          featured: boolean
          id: string
          related_concept_slugs: string[]
          related_expertise_slugs: string[]
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          summary: string | null
          title: string
          updated_at: string
          why_it_matters: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          featured?: boolean
          id?: string
          related_concept_slugs?: string[]
          related_expertise_slugs?: string[]
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          title: string
          updated_at?: string
          why_it_matters?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          featured?: boolean
          id?: string
          related_concept_slugs?: string[]
          related_expertise_slugs?: string[]
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          why_it_matters?: string | null
        }
        Relationships: []
      }
      education: {
        Row: {
          achievements: string[]
          created_at: string
          degree: string
          description: string | null
          end_date: string | null
          id: string
          institution: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          achievements?: string[]
          created_at?: string
          degree: string
          description?: string | null
          end_date?: string | null
          id?: string
          institution: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          achievements?: string[]
          created_at?: string
          degree?: string
          description?: string | null
          end_date?: string | null
          id?: string
          institution?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      experience: {
        Row: {
          achievements: string[]
          case_study: Json
          company: string
          created_at: string
          description: string | null
          display_order: number
          end_date: string | null
          id: string
          location: string | null
          role: string
          start_date: string
          tech_stack: string[]
          updated_at: string
        }
        Insert: {
          achievements?: string[]
          case_study?: Json
          company: string
          created_at?: string
          description?: string | null
          display_order?: number
          end_date?: string | null
          id?: string
          location?: string | null
          role: string
          start_date: string
          tech_stack?: string[]
          updated_at?: string
        }
        Update: {
          achievements?: string[]
          case_study?: Json
          company?: string
          created_at?: string
          description?: string | null
          display_order?: number
          end_date?: string | null
          id?: string
          location?: string | null
          role?: string
          start_date?: string
          tech_stack?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          ai_design: Json | null
          ai_design_edges: Json | null
          ai_design_nodes: Json | null
          ai_summary: string | null
          approach: string[] | null
          architecture: Json | null
          architecture_edges: Json | null
          architecture_image: string | null
          architecture_nodes: Json | null
          category: string | null
          challenge: string | null
          challenges: Json
          concepts: string[]
          content: Json
          cover_image: string | null
          created_at: string
          demo_images: Json | null
          demo_video_url: string | null
          display_order: number
          expertise_slugs: string[]
          faq: Json
          featured: boolean
          gallery: Json | null
          github_url: string | null
          hover_preview_enabled: boolean
          icon_name: string | null
          id: string
          impact: string | null
          key_takeaways: string[]
          learnings: string[] | null
          live_url: string | null
          metrics: Json
          my_contribution: string[] | null
          overview: string | null
          problem: string | null
          project_facts: Json
          project_url: string | null
          published_at: string | null
          results: string[] | null
          role: string | null
          search_vector: unknown
          seo_description: string | null
          seo_title: string | null
          slug: string
          solution: string | null
          status: Database["public"]["Enums"]["content_status"]
          summary: string
          tagline: string | null
          tech_stack: string[]
          tech_stack_groups: Json | null
          technologies: string[]
          thumbnail: string | null
          timeline: Json | null
          title: string
          tradeoffs: Json
          updated_at: string
          why_built: string | null
          year: string | null
        }
        Insert: {
          ai_design?: Json | null
          ai_design_edges?: Json | null
          ai_design_nodes?: Json | null
          ai_summary?: string | null
          approach?: string[] | null
          architecture?: Json | null
          architecture_edges?: Json | null
          architecture_image?: string | null
          architecture_nodes?: Json | null
          category?: string | null
          challenge?: string | null
          challenges?: Json
          concepts?: string[]
          content?: Json
          cover_image?: string | null
          created_at?: string
          demo_images?: Json | null
          demo_video_url?: string | null
          display_order?: number
          expertise_slugs?: string[]
          faq?: Json
          featured?: boolean
          gallery?: Json | null
          github_url?: string | null
          hover_preview_enabled?: boolean
          icon_name?: string | null
          id?: string
          impact?: string | null
          key_takeaways?: string[]
          learnings?: string[] | null
          live_url?: string | null
          metrics?: Json
          my_contribution?: string[] | null
          overview?: string | null
          problem?: string | null
          project_facts?: Json
          project_url?: string | null
          published_at?: string | null
          results?: string[] | null
          role?: string | null
          search_vector?: unknown
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          solution?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          summary: string
          tagline?: string | null
          tech_stack?: string[]
          tech_stack_groups?: Json | null
          technologies?: string[]
          thumbnail?: string | null
          timeline?: Json | null
          title: string
          tradeoffs?: Json
          updated_at?: string
          why_built?: string | null
          year?: string | null
        }
        Update: {
          ai_design?: Json | null
          ai_design_edges?: Json | null
          ai_design_nodes?: Json | null
          ai_summary?: string | null
          approach?: string[] | null
          architecture?: Json | null
          architecture_edges?: Json | null
          architecture_image?: string | null
          architecture_nodes?: Json | null
          category?: string | null
          challenge?: string | null
          challenges?: Json
          concepts?: string[]
          content?: Json
          cover_image?: string | null
          created_at?: string
          demo_images?: Json | null
          demo_video_url?: string | null
          display_order?: number
          expertise_slugs?: string[]
          faq?: Json
          featured?: boolean
          gallery?: Json | null
          github_url?: string | null
          hover_preview_enabled?: boolean
          icon_name?: string | null
          id?: string
          impact?: string | null
          key_takeaways?: string[]
          learnings?: string[] | null
          live_url?: string | null
          metrics?: Json
          my_contribution?: string[] | null
          overview?: string | null
          problem?: string | null
          project_facts?: Json
          project_url?: string | null
          published_at?: string | null
          results?: string[] | null
          role?: string | null
          search_vector?: unknown
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          solution?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          summary?: string
          tagline?: string | null
          tech_stack?: string[]
          tech_stack_groups?: Json | null
          technologies?: string[]
          thumbnail?: string | null
          timeline?: Json | null
          title?: string
          tradeoffs?: Json
          updated_at?: string
          why_built?: string | null
          year?: string | null
        }
        Relationships: []
      }
      resumes: {
        Row: {
          created_at: string
          file_path: string
          id: string
          is_active: boolean
          uploaded_at: string
          version: number
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          is_active?: boolean
          uploaded_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          is_active?: boolean
          uploaded_at?: string
          version?: number
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: Database["public"]["Enums"]["skill_category"]
          created_at: string
          display_order: number
          id: string
          name: string
          proficiency: Database["public"]["Enums"]["skill_proficiency"] | null
          show_on_landing: boolean
        }
        Insert: {
          category: Database["public"]["Enums"]["skill_category"]
          created_at?: string
          display_order?: number
          id?: string
          name: string
          proficiency?: Database["public"]["Enums"]["skill_proficiency"] | null
          show_on_landing?: boolean
        }
        Update: {
          category?: Database["public"]["Enums"]["skill_category"]
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          proficiency?: Database["public"]["Enums"]["skill_proficiency"] | null
          show_on_landing?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      build_content_search_vector: {
        Args: { p_excerpt: string; p_tags: string[]; p_title: string }
        Returns: unknown
      }
      build_project_search_vector: {
        Args: { p_summary: string; p_tech_stack: string[]; p_title: string }
        Returns: unknown
      }
      is_admin: { Args: never; Returns: boolean }
      is_valid_slug: { Args: { slug: string }; Returns: boolean }
    }
    Enums: {
      content_status: "draft" | "published" | "archived"
      content_type: "blog" | "research" | "automation" | "publication" | "note"
      skill_category:
        | "language"
        | "framework"
        | "tool"
        | "cloud"
        | "ai_ml"
        | "soft"
        | "other"
      skill_proficiency: "learning" | "proficient" | "expert"
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
      content_status: ["draft", "published", "archived"],
      content_type: ["blog", "research", "automation", "publication", "note"],
      skill_category: [
        "language",
        "framework",
        "tool",
        "cloud",
        "ai_ml",
        "soft",
        "other",
      ],
      skill_proficiency: ["learning", "proficient", "expert"],
    },
  },
} as const

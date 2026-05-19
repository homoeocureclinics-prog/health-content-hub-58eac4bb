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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analytics_snapshots: {
        Row: {
          captured_at: string
          id: string
          metrics: Json
          platform: Database["public"]["Enums"]["social_platform"]
          schedule_id: string | null
          user_id: string
        }
        Insert: {
          captured_at?: string
          id?: string
          metrics?: Json
          platform: Database["public"]["Enums"]["social_platform"]
          schedule_id?: string | null
          user_id: string
        }
        Update: {
          captured_at?: string
          id?: string
          metrics?: Json
          platform?: Database["public"]["Enums"]["social_platform"]
          schedule_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_snapshots_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      content_instructions: {
        Row: {
          audience: string
          created_at: string
          cta_template: string
          disclaimer: string
          do_not_say: string | null
          hashtag_style: string
          signature: string | null
          tone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audience?: string
          created_at?: string
          cta_template?: string
          disclaimer?: string
          do_not_say?: string | null
          hashtag_style?: string
          signature?: string | null
          tone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audience?: string
          created_at?: string
          cta_template?: string
          disclaimer?: string
          do_not_say?: string | null
          hashtag_style?: string
          signature?: string | null
          tone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          id: string
          name: string
          recurrence: string
          source: string
          tags: string[]
          url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          name: string
          recurrence?: string
          source?: string
          tags?: string[]
          url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          name?: string
          recurrence?: string
          source?: string
          tags?: string[]
          url?: string | null
        }
        Relationships: []
      }
      media_assets: {
        Row: {
          caption: string | null
          created_at: string
          duration_seconds: number | null
          hashtags: string[]
          height: number | null
          id: string
          kind: string
          mime_type: string
          post_id: string | null
          scheduled_for: string | null
          size_bytes: number | null
          storage_path: string
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          duration_seconds?: number | null
          hashtags?: string[]
          height?: number | null
          id?: string
          kind?: string
          mime_type: string
          post_id?: string | null
          scheduled_for?: string | null
          size_bytes?: number | null
          storage_path: string
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          duration_seconds?: number | null
          hashtags?: string[]
          height?: number | null
          id?: string
          kind?: string
          mime_type?: string
          post_id?: string | null
          scheduled_for?: string | null
          size_bytes?: number | null
          storage_path?: string
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      news_items: {
        Row: {
          fetched_at: string
          id: string
          published_at: string | null
          region: string
          source: string | null
          specialty_tags: string[]
          summary: string | null
          title: string
          url: string
        }
        Insert: {
          fetched_at?: string
          id?: string
          published_at?: string | null
          region?: string
          source?: string | null
          specialty_tags?: string[]
          summary?: string | null
          title: string
          url: string
        }
        Update: {
          fetched_at?: string
          id?: string
          published_at?: string | null
          region?: string
          source?: string | null
          specialty_tags?: string[]
          summary?: string | null
          title?: string
          url?: string
        }
        Relationships: []
      }
      post_variants: {
        Row: {
          approved: boolean
          body: string
          created_at: string
          hashtags: string[]
          id: string
          kind: Database["public"]["Enums"]["variant_kind"]
          language: string
          metadata: Json
          platform: Database["public"]["Enums"]["social_platform"]
          post_id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved?: boolean
          body: string
          created_at?: string
          hashtags?: string[]
          id?: string
          kind: Database["public"]["Enums"]["variant_kind"]
          language?: string
          metadata?: Json
          platform: Database["public"]["Enums"]["social_platform"]
          post_id: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved?: boolean
          body?: string
          created_at?: string
          hashtags?: string[]
          id?: string
          kind?: Database["public"]["Enums"]["variant_kind"]
          language?: string
          metadata?: Json
          platform?: Database["public"]["Enums"]["social_platform"]
          post_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_variants_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          brief: string | null
          citations: Json
          cover_image_url: string | null
          created_at: string
          id: string
          research_summary: string | null
          source_event_id: string | null
          source_news_id: string | null
          status: Database["public"]["Enums"]["post_status"]
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brief?: string | null
          citations?: Json
          cover_image_url?: string | null
          created_at?: string
          id?: string
          research_summary?: string | null
          source_event_id?: string | null
          source_news_id?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brief?: string | null
          citations?: Json
          cover_image_url?: string | null
          created_at?: string
          id?: string
          research_summary?: string | null
          source_event_id?: string | null
          source_news_id?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          city: string | null
          clinic_name: string | null
          created_at: string
          full_name: string | null
          id: string
          languages: string[]
          onboarded: boolean
          registration_number: string | null
          specialty: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          clinic_name?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          languages?: string[]
          onboarded?: boolean
          registration_number?: string | null
          specialty?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          clinic_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          languages?: string[]
          onboarded?: boolean
          registration_number?: string | null
          specialty?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      publish_logs: {
        Row: {
          created_at: string
          id: string
          level: string
          message: string
          payload: Json | null
          platform: Database["public"]["Enums"]["social_platform"]
          schedule_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: string
          message: string
          payload?: Json | null
          platform: Database["public"]["Enums"]["social_platform"]
          schedule_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: string
          message?: string
          payload?: Json | null
          platform?: Database["public"]["Enums"]["social_platform"]
          schedule_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "publish_logs_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          attempts: number
          created_at: string
          external_post_id: string | null
          id: string
          last_error: string | null
          scheduled_for: string
          social_account_id: string | null
          status: Database["public"]["Enums"]["schedule_status"]
          updated_at: string
          user_id: string
          variant_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          external_post_id?: string | null
          id?: string
          last_error?: string | null
          scheduled_for: string
          social_account_id?: string | null
          status?: Database["public"]["Enums"]["schedule_status"]
          updated_at?: string
          user_id: string
          variant_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          external_post_id?: string | null
          id?: string
          last_error?: string | null
          scheduled_for?: string
          social_account_id?: string | null
          status?: Database["public"]["Enums"]["schedule_status"]
          updated_at?: string
          user_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "post_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      social_accounts: {
        Row: {
          access_token: string | null
          avatar_url: string | null
          created_at: string
          display_name: string | null
          external_account_id: string
          handle: string | null
          id: string
          meta: Json
          platform: Database["public"]["Enums"]["social_platform"]
          refresh_token: string | null
          scopes: string[] | null
          status: string
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          external_account_id: string
          handle?: string | null
          id?: string
          meta?: Json
          platform: Database["public"]["Enums"]["social_platform"]
          refresh_token?: string | null
          scopes?: string[] | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          external_account_id?: string
          handle?: string | null
          id?: string
          meta?: Json
          platform?: Database["public"]["Enums"]["social_platform"]
          refresh_token?: string | null
          scopes?: string[] | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_channels: {
        Row: {
          created_at: string
          handle: string | null
          id: string
          invite_url: string
          is_own: boolean
          name: string
          niche_tags: string[]
          priority: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          handle?: string | null
          id?: string
          invite_url: string
          is_own?: boolean
          name: string
          niche_tags?: string[]
          priority?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          handle?: string | null
          id?: string
          invite_url?: string
          is_own?: boolean
          name?: string
          niche_tags?: string[]
          priority?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "doctor"
      post_status:
        | "draft"
        | "review"
        | "approved"
        | "scheduled"
        | "published"
        | "failed"
        | "archived"
      schedule_status:
        | "pending"
        | "publishing"
        | "published"
        | "failed"
        | "cancelled"
      social_platform: "instagram" | "facebook" | "linkedin" | "youtube"
      variant_kind:
        | "ig_caption"
        | "ig_reel_script"
        | "ig_carousel"
        | "fb_post"
        | "li_post"
        | "li_article"
        | "yt_short_script"
        | "yt_long_script"
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
      app_role: ["admin", "doctor"],
      post_status: [
        "draft",
        "review",
        "approved",
        "scheduled",
        "published",
        "failed",
        "archived",
      ],
      schedule_status: [
        "pending",
        "publishing",
        "published",
        "failed",
        "cancelled",
      ],
      social_platform: ["instagram", "facebook", "linkedin", "youtube"],
      variant_kind: [
        "ig_caption",
        "ig_reel_script",
        "ig_carousel",
        "fb_post",
        "li_post",
        "li_article",
        "yt_short_script",
        "yt_long_script",
      ],
    },
  },
} as const

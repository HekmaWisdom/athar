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
      authors: {
        Row: {
          bio_ar: string | null
          bio_en: string | null
          created_at: string
          era: string | null
          id: string
          image_url: string | null
          name_ar: string
          name_en: string | null
        }
        Insert: {
          bio_ar?: string | null
          bio_en?: string | null
          created_at?: string
          era?: string | null
          id?: string
          image_url?: string | null
          name_ar: string
          name_en?: string | null
        }
        Update: {
          bio_ar?: string | null
          bio_en?: string | null
          created_at?: string
          era?: string | null
          id?: string
          image_url?: string | null
          name_ar?: string
          name_en?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          accent: string | null
          created_at: string
          icon: string | null
          id: string
          name_ar: string
          name_en: string
          slug: string
          sort_order: number
        }
        Insert: {
          accent?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name_ar: string
          name_en: string
          slug: string
          sort_order?: number
        }
        Update: {
          accent?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name_ar?: string
          name_en?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      daily_quotes: {
        Row: {
          created_at: string
          quote_id: string
          the_date: string
        }
        Insert: {
          created_at?: string
          quote_id: string
          the_date: string
        }
        Update: {
          created_at?: string
          quote_id?: string
          the_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_quotes_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          quote_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quote_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quote_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          ciphertext: string
          created_at: string
          id: string
          iv: string
          mood: string | null
          quote_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ciphertext: string
          created_at?: string
          id?: string
          iv: string
          mood?: string | null
          quote_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ciphertext?: string
          created_at?: string
          id?: string
          iv?: string
          mood?: string | null
          quote_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_checkins: {
        Row: {
          created_at: string
          id: string
          mood: string
          the_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mood: string
          the_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mood?: string
          the_date?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          interests: string[]
          journal_salt: string | null
          last_reminder_sent_date: string | null
          locale: string
          mood_baseline: string | null
          onboarded: boolean
          reminder_time: string
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          interests?: string[]
          journal_salt?: string | null
          last_reminder_sent_date?: string | null
          locale?: string
          mood_baseline?: string | null
          onboarded?: boolean
          reminder_time?: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          interests?: string[]
          journal_salt?: string | null
          last_reminder_sent_date?: string | null
          locale?: string
          mood_baseline?: string | null
          onboarded?: boolean
          reminder_time?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          action_step_ar: string | null
          action_step_en: string | null
          author_id: string | null
          category_id: string | null
          created_at: string
          explanation_ar: string | null
          explanation_en: string | null
          id: string
          is_premium_explanation: boolean
          journal_prompt_ar: string | null
          journal_prompt_en: string | null
          modern_context_ar: string | null
          modern_context_en: string | null
          published: boolean
          scheduled_for: string | null
          source: string | null
          tags: string[] | null
          text_ar: string
          text_en: string | null
          updated_at: string
        }
        Insert: {
          action_step_ar?: string | null
          action_step_en?: string | null
          author_id?: string | null
          category_id?: string | null
          created_at?: string
          explanation_ar?: string | null
          explanation_en?: string | null
          id?: string
          is_premium_explanation?: boolean
          journal_prompt_ar?: string | null
          journal_prompt_en?: string | null
          modern_context_ar?: string | null
          modern_context_en?: string | null
          published?: boolean
          scheduled_for?: string | null
          source?: string | null
          tags?: string[] | null
          text_ar: string
          text_en?: string | null
          updated_at?: string
        }
        Update: {
          action_step_ar?: string | null
          action_step_en?: string | null
          author_id?: string | null
          category_id?: string | null
          created_at?: string
          explanation_ar?: string | null
          explanation_en?: string | null
          id?: string
          is_premium_explanation?: boolean
          journal_prompt_ar?: string | null
          journal_prompt_en?: string | null
          modern_context_ar?: string | null
          modern_context_en?: string | null
          published?: boolean
          scheduled_for?: string | null
          source?: string | null
          tags?: string[] | null
          text_ar?: string
          text_en?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          renews_at: string | null
          status: string
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          renews_at?: string | null
          status?: string
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          renews_at?: string | null
          status?: string
          tier?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_stats: {
        Row: {
          current_streak: number
          last_active_date: string | null
          level: number
          longest_streak: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          current_streak?: number
          last_active_date?: string | null
          level?: number
          longest_streak?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          current_streak?: number
          last_active_date?: string | null
          level?: number
          longest_streak?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          id: number
          user_id: string | null
          session_id: string
          event_name: string
          properties: Json
          occurred_at: string
        }
        Insert: {
          id?: number
          user_id?: string | null
          session_id: string
          event_name: string
          properties?: Json
          occurred_at?: string
        }
        Update: {
          id?: number
          user_id?: string | null
          session_id?: string
          event_name?: string
          properties?: Json
          occurred_at?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          id: string
          slug: string
          name_ar: string
          name_en: string
          description_ar: string | null
          description_en: string | null
          icon: string
          kind: string
          threshold: number
          sort_order: number
        }
        Insert: {
          id?: string
          slug: string
          name_ar: string
          name_en: string
          description_ar?: string | null
          description_en?: string | null
          icon?: string
          kind: string
          threshold: number
          sort_order?: number
        }
        Update: {
          id?: string
          slug?: string
          name_ar?: string
          name_en?: string
          description_ar?: string | null
          description_en?: string | null
          icon?: string
          kind?: string
          threshold?: number
          sort_order?: number
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          user_id: string
          badge_id: string
          earned_at: string
        }
        Insert: {
          user_id: string
          badge_id: string
          earned_at?: string
        }
        Update: {
          user_id?: string
          badge_id?: string
          earned_at?: string
        }
        Relationships: []
      }
      challenges: {
        Row: {
          id: string
          slug: string
          title_ar: string
          title_en: string
          description_ar: string | null
          description_en: string | null
          kind: string
          goal_type: string
          goal_count: number
          starts_on: string
          ends_on: string
          badge_id: string | null
        }
        Insert: {
          id?: string
          slug: string
          title_ar: string
          title_en: string
          description_ar?: string | null
          description_en?: string | null
          kind: string
          goal_type: string
          goal_count: number
          starts_on: string
          ends_on: string
          badge_id?: string | null
        }
        Update: {
          id?: string
          slug?: string
          title_ar?: string
          title_en?: string
          description_ar?: string | null
          description_en?: string | null
          kind?: string
          goal_type?: string
          goal_count?: number
          starts_on?: string
          ends_on?: string
          badge_id?: string | null
        }
        Relationships: []
      }
      challenge_progress: {
        Row: {
          user_id: string
          challenge_id: string
          progress: number
          completed_at: string | null
        }
        Insert: {
          user_id: string
          challenge_id: string
          progress?: number
          completed_at?: string | null
        }
        Update: {
          user_id?: string
          challenge_id?: string
          progress?: number
          completed_at?: string | null
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const

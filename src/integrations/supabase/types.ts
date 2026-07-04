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
      aipf_broken_link_reports: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_link_id: string | null
          id: string
          internal_notes: string | null
          issue_type: string | null
          message: string | null
          reporter_email: string | null
          resolved: boolean
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_link_id?: string | null
          id?: string
          internal_notes?: string | null
          issue_type?: string | null
          message?: string | null
          reporter_email?: string | null
          resolved?: boolean
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_link_id?: string | null
          id?: string
          internal_notes?: string | null
          issue_type?: string | null
          message?: string | null
          reporter_email?: string | null
          resolved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "aipf_broken_link_reports_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "aipf_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aipf_broken_link_reports_entity_link_id_fkey"
            columns: ["entity_link_id"]
            isOneToOne: false
            referencedRelation: "aipf_entity_links"
            referencedColumns: ["id"]
          },
        ]
      }
      aipf_contact_messages: {
        Row: {
          category: string | null
          created_at: string
          email: string | null
          id: string
          internal_notes: string | null
          message: string | null
          name: string | null
          resolved: boolean
          subject: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          email?: string | null
          id?: string
          internal_notes?: string | null
          message?: string | null
          name?: string | null
          resolved?: boolean
          subject?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          email?: string | null
          id?: string
          internal_notes?: string | null
          message?: string | null
          name?: string | null
          resolved?: boolean
          subject?: string | null
        }
        Relationships: []
      }
      aipf_entities: {
        Row: {
          bio: string | null
          category: string | null
          country_region: string | null
          created_at: string
          creator_studio_name: string | null
          entity_name: string
          follower_count: string | null
          founding_cohort: boolean
          id: string
          logo_url: string | null
          member_number: string | null
          member_type: string | null
          official_image_url: string | null
          published: boolean
          slug: string
          status_note: string | null
          updated_at: string
          verification_status: string
          year_launched: number | null
        }
        Insert: {
          bio?: string | null
          category?: string | null
          country_region?: string | null
          created_at?: string
          creator_studio_name?: string | null
          entity_name: string
          follower_count?: string | null
          founding_cohort?: boolean
          id?: string
          logo_url?: string | null
          member_number?: string | null
          member_type?: string | null
          official_image_url?: string | null
          published?: boolean
          slug: string
          status_note?: string | null
          updated_at?: string
          verification_status?: string
          year_launched?: number | null
        }
        Update: {
          bio?: string | null
          category?: string | null
          country_region?: string | null
          created_at?: string
          creator_studio_name?: string | null
          entity_name?: string
          follower_count?: string | null
          founding_cohort?: boolean
          id?: string
          logo_url?: string | null
          member_number?: string | null
          member_type?: string | null
          official_image_url?: string | null
          published?: boolean
          slug?: string
          status_note?: string | null
          updated_at?: string
          verification_status?: string
          year_launched?: number | null
        }
        Relationships: []
      }
      aipf_entity_achievements: {
        Row: {
          created_at: string
          description: string | null
          entity_id: string
          id: string
          title: string
          url: string | null
          year: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          entity_id: string
          id?: string
          title: string
          url?: string | null
          year?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          entity_id?: string
          id?: string
          title?: string
          url?: string | null
          year?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "aipf_entity_achievements_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "aipf_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      aipf_entity_links: {
        Row: {
          created_at: string
          entity_id: string
          id: string
          is_primary: boolean
          label: string | null
          last_checked: string | null
          notes: string | null
          platform: string | null
          priority: number
          show_publicly: boolean
          status: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          id?: string
          is_primary?: boolean
          label?: string | null
          last_checked?: string | null
          notes?: string | null
          platform?: string | null
          priority?: number
          show_publicly?: boolean
          status?: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          id?: string
          is_primary?: boolean
          label?: string | null
          last_checked?: string | null
          notes?: string | null
          platform?: string | null
          priority?: number
          show_publicly?: boolean
          status?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "aipf_entity_links_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "aipf_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      aipf_interest_submissions: {
        Row: {
          additional_links: string | null
          ai_native_explanation: string | null
          authorized: boolean
          category: string | null
          contact_email: string | null
          contact_name: string | null
          country_region: string | null
          created_at: string
          creator_studio_name: string
          entity_name: string
          follower_count: string | null
          id: string
          internal_notes: string | null
          logo_url: string | null
          main_platform_link: string | null
          newsletter_opt_in: boolean
          official_image_url: string | null
          reviewer_id: string | null
          short_bio: string | null
          status: string
          understands_no_guarantee: boolean
          updated_at: string
          why_include: string | null
          year_launched: number | null
        }
        Insert: {
          additional_links?: string | null
          ai_native_explanation?: string | null
          authorized?: boolean
          category?: string | null
          contact_email?: string | null
          contact_name?: string | null
          country_region?: string | null
          created_at?: string
          creator_studio_name: string
          entity_name: string
          follower_count?: string | null
          id?: string
          internal_notes?: string | null
          logo_url?: string | null
          main_platform_link?: string | null
          newsletter_opt_in?: boolean
          official_image_url?: string | null
          reviewer_id?: string | null
          short_bio?: string | null
          status?: string
          understands_no_guarantee?: boolean
          updated_at?: string
          why_include?: string | null
          year_launched?: number | null
        }
        Update: {
          additional_links?: string | null
          ai_native_explanation?: string | null
          authorized?: boolean
          category?: string | null
          contact_email?: string | null
          contact_name?: string | null
          country_region?: string | null
          created_at?: string
          creator_studio_name?: string
          entity_name?: string
          follower_count?: string | null
          id?: string
          internal_notes?: string | null
          logo_url?: string | null
          main_platform_link?: string | null
          newsletter_opt_in?: boolean
          official_image_url?: string | null
          reviewer_id?: string | null
          short_bio?: string | null
          status?: string
          understands_no_guarantee?: boolean
          updated_at?: string
          why_include?: string | null
          year_launched?: number | null
        }
        Relationships: []
      }
      aipf_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string | null
          entity_id: string | null
          id: string
          interest_submission_id: string | null
          invitation_code: string
          member_number: string | null
          member_type: string | null
          notes: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email?: string | null
          entity_id?: string | null
          id?: string
          interest_submission_id?: string | null
          invitation_code: string
          member_number?: string | null
          member_type?: string | null
          notes?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string | null
          entity_id?: string | null
          id?: string
          interest_submission_id?: string | null
          invitation_code?: string
          member_number?: string | null
          member_type?: string | null
          notes?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "aipf_invitations_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "aipf_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aipf_invitations_interest_submission_id_fkey"
            columns: ["interest_submission_id"]
            isOneToOne: false
            referencedRelation: "aipf_interest_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      aipf_journal_posts: {
        Row: {
          content: string | null
          created_at: string
          excerpt: string | null
          id: string
          post_type: string | null
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          post_type?: string | null
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          post_type?: string | null
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      aipf_nominations: {
        Row: {
          category: string | null
          country_region: string | null
          created_at: string
          creator_studio_name: string | null
          good_faith: boolean
          id: string
          internal_notes: string | null
          nominated_by_email: string | null
          nominated_by_name: string | null
          nominee_entity_name: string
          optional_notes: string | null
          reviewer_id: string | null
          social_links: string | null
          status: string
          supporting_links: string | null
          updated_at: string
          why_considered: string | null
        }
        Insert: {
          category?: string | null
          country_region?: string | null
          created_at?: string
          creator_studio_name?: string | null
          good_faith?: boolean
          id?: string
          internal_notes?: string | null
          nominated_by_email?: string | null
          nominated_by_name?: string | null
          nominee_entity_name: string
          optional_notes?: string | null
          reviewer_id?: string | null
          social_links?: string | null
          status?: string
          supporting_links?: string | null
          updated_at?: string
          why_considered?: string | null
        }
        Update: {
          category?: string | null
          country_region?: string | null
          created_at?: string
          creator_studio_name?: string | null
          good_faith?: boolean
          id?: string
          internal_notes?: string | null
          nominated_by_email?: string | null
          nominated_by_name?: string | null
          nominee_entity_name?: string
          optional_notes?: string | null
          reviewer_id?: string | null
          social_links?: string | null
          status?: string
          supporting_links?: string | null
          updated_at?: string
          why_considered?: string | null
        }
        Relationships: []
      }
      aipf_profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      aipf_user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["aipf_app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["aipf_app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["aipf_app_role"]
          user_id?: string
        }
        Relationships: []
      }
      release_tracks: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          release_id: string
          thumbnail_url: string | null
          title: string
          track_number: number
          video_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          release_id: string
          thumbnail_url?: string | null
          title: string
          track_number: number
          video_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          release_id?: string
          thumbnail_url?: string | null
          title?: string
          track_number?: number
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "release_tracks_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
        ]
      }
      releases: {
        Row: {
          created_at: string
          description: string | null
          hyperfollow_url: string | null
          id: string
          playlist_id: string | null
          release_date: string | null
          sort_date: string | null
          sort_order: number | null
          thumbnail_url: string | null
          title: string
          track_count: number | null
          updated_at: string
          video_id: string | null
          year: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          hyperfollow_url?: string | null
          id?: string
          playlist_id?: string | null
          release_date?: string | null
          sort_date?: string | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title: string
          track_count?: number | null
          updated_at?: string
          video_id?: string | null
          year?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          hyperfollow_url?: string | null
          id?: string
          playlist_id?: string | null
          release_date?: string | null
          sort_date?: string | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string
          track_count?: number | null
          updated_at?: string
          video_id?: string | null
          year?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          ai_enhanced_text: string | null
          ai_title: string | null
          category: string | null
          created_at: string
          featured: boolean | null
          id: string
          location: string | null
          media_type: string | null
          media_url: string | null
          original_text: string | null
          permalink: string | null
          posted_at: string | null
          threads_post_id: string
        }
        Insert: {
          ai_enhanced_text?: string | null
          ai_title?: string | null
          category?: string | null
          created_at?: string
          featured?: boolean | null
          id?: string
          location?: string | null
          media_type?: string | null
          media_url?: string | null
          original_text?: string | null
          permalink?: string | null
          posted_at?: string | null
          threads_post_id: string
        }
        Update: {
          ai_enhanced_text?: string | null
          ai_title?: string | null
          category?: string | null
          created_at?: string
          featured?: boolean | null
          id?: string
          location?: string | null
          media_type?: string | null
          media_url?: string | null
          original_text?: string | null
          permalink?: string | null
          posted_at?: string | null
          threads_post_id?: string
        }
        Relationships: []
      }
      streaming_links: {
        Row: {
          created_at: string
          id: string
          platform: string
          release_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          release_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          release_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "streaming_links_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_hash: string | null
          locale: string | null
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_hash?: string | null
          locale?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_hash?: string | null
          locale?: string | null
          source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      aipf_has_role: {
        Args: {
          _role: Database["public"]["Enums"]["aipf_app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      aipf_is_admin_or_reviewer: { Args: never; Returns: boolean }
    }
    Enums: {
      aipf_app_role: "admin" | "reviewer" | "member"
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
      aipf_app_role: ["admin", "reviewer", "member"],
    },
  },
} as const

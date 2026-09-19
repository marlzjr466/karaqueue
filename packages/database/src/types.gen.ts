/**
 * Hand-written to match supabase/migrations/*.sql as of Phase 1.
 *
 * Once a live Supabase project exists, replace this file with the real
 * generated types:
 *
 *   pnpm supabase gen types typescript --local > packages/database/src/types.gen.ts
 *
 * Keep this file in sync with migrations until then.
 */

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          slug: string;
          max_queue_items: number;
          max_playlists: number | null;
          price_monthly: number;
          currency: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          max_queue_items: number;
          max_playlists?: number | null;
          price_monthly?: number;
          currency?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          max_queue_items?: number;
          max_playlists?: number | null;
          price_monthly?: number;
          currency?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          provider: string;
          provider_customer_id: string | null;
          provider_subscription_id: string | null;
          status: "active" | "trialing" | "past_due" | "canceled" | "expired";
          current_period_start: string;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id: string;
          provider?: string;
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          status?: "active" | "trialing" | "past_due" | "canceled" | "expired";
          current_period_start?: string;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          provider?: string;
          provider_customer_id?: string | null;
          provider_subscription_id?: string | null;
          status?: "active" | "trialing" | "past_due" | "canceled" | "expired";
          current_period_start?: string;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      youtube_videos: {
        Row: {
          id: string;
          youtube_id: string;
          title: string;
          channel_title: string;
          thumbnail_url: string;
          duration_seconds: number | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          youtube_id: string;
          title: string;
          channel_title: string;
          thumbnail_url: string;
          duration_seconds?: number | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          youtube_id?: string;
          title?: string;
          channel_title?: string;
          thumbnail_url?: string;
          duration_seconds?: number | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      queue_items: {
        Row: {
          id: string;
          user_id: string;
          youtube_video_id: string;
          position: number;
          status: "queued" | "playing" | "paused" | "completed" | "skipped";
          added_at: string;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          youtube_video_id: string;
          position: number;
          status?: "queued" | "playing" | "paused" | "completed" | "skipped";
          added_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          youtube_video_id?: string;
          position?: number;
          status?: "queued" | "playing" | "paused" | "completed" | "skipped";
          added_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "queue_items_youtube_video_id_fkey";
            columns: ["youtube_video_id"];
            isOneToOne: false;
            referencedRelation: "youtube_videos";
            referencedColumns: ["id"];
          }
        ];
      };
      playlists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          cover_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          cover_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          cover_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      playlist_items: {
        Row: {
          id: string;
          playlist_id: string;
          youtube_video_id: string;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          playlist_id: string;
          youtube_video_id: string;
          position: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          playlist_id?: string;
          youtube_video_id?: string;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "playlist_items_playlist_id_fkey";
            columns: ["playlist_id"];
            isOneToOne: false;
            referencedRelation: "playlists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "playlist_items_youtube_video_id_fkey";
            columns: ["youtube_video_id"];
            isOneToOne: false;
            referencedRelation: "youtube_videos";
            referencedColumns: ["id"];
          }
        ];
      };
      webhook_events: {
        Row: {
          id: string;
          provider: string;
          type: string;
          created_at: string;
        };
        Insert: {
          id: string;
          provider?: string;
          type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          provider?: string;
          type?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      user_entitlements: {
        Row: {
          user_id: string;
          plan_slug: string;
          plan_name: string;
          max_queue_items: number;
          max_playlists: number | null;
          status: string;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
        };
        Relationships: [];
      };
      playlist_summaries: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          cover_url: string | null;
          created_at: string;
          updated_at: string;
          song_count: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      add_queue_item: {
        Args: { p_youtube_video_id: string };
        Returns: {
          id: string;
          user_id: string;
          youtube_video_id: string;
          position: number;
          status: "queued" | "playing" | "paused" | "completed" | "skipped";
          added_at: string;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      remove_queue_item: {
        Args: { p_queue_item_id: string };
        Returns: undefined;
      };
      reorder_queue: {
        Args: { p_ordered_ids: string[] };
        Returns: undefined;
      };
      clear_queue: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      play_next_queue_item: {
        Args: { p_finish_queue_item_id?: string | null; p_finish_status?: string };
        Returns: string | null;
      };
      create_playlist: {
        Args: { p_name: string; p_description?: string | null };
        Returns: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          cover_url: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      rename_playlist: {
        Args: { p_playlist_id: string; p_name: string };
        Returns: undefined;
      };
      delete_playlist: {
        Args: { p_playlist_id: string };
        Returns: undefined;
      };
      add_playlist_item: {
        Args: { p_playlist_id: string; p_youtube_video_id: string };
        Returns: {
          id: string;
          playlist_id: string;
          youtube_video_id: string;
          position: number;
          created_at: string;
          updated_at: string;
        };
      };
      remove_playlist_item: {
        Args: { p_playlist_item_id: string };
        Returns: undefined;
      };
      reorder_playlist_items: {
        Args: { p_playlist_id: string; p_ordered_ids: string[] };
        Returns: undefined;
      };
      load_playlist_into_queue: {
        Args: { p_playlist_id: string; p_mode: string };
        Returns: { added_count: number; skipped_count: number }[];
      };
    };
    Enums: Record<string, never>;
  };
}

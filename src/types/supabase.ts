export interface VoiceProfile {
  tone_descriptors: string[]
  vocabulary_level: 'academic' | 'conversational' | 'mixed'
  sentence_rhythm: 'short/punchy' | 'long/flowing' | 'varied'
  characteristic_phrases: string[]
  avoids: string[]
  example_voice_sentence: string
}

export interface Database {
  public: {
    Tables: {
      authors: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          book_title: string | null
          book_description: string | null
          genre: string | null
          sub_genre: string | null
          target_reader: string | null
          purchase_url: string | null
          author_bio: string | null
          tone_preference: string
          launch_date: string | null
          voice_profile: VoiceProfile | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          book_title?: string | null
          book_description?: string | null
          genre?: string | null
          sub_genre?: string | null
          target_reader?: string | null
          purchase_url?: string | null
          author_bio?: string | null
          tone_preference?: string
          launch_date?: string | null
          voice_profile?: VoiceProfile | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          book_title?: string | null
          book_description?: string | null
          genre?: string | null
          sub_genre?: string | null
          target_reader?: string | null
          purchase_url?: string | null
          author_bio?: string | null
          tone_preference?: string
          launch_date?: string | null
          voice_profile?: VoiceProfile | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      book_chunks: {
        Row: {
          id: string
          author_id: string
          content: string
          embedding: number[] | null
          chunk_index: number | null
          created_at: string
        }
        Insert: {
          id?: string
          author_id: string
          content: string
          embedding?: number[] | null
          chunk_index?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          content?: string
          embedding?: number[] | null
          chunk_index?: number | null
          created_at?: string
        }
        Relationships: []
      }
      social_connections: {
        Row: {
          id: string
          author_id: string
          platform: 'instagram' | 'twitter' | 'linkedin' | 'youtube'
          platform_user_id: string | null
          platform_username: string | null
          access_token_secret: string | null
          is_active: boolean
          connected_at: string
        }
        Insert: {
          id?: string
          author_id: string
          platform: 'instagram' | 'twitter' | 'linkedin' | 'youtube'
          platform_user_id?: string | null
          platform_username?: string | null
          access_token_secret?: string | null
          is_active?: boolean
          connected_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          platform?: 'instagram' | 'twitter' | 'linkedin' | 'youtube'
          platform_user_id?: string | null
          platform_username?: string | null
          access_token_secret?: string | null
          is_active?: boolean
          connected_at?: string
        }
        Relationships: []
      }
      content_items: {
        Row: {
          id: string
          author_id: string
          platform: 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'newsletter'
          content_text: string
          status: 'draft' | 'pending' | 'approved' | 'rejected' | 'posted'
          scheduled_at: string | null
          posted_at: string | null
          buffer_post_id: string | null
          created_by_agent: string
          metadata: Record<string, unknown> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          platform: 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'newsletter'
          content_text: string
          status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'posted'
          scheduled_at?: string | null
          posted_at?: string | null
          buffer_post_id?: string | null
          created_by_agent?: string
          metadata?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          platform?: 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'newsletter'
          content_text?: string
          status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'posted'
          scheduled_at?: string | null
          posted_at?: string | null
          buffer_post_id?: string | null
          created_by_agent?: string
          metadata?: Record<string, unknown> | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_runs: {
        Row: {
          id: string
          author_id: string
          agent_name: string
          triggered_at: string
          completed_at: string | null
          status: 'running' | 'completed' | 'failed'
          output_summary: string | null
          items_created: number
        }
        Insert: {
          id?: string
          author_id: string
          agent_name: string
          triggered_at?: string
          completed_at?: string | null
          status?: 'running' | 'completed' | 'failed'
          output_summary?: string | null
          items_created?: number
        }
        Update: {
          id?: string
          author_id?: string
          agent_name?: string
          triggered_at?: string
          completed_at?: string | null
          status?: 'running' | 'completed' | 'failed'
          output_summary?: string | null
          items_created?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          author_id: string
          razorpay_customer_id: string | null
          razorpay_subscription_id: string | null
          plan: 'trial' | 'solo' | 'pro' | 'agency'
          status: string
          trial_ends_at: string | null
          current_period_end: string | null
          created_at: string
        }
        Insert: {
          id?: string
          author_id: string
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          plan?: 'trial' | 'solo' | 'pro' | 'agency'
          status?: string
          trial_ends_at?: string | null
          current_period_end?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          razorpay_customer_id?: string | null
          razorpay_subscription_id?: string | null
          plan?: 'trial' | 'solo' | 'pro' | 'agency'
          status?: string
          trial_ends_at?: string | null
          current_period_end?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      match_book_chunks: {
        Args: {
          query_embedding: number[]
          match_count: number
          author_id_filter: string
        }
        Returns: { content: string; similarity: number }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      campaign_tracking: {
        Row: {
          avg_deal_value: number | null
          campaign_id: string
          campaign_name: string
          channel: string
          conversion_rate: number | null
          created_at: string | null
          end_date: string | null
          id: string
          platform_campaign_id: string | null
          start_date: string | null
          status: string | null
          total_deals: number | null
          total_lost_deals: number | null
          total_value: number | null
          total_won_deals: number | null
          total_won_value: number | null
          updated_at: string | null
        }
        Insert: {
          avg_deal_value?: number | null
          campaign_id: string
          campaign_name: string
          channel: string
          conversion_rate?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          platform_campaign_id?: string | null
          start_date?: string | null
          status?: string | null
          total_deals?: number | null
          total_lost_deals?: number | null
          total_value?: number | null
          total_won_deals?: number | null
          total_won_value?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_deal_value?: number | null
          campaign_id?: string
          campaign_name?: string
          channel?: string
          conversion_rate?: number | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          platform_campaign_id?: string | null
          start_date?: string | null
          status?: string | null
          total_deals?: number | null
          total_lost_deals?: number | null
          total_value?: number | null
          total_won_deals?: number | null
          total_won_value?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      chat_conversations: {
        Row: {
          content_type: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          platform: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          platform?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          platform?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_folders: {
        Row: {
          color: string | null
          content_count: number | null
          created_at: string | null
          description: string | null
          folder_type: string
          icon: string | null
          id: string
          name: string
          order_index: number | null
          parent_id: string | null
          platform_name: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          content_count?: number | null
          created_at?: string | null
          description?: string | null
          folder_type?: string
          icon?: string | null
          id?: string
          name: string
          order_index?: number | null
          parent_id?: string | null
          platform_name?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          content_count?: number | null
          created_at?: string | null
          description?: string | null
          folder_type?: string
          icon?: string | null
          id?: string
          name?: string
          order_index?: number | null
          parent_id?: string | null
          platform_name?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "content_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "content_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      content_scripts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          platform: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          platform?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          platform?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      facebook_ads: {
        Row: {
          ad_name: string
          clicks: number | null
          conversion_rate: number | null
          conversion_values: number | null
          conversions: number | null
          cost_per_conversion: number | null
          cost_per_inline_link_click: number | null
          cost_per_unique_click: number | null
          cpc: number | null
          cpm: number | null
          cpp: number | null
          created_at: string | null
          creative_body: string | null
          creative_image_url: string | null
          creative_title: string | null
          creative_type: string | null
          creative_video_url: string | null
          ctr: number | null
          date: string
          fb_ad_id: string
          fb_adset_id: string
          fb_campaign_id: string
          frequency: number | null
          id: string
          impressions: number | null
          inline_link_click_ctr: number | null
          inline_link_clicks: number | null
          page_engagement: number | null
          post_comments: number | null
          post_engagement: number | null
          post_reactions: number | null
          post_shares: number | null
          reach: number | null
          social_spend: number | null
          spend: number | null
          status: string
          synced_at: string | null
          unique_clicks: number | null
          unique_ctr: number | null
          updated_at: string | null
          video_avg_time_watched: number | null
          video_p100_watched: number | null
          video_p25_watched: number | null
          video_p50_watched: number | null
          video_p75_watched: number | null
          video_views: number | null
        }
        Insert: {
          ad_name: string
          clicks?: number | null
          conversion_rate?: number | null
          conversion_values?: number | null
          conversions?: number | null
          cost_per_conversion?: number | null
          cost_per_inline_link_click?: number | null
          cost_per_unique_click?: number | null
          cpc?: number | null
          cpm?: number | null
          cpp?: number | null
          created_at?: string | null
          creative_body?: string | null
          creative_image_url?: string | null
          creative_title?: string | null
          creative_type?: string | null
          creative_video_url?: string | null
          ctr?: number | null
          date?: string
          fb_ad_id: string
          fb_adset_id: string
          fb_campaign_id: string
          frequency?: number | null
          id?: string
          impressions?: number | null
          inline_link_click_ctr?: number | null
          inline_link_clicks?: number | null
          page_engagement?: number | null
          post_comments?: number | null
          post_engagement?: number | null
          post_reactions?: number | null
          post_shares?: number | null
          reach?: number | null
          social_spend?: number | null
          spend?: number | null
          status: string
          synced_at?: string | null
          unique_clicks?: number | null
          unique_ctr?: number | null
          updated_at?: string | null
          video_avg_time_watched?: number | null
          video_p100_watched?: number | null
          video_p25_watched?: number | null
          video_p50_watched?: number | null
          video_p75_watched?: number | null
          video_views?: number | null
        }
        Update: {
          ad_name?: string
          clicks?: number | null
          conversion_rate?: number | null
          conversion_values?: number | null
          conversions?: number | null
          cost_per_conversion?: number | null
          cost_per_inline_link_click?: number | null
          cost_per_unique_click?: number | null
          cpc?: number | null
          cpm?: number | null
          cpp?: number | null
          created_at?: string | null
          creative_body?: string | null
          creative_image_url?: string | null
          creative_title?: string | null
          creative_type?: string | null
          creative_video_url?: string | null
          ctr?: number | null
          date?: string
          fb_ad_id?: string
          fb_adset_id?: string
          fb_campaign_id?: string
          frequency?: number | null
          id?: string
          impressions?: number | null
          inline_link_click_ctr?: number | null
          inline_link_clicks?: number | null
          page_engagement?: number | null
          post_comments?: number | null
          post_engagement?: number | null
          post_reactions?: number | null
          post_shares?: number | null
          reach?: number | null
          social_spend?: number | null
          spend?: number | null
          status?: string
          synced_at?: string | null
          unique_clicks?: number | null
          unique_ctr?: number | null
          updated_at?: string | null
          video_avg_time_watched?: number | null
          video_p100_watched?: number | null
          video_p25_watched?: number | null
          video_p50_watched?: number | null
          video_p75_watched?: number | null
          video_views?: number | null
        }
        Relationships: []
      }
      facebook_adsets: {
        Row: {
          adset_name: string
          clicks: number | null
          cpc: number | null
          created_at: string | null
          ctr: number | null
          date_start: string
          date_stop: string
          fb_adset_id: string
          fb_campaign_id: string
          id: string
          impressions: number | null
          spend: number | null
          status: string
          synced_at: string | null
          targeting: Json | null
          updated_at: string | null
        }
        Insert: {
          adset_name: string
          clicks?: number | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          date_start: string
          date_stop: string
          fb_adset_id: string
          fb_campaign_id: string
          id?: string
          impressions?: number | null
          spend?: number | null
          status: string
          synced_at?: string | null
          targeting?: Json | null
          updated_at?: string | null
        }
        Update: {
          adset_name?: string
          clicks?: number | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          date_start?: string
          date_stop?: string
          fb_adset_id?: string
          fb_campaign_id?: string
          id?: string
          impressions?: number | null
          spend?: number | null
          status?: string
          synced_at?: string | null
          targeting?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      facebook_campaigns: {
        Row: {
          campaign_name: string
          clicks: number | null
          cpc: number | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          date_start: string
          date_stop: string
          fb_account_id: string
          fb_campaign_id: string
          frequency: number | null
          id: string
          impressions: number | null
          objective: string | null
          reach: number | null
          spend: number | null
          status: string
          synced_at: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          campaign_name: string
          clicks?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          date_start: string
          date_stop: string
          fb_account_id: string
          fb_campaign_id: string
          frequency?: number | null
          id?: string
          impressions?: number | null
          objective?: string | null
          reach?: number | null
          spend?: number | null
          status: string
          synced_at?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          campaign_name?: string
          clicks?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          date_start?: string
          date_stop?: string
          fb_account_id?: string
          fb_campaign_id?: string
          frequency?: number | null
          id?: string
          impressions?: number | null
          objective?: string | null
          reach?: number | null
          spend?: number | null
          status?: string
          synced_at?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      folder_contents: {
        Row: {
          added_at: string | null
          content_id: string
          content_type: string
          folder_id: string
          id: string
          user_id: string | null
        }
        Insert: {
          added_at?: string | null
          content_id: string
          content_type: string
          folder_id: string
          id?: string
          user_id?: string | null
        }
        Update: {
          added_at?: string | null
          content_id?: string
          content_type?: string
          folder_id?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "folder_contents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "content_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_posts: {
        Row: {
          ai_image_analysis: Json | null
          ai_video_transcription: Json | null
          analyzed_at: string | null
          caption: string | null
          carousel_images: string[] | null
          comments_count: number | null
          created_at: string | null
          display_url: string | null
          engagement_rate: number | null
          hashtags: string[] | null
          id: string
          is_pinned: boolean | null
          is_sponsored: boolean | null
          likes_count: number | null
          location: string | null
          mentions: string[] | null
          music_info: Json | null
          post_type: string | null
          posts_last_synced_at: string | null
          profile_id: string | null
          saves_count: number | null
          shares_count: number | null
          short_code: string | null
          thumbnail_url: string | null
          timestamp: string | null
          updated_at: string | null
          url: string | null
          user_id: string | null
          video_play_count: number | null
          video_url: string | null
          video_view_count: number | null
        }
        Insert: {
          ai_image_analysis?: Json | null
          ai_video_transcription?: Json | null
          analyzed_at?: string | null
          caption?: string | null
          carousel_images?: string[] | null
          comments_count?: number | null
          created_at?: string | null
          display_url?: string | null
          engagement_rate?: number | null
          hashtags?: string[] | null
          id?: string
          is_pinned?: boolean | null
          is_sponsored?: boolean | null
          likes_count?: number | null
          location?: string | null
          mentions?: string[] | null
          music_info?: Json | null
          post_type?: string | null
          posts_last_synced_at?: string | null
          profile_id?: string | null
          saves_count?: number | null
          shares_count?: number | null
          short_code?: string | null
          thumbnail_url?: string | null
          timestamp?: string | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
          video_play_count?: number | null
          video_url?: string | null
          video_view_count?: number | null
        }
        Update: {
          ai_image_analysis?: Json | null
          ai_video_transcription?: Json | null
          analyzed_at?: string | null
          caption?: string | null
          carousel_images?: string[] | null
          comments_count?: number | null
          created_at?: string | null
          display_url?: string | null
          engagement_rate?: number | null
          hashtags?: string[] | null
          id?: string
          is_pinned?: boolean | null
          is_sponsored?: boolean | null
          likes_count?: number | null
          location?: string | null
          mentions?: string[] | null
          music_info?: Json | null
          post_type?: string | null
          posts_last_synced_at?: string | null
          profile_id?: string | null
          saves_count?: number | null
          shares_count?: number | null
          short_code?: string | null
          thumbnail_url?: string | null
          timestamp?: string | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
          video_play_count?: number | null
          video_url?: string | null
          video_view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "instagram_posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "instagram_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_profiles: {
        Row: {
          bio: string | null
          category: string | null
          created_at: string | null
          display_name: string | null
          follower_count: number | null
          following_count: number | null
          id: string
          is_verified: boolean | null
          last_analyzed_at: string | null
          notes: string | null
          post_count: number | null
          posts_last_synced_at: string | null
          profile_picture_url: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
          username: string
        }
        Insert: {
          bio?: string | null
          category?: string | null
          created_at?: string | null
          display_name?: string | null
          follower_count?: number | null
          following_count?: number | null
          id?: string
          is_verified?: boolean | null
          last_analyzed_at?: string | null
          notes?: string | null
          post_count?: number | null
          posts_last_synced_at?: string | null
          profile_picture_url?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          username: string
        }
        Update: {
          bio?: string | null
          category?: string | null
          created_at?: string | null
          display_name?: string | null
          follower_count?: number | null
          following_count?: number | null
          id?: string
          is_verified?: boolean | null
          last_analyzed_at?: string | null
          notes?: string | null
          post_count?: number | null
          posts_last_synced_at?: string | null
          profile_picture_url?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          username?: string
        }
        Relationships: []
      }
      marketing_metrics: {
        Row: {
          campaign_id: string | null
          channel: string
          clicks: number | null
          conversion_rate: number | null
          cost: number | null
          cpl: number | null
          cpm: number | null
          created_at: string | null
          ctr: number | null
          date: string
          deals_won: number | null
          id: string
          impressions: number | null
          leads: number | null
          meetings_completed: number | null
          meetings_scheduled: number | null
          revenue: number | null
          roas: number | null
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          channel: string
          clicks?: number | null
          conversion_rate?: number | null
          cost?: number | null
          cpl?: number | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          date: string
          deals_won?: number | null
          id?: string
          impressions?: number | null
          leads?: number | null
          meetings_completed?: number | null
          meetings_scheduled?: number | null
          revenue?: number | null
          roas?: number | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          channel?: string
          clicks?: number | null
          conversion_rate?: number | null
          cost?: number | null
          cpl?: number | null
          cpm?: number | null
          created_at?: string | null
          ctr?: number | null
          date?: string
          deals_won?: number | null
          id?: string
          impressions?: number | null
          leads?: number | null
          meetings_completed?: number | null
          meetings_scheduled?: number | null
          revenue?: number | null
          roas?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pipedrive_activities: {
        Row: {
          created_at: string | null
          deal_id: number | null
          deal_title: string | null
          done: boolean | null
          done_time: string | null
          due_date: string | null
          due_time: string | null
          duration: string | null
          id: string
          marked_as_done_time: string | null
          note: string | null
          person_name: string | null
          pipedrive_id: number
          subject: string | null
          synced_at: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          deal_id?: number | null
          deal_title?: string | null
          done?: boolean | null
          done_time?: string | null
          due_date?: string | null
          due_time?: string | null
          duration?: string | null
          id?: string
          marked_as_done_time?: string | null
          note?: string | null
          person_name?: string | null
          pipedrive_id: number
          subject?: string | null
          synced_at?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          deal_id?: number | null
          deal_title?: string | null
          done?: boolean | null
          done_time?: string | null
          due_date?: string | null
          due_time?: string | null
          duration?: string | null
          id?: string
          marked_as_done_time?: string | null
          note?: string | null
          person_name?: string | null
          pipedrive_id?: number
          subject?: string | null
          synced_at?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pipedrive_deals: {
        Row: {
          ad_id: string | null
          add_time: string | null
          campaign_id: string | null
          channel: string | null
          close_time: string | null
          conversion_path: Json | null
          created_at: string | null
          currency: string | null
          days_to_close: number | null
          id: string
          lost_time: string | null
          organization_name: string | null
          person_email: string | null
          person_name: string | null
          person_phone: string | null
          pipedrive_id: number
          reuniao_qualificada: string | null
          stage_id: number | null
          stage_name: string | null
          status: string
          synced_at: string | null
          title: string
          update_time: string | null
          updated_at: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          value: number | null
          won_time: string | null
        }
        Insert: {
          ad_id?: string | null
          add_time?: string | null
          campaign_id?: string | null
          channel?: string | null
          close_time?: string | null
          conversion_path?: Json | null
          created_at?: string | null
          currency?: string | null
          days_to_close?: number | null
          id?: string
          lost_time?: string | null
          organization_name?: string | null
          person_email?: string | null
          person_name?: string | null
          person_phone?: string | null
          pipedrive_id: number
          reuniao_qualificada?: string | null
          stage_id?: number | null
          stage_name?: string | null
          status: string
          synced_at?: string | null
          title: string
          update_time?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          value?: number | null
          won_time?: string | null
        }
        Update: {
          ad_id?: string | null
          add_time?: string | null
          campaign_id?: string | null
          channel?: string | null
          close_time?: string | null
          conversion_path?: Json | null
          created_at?: string | null
          currency?: string | null
          days_to_close?: number | null
          id?: string
          lost_time?: string | null
          organization_name?: string | null
          person_email?: string | null
          person_name?: string | null
          person_phone?: string | null
          pipedrive_id?: number
          reuniao_qualificada?: string | null
          stage_id?: number | null
          stage_name?: string | null
          status?: string
          synced_at?: string | null
          title?: string
          update_time?: string | null
          updated_at?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          value?: number | null
          won_time?: string | null
        }
        Relationships: []
      }
      profile_analysis_history: {
        Row: {
          analysis_data: Json | null
          analyzed_at: string | null
          engagement_rate: number | null
          id: string
          insights: string | null
          profile_id: string | null
          sentiment_score: number | null
          user_id: string | null
        }
        Insert: {
          analysis_data?: Json | null
          analyzed_at?: string | null
          engagement_rate?: number | null
          id?: string
          insights?: string | null
          profile_id?: string | null
          sentiment_score?: number | null
          user_id?: string | null
        }
        Update: {
          analysis_data?: Json | null
          analyzed_at?: string | null
          engagement_rate?: number | null
          id?: string
          insights?: string | null
          profile_id?: string | null
          sentiment_score?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_analysis_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "instagram_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_content_base: {
        Row: {
          analysis_date: string | null
          analysis_summary: Json | null
          content: Json | null
          content_type: string | null
          created_at: string | null
          id: string
          post_count: number | null
          posts_analyzed_count: number | null
          profile_id: string | null
          profile_username: string | null
          title: string | null
          total_engagement: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          analysis_date?: string | null
          analysis_summary?: Json | null
          content?: Json | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          post_count?: number | null
          posts_analyzed_count?: number | null
          profile_id?: string | null
          profile_username?: string | null
          title?: string | null
          total_engagement?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_date?: string | null
          analysis_summary?: Json | null
          content?: Json | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          post_count?: number | null
          posts_analyzed_count?: number | null
          profile_id?: string | null
          profile_username?: string | null
          title?: string | null
          total_engagement?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_content_base_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "instagram_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_templates: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          prompt_key: string
          prompt_name: string
          prompt_value: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          prompt_key: string
          prompt_name: string
          prompt_value: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          prompt_key?: string
          prompt_name?: string
          prompt_value?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      swipe_files: {
        Row: {
          channel: string
          created_at: string
          extra_fields: Json | null
          file_url: string | null
          format: string
          how_to_apply: string | null
          id: string
          rating: number | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          why_saved: string | null
        }
        Insert: {
          channel: string
          created_at?: string
          extra_fields?: Json | null
          file_url?: string | null
          format: string
          how_to_apply?: string | null
          id?: string
          rating?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          why_saved?: string | null
        }
        Update: {
          channel?: string
          created_at?: string
          extra_fields?: Json | null
          file_url?: string | null
          format?: string
          how_to_apply?: string | null
          id?: string
          rating?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          why_saved?: string | null
        }
        Relationships: []
      }
      test_backlog: {
        Row: {
          budget: number | null
          campaign: string | null
          channel: string
          column_order: number | null
          control_description: string | null
          created_at: string
          end_date: string | null
          hypothesis: string
          id: string
          learning: string | null
          name: string
          numeric_goal: string | null
          primary_metric: string
          priority: string
          result_data: string | null
          result_winner: string | null
          start_date: string | null
          status: string
          test_type: string
          updated_at: string
          user_id: string
          variable_tested: string
          variation_description: string | null
        }
        Insert: {
          budget?: number | null
          campaign?: string | null
          channel: string
          column_order?: number | null
          control_description?: string | null
          created_at?: string
          end_date?: string | null
          hypothesis: string
          id?: string
          learning?: string | null
          name: string
          numeric_goal?: string | null
          primary_metric: string
          priority?: string
          result_data?: string | null
          result_winner?: string | null
          start_date?: string | null
          status?: string
          test_type: string
          updated_at?: string
          user_id: string
          variable_tested: string
          variation_description?: string | null
        }
        Update: {
          budget?: number | null
          campaign?: string | null
          channel?: string
          column_order?: number | null
          control_description?: string | null
          created_at?: string
          end_date?: string | null
          hypothesis?: string
          id?: string
          learning?: string | null
          name?: string
          numeric_goal?: string | null
          primary_metric?: string
          priority?: string
          result_data?: string | null
          result_winner?: string | null
          start_date?: string | null
          status?: string
          test_type?: string
          updated_at?: string
          user_id?: string
          variable_tested?: string
          variation_description?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          encrypted_value: string | null
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          encrypted_value?: string | null
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          encrypted_value?: string | null
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      youtube_videos: {
        Row: {
          ai_analysis: Json | null
          analyzed_at: string | null
          channel_name: string | null
          created_at: string | null
          duration: string | null
          id: string
          language: string | null
          notes: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string | null
          transcript: string | null
          updated_at: string | null
          url: string
          user_id: string | null
          video_id: string | null
          view_count: number | null
        }
        Insert: {
          ai_analysis?: Json | null
          analyzed_at?: string | null
          channel_name?: string | null
          created_at?: string | null
          duration?: string | null
          id?: string
          language?: string | null
          notes?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          transcript?: string | null
          updated_at?: string | null
          url: string
          user_id?: string | null
          video_id?: string | null
          view_count?: number | null
        }
        Update: {
          ai_analysis?: Json | null
          analyzed_at?: string | null
          channel_name?: string | null
          created_at?: string | null
          duration?: string | null
          id?: string
          language?: string | null
          notes?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string | null
          transcript?: string | null
          updated_at?: string | null
          url?: string
          user_id?: string | null
          video_id?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_conversation_with_message: {
        Args: {
          p_content_type?: string
          p_message?: string
          p_metadata?: Json
          p_platform?: string
          p_title?: string
        }
        Returns: string
      }
      get_decrypted_setting: {
        Args: { p_key: string; p_user_id: string }
        Returns: string
      }
      is_trusted_server_call: { Args: never; Returns: boolean }
      list_encrypted_settings: {
        Args: { p_user_id: string }
        Returns: {
          key: string
          masked_value: string
          updated_at: string
        }[]
      }
      store_encrypted_setting: {
        Args: { p_key: string; p_user_id: string; p_value: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

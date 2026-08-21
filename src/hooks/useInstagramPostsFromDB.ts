import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InstagramPost {
  id: string;
  shortCode: string;
  type: string;
  caption: string;
  url: string;
  displayUrl: string;
  videoUrl: string | null;
  likesCount: number;
  commentsCount: number;
  videoViewCount: number;
  videoPlayCount: number;
  timestamp: string;
  hashtags: string[];
  mentions: string[];
  aiImageAnalysis?: {
    description: string;
    colors: string[];
    style: string;
    elements: string[];
    emotion: string;
    composition: string;
    quality: string;
    suggestions: string[];
  };
  aiVideoTranscription?: string;
  analyzedAt?: string;
}

export const useInstagramPostsFromDB = (username: string | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["instagram-posts-db", username],
    queryFn: async () => {
      if (!username) return { posts: [], lastSyncedAt: null };

      // Buscar profile pelo username
      const { data: profile, error: profileError } = await supabase
        .from('instagram_profiles')
        .select('id, posts_last_synced_at')
        .eq('username', username)
        .single();

      if (profileError || !profile) {
        console.error('Erro ao buscar perfil:', profileError);
        return { posts: [], lastSyncedAt: null };
      }

      // Buscar posts do perfil
      const { data: postsData, error: postsError } = await supabase
        .from('instagram_posts')
        .select('*')
        .eq('profile_id', profile.id)
        .order('timestamp', { ascending: false });

      if (postsError) {
        console.error('Erro ao buscar posts:', postsError);
        return { posts: [], lastSyncedAt: profile.posts_last_synced_at };
      }

      // Mapear posts para formato esperado
      const posts: InstagramPost[] = (postsData || []).map((post: any) => ({
        id: post.id,
        shortCode: post.short_code,
        type: post.post_type,
        caption: post.caption || '',
        url: post.url,
        displayUrl: post.display_url,
        videoUrl: post.video_url,
        likesCount: post.likes_count || 0,
        commentsCount: post.comments_count || 0,
        videoViewCount: post.video_view_count || 0,
        videoPlayCount: post.video_play_count || 0,
        timestamp: post.timestamp,
        hashtags: post.hashtags || [],
        mentions: post.mentions || [],
        aiImageAnalysis: post.ai_image_analysis,
        aiVideoTranscription: post.ai_video_transcription,
        analyzedAt: post.analyzed_at,
      }));

      return {
        posts,
        lastSyncedAt: profile.posts_last_synced_at,
      };
    },
    enabled: enabled && !!username,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

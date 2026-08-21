import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProfileContentBase {
  id: string;
  profile_id: string;
  analysis_date: string;
  posts_analyzed_count: number;
  total_engagement: number;
  analysis_summary: {
    best_posts?: Array<{
      post_id: string;
      reason: string;
      engagement_rate: number;
      key_factors: string[];
    }>;
    content_themes?: string[];
    visual_patterns?: string[];
    engagement_insights?: string;
    posting_patterns?: string;
    content_recommendations?: string[];
    tone_and_style?: string;
    key_success_factors?: string[];
  };
  created_at: string;
  updated_at: string;
}

export const useProfileContentBase = (profileId: string | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['profile-content-base', profileId],
    queryFn: async () => {
      if (!profileId) return null;

      const { data, error } = await supabase
        .from('profile_content_base')
        .select('*')
        .eq('profile_id', profileId)
        .order('analysis_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        throw error;
      }

      return data as ProfileContentBase | null;
    },
    enabled: enabled && !!profileId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

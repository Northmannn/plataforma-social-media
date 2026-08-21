import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
}

export const useInstagramPosts = (username: string | null, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["instagram-posts", username],
    queryFn: async () => {
      if (!username) return { posts: [] };

      const { data, error } = await supabase.functions.invoke('instagram-posts-scraper', {
        body: { username, limit: 30 },
      });

      if (error) {
        console.error('Erro ao buscar posts:', error);
        toast.error("Erro ao buscar posts do Instagram");
        throw error;
      }

      return data as { posts: InstagramPost[] };
    },
    enabled: enabled && !!username,
  });
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useSocialStats = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const { data: totalProfiles = 0 } = useQuery({
    queryKey: ["social-stats-profiles"],
    queryFn: async () => {
      const { count } = await supabase
        .from("instagram_profiles")
        .select("*", { count: "exact", head: true });
      return count || 0;
    },
  });

  const { data: recentAnalysis = 0 } = useQuery({
    queryKey: ["social-stats-analysis"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count } = await supabase
        .from("profile_analysis_history")
        .select("*", { count: "exact", head: true })
        .gte("analyzed_at", sevenDaysAgo.toISOString());
      return count || 0;
    },
  });

  const { data: recentScripts = 0 } = useQuery({
    queryKey: ["social-stats-scripts", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count } = await supabase
        .from("content_scripts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", sevenDaysAgo.toISOString());
      return count || 0;
    },
    enabled: !!userId,
  });

  const { data: recentProfiles = [] } = useQuery({
    queryKey: ["social-recent-profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("instagram_profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const { data: recentCreations = [] } = useQuery({
    queryKey: ["social-recent-creations", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from("content_scripts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!userId,
  });

  return {
    totalProfiles,
    recentAnalysis,
    recentScripts,
    recentProfiles,
    recentCreations,
  };
};

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useUnfiledScripts = () => {
  const { session } = useAuth();
  const userId = session?.user?.id;

  return useQuery({
    queryKey: ["unfiled-scripts", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data: scripts, error: scriptsError } = await supabase
        .from("content_scripts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (scriptsError) throw scriptsError;
      if (!scripts || scripts.length === 0) return [];

      const { data: filedLinks, error: linksError } = await supabase
        .from("folder_contents")
        .select("content_id")
        .eq("content_type", "content_script")
        .eq("user_id", userId);

      if (linksError) throw linksError;

      const filedIds = new Set(filedLinks?.map(l => l.content_id) || []);
      return scripts.filter(s => !filedIds.has(s.id));
    },
    enabled: !!userId,
  });
};

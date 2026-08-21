import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useSyncInstagramPosts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      const { data, error } = await supabase.functions.invoke('instagram-posts-scraper', {
        body: { username, limit: 30, saveToDatabase: true },
      });

      if (error) {
        console.error('Erro ao sincronizar posts:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data, username) => {
      // Invalidar query do banco para recarregar posts
      queryClient.invalidateQueries({ queryKey: ["instagram-posts-db", username] });
      queryClient.invalidateQueries({ queryKey: ["instagram-profiles"] });
      
      const total = data.savedCount + data.updatedCount;
      if (total > 0) {
        toast.success(`${total} posts sincronizados com sucesso!`);
      } else {
        toast.info("Nenhum post novo encontrado");
      }
    },
    onError: (error) => {
      console.error('Erro na sincronização:', error);
      toast.error("Erro ao sincronizar posts. Tente novamente.");
    },
  });
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invokeFunction } from "@/lib/supabase-functions";
import { toast } from "sonner";

export const useSyncInstagramPosts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      return invokeFunction<{ savedCount: number; updatedCount: number }>(
        'instagram-posts-scraper',
        { username, limit: 30, saveToDatabase: true }
      );
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
    onError: (error: Error) => {
      console.error('Erro na sincronização:', error);
      toast.error(error.message || "Erro ao sincronizar posts. Tente novamente.");
    },
  });
};

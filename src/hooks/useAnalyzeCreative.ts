import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useAnalyzeCreative = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, imageUrl }: { postId: string; imageUrl: string }) => {
      const { data, error } = await supabase.functions.invoke('analyze-creative', {
        body: { postId, imageUrl },
      });

      if (error) {
        console.error('Erro ao analisar criativo:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data, variables) => {
      toast.success('Análise de imagem concluída!');
      queryClient.invalidateQueries({ queryKey: ['instagram-posts-db'] });
    },
    onError: (error: any) => {
      console.error('Erro ao analisar criativo:', error);
      
      if (error.message?.includes('Rate limit')) {
        toast.error('Limite de requisições excedido. Tente novamente em alguns minutos.');
      } else if (error.message?.includes('Créditos insuficientes')) {
        toast.error('Créditos insuficientes. Adicione créditos no workspace do Lovable.');
      } else {
        toast.error('Erro ao analisar imagem. Tente novamente.');
      }
    },
  });
};

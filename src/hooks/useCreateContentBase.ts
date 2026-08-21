import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useCreateContentBase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (username: string) => {
      const { data, error } = await supabase.functions.invoke('analyze-profile-content', {
        body: { username },
      });

      if (error) {
        console.error('Erro ao criar base de conteúdo:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data;
    },
    onSuccess: (data, username) => {
      toast.success('Base de conteúdo criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['profile-content-base'] });
      queryClient.invalidateQueries({ queryKey: ['instagram-profiles'] });
    },
    onError: (error: any) => {
      console.error('Erro ao criar base de conteúdo:', error);
      
      if (error.message?.includes('Rate limit') || error.message?.includes('Limite de requisições')) {
        toast.error('Limite de requisições excedido. Tente novamente em alguns minutos.');
      } else if (error.message?.includes('Créditos insuficientes') || error.message?.includes('402')) {
        toast.error('Créditos insuficientes. Adicione créditos no workspace do Lovable.');
      } else {
        toast.error('Erro ao criar base de conteúdo. Tente novamente.');
      }
    },
  });
};

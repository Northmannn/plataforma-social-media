import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GenerateContentParams {
  profileId: string;
  contentType: 'video' | 'post' | 'idea';
  prompt: string;
  platform: string;
}

interface GeneratedContent {
  title: string;
  content: string;
  metadata: {
    generated_with_ai: boolean;
    profile_username: string;
    content_type: string;
    platform: string;
    original_prompt: string;
    posts_analyzed: number;
    analysis_date: string;
  };
}

export const useGenerateContent = () => {
  return useMutation({
    mutationFn: async (params: GenerateContentParams) => {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: params,
      });

      if (error) {
        console.error('Erro ao gerar conteúdo:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data as GeneratedContent;
    },
    onSuccess: () => {
      toast.success('Conteúdo gerado com sucesso!');
    },
    onError: (error: any) => {
      console.error('Erro ao gerar conteúdo:', error);
      
      if (error.message?.includes('Rate limit') || error.message?.includes('Limite de requisições')) {
        toast.error('Limite de requisições excedido. Tente novamente em alguns minutos.');
      } else if (error.message?.includes('Créditos insuficientes') || error.message?.includes('402')) {
        toast.error('Créditos insuficientes. Adicione créditos no workspace do Lovable.');
      } else if (error.message?.includes('Nenhuma base de conhecimento')) {
        toast.error('Analise o perfil primeiro para gerar conteúdo baseado na base de conhecimento.');
      } else {
        toast.error('Erro ao gerar conteúdo. Tente novamente.');
      }
    },
  });
};

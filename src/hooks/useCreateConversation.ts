import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateConversationParams {
  title: string;
  firstMessage: string;
  profileId?: string | null;
  contentType?: 'video' | 'post' | 'idea';
}

export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, firstMessage, profileId, contentType }: CreateConversationParams) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Preparar metadata
      const metadata: any = {};
      if (profileId) metadata.profile_id = profileId;
      if (contentType) metadata.content_type = contentType;

      // Chamar função helper do banco
      const { data, error } = await supabase.rpc('create_conversation_with_message', {
        p_title: title,
        p_content: firstMessage,
        p_metadata: metadata
      });

      if (error) throw error;

      return data as string; // Retorna o conversation_id
    },
    onSuccess: () => {
      // Invalidar cache para recarregar conversas
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    },
    onError: (error) => {
      console.error('Erro ao criar conversa:', error);
      toast.error('Erro ao criar conversa. Tente novamente.');
    }
  });
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface KnowledgeSourceRef {
  type: string;
  id: string;
}

interface SendMessageParams {
  conversationId: string;
  content: string;
  knowledgeSources?: KnowledgeSourceRef[];
  contentType?: 'video' | 'post' | 'idea';
  skipUserMessage?: boolean; // Skip inserting user message (already inserted by create_conversation_with_message)
}

export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conversationId, content, knowledgeSources, contentType, skipUserMessage }: SendMessageParams) => {
      // 1. Inserir mensagem do usuário (skip se já foi inserida pelo RPC)
      if (!skipUserMessage) {
        const { error: userMsgError } = await supabase
          .from('chat_messages')
          .insert({
            conversation_id: conversationId,
            role: 'user',
            content: content,
          });

        if (userMsgError) throw userMsgError;
      }

      // Invalidate immediately so user message shows up in the chat
      queryClient.invalidateQueries({ queryKey: ['chat-messages', conversationId] });

      // 2. Chamar edge function para gerar resposta da IA
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('chat-generate-content', {
        body: {
          conversationId,
          userMessage: content,
          knowledgeSources: knowledgeSources || [],
          contentType
        }
      });

      if (aiError) throw aiError;

      // 3. Inserir resposta da IA
      const messageContent = aiResponse.is_deliverable 
        ? aiResponse.content
        : (aiResponse.chat_message || aiResponse.content);

      const { error: aiMsgError } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          role: 'assistant',
          content: messageContent,
          metadata: {
            model: aiResponse.model,
            tokens_used: aiResponse.tokens_used,
            generation_time_ms: aiResponse.generation_time_ms,
            raw_content: aiResponse.raw_content || null,
            is_deliverable: aiResponse.is_deliverable || false,
            chat_message: aiResponse.chat_message || null,
            deliverable_content: aiResponse.deliverable_content || null,
          }
        });

      if (aiMsgError) throw aiMsgError;

      return aiResponse;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
    },
    onError: (error: any) => {
      console.error('Erro ao enviar mensagem:', error);
      
      if (error.message?.includes('429')) {
        toast.error('Limite de requisições atingido. Aguarde um momento.');
      } else if (error.message?.includes('402')) {
        toast.error('Créditos insuficientes. Adicione créditos em Settings → Usage.');
      } else {
        toast.error('Erro ao gerar resposta. Tente novamente.');
      }
    }
  });
};
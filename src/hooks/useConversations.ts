import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useConversations = () => {
  return useQuery({
    queryKey: ['chat-conversations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Buscar conversas do usuário
      const { data: conversations, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Para cada conversa, buscar a última mensagem e contar mensagens
      const conversationsWithMetadata = await Promise.all(
        (conversations || []).map(async (conv) => {
          // Última mensagem
          const { data: lastMsg } = await supabase
            .from('chat_messages')
            .select('content')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Contador de mensagens
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);

          return {
            id: conv.id,
            title: conv.title,
            lastMessage: lastMsg?.content || '',
            timestamp: conv.updated_at,
            messageCount: count || 0,
            metadata: conv.metadata
          };
        })
      );

      return conversationsWithMetadata;
    },
  });
};

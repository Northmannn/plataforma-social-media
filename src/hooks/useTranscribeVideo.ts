import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTranscribeVideo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, videoUrl }: { postId: string; videoUrl: string }) => {
      const { data, error } = await supabase.functions.invoke('transcribe-video', {
        body: { postId, videoUrl },
      });

      if (error) {
        console.error('Erro ao transcrever vídeo:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data, variables) => {
      toast.success('Transcrição de vídeo concluída!');
      queryClient.invalidateQueries({ queryKey: ['instagram-posts-db'] });
    },
    onError: (error: any) => {
      console.error('Erro ao transcrever vídeo:', error);
      toast.error('Erro ao transcrever vídeo. Tente novamente.');
    },
  });
};

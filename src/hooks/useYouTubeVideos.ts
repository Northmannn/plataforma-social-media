import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface YouTubeVideo {
  id: string;
  url: string;
  video_id: string;
  title: string | null;
  channel_name: string | null;
  transcript: string | null;
  language: string;
  duration: string | null;
  ai_analysis: any | null;
  analyzed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useYouTubeVideos = () => {
  const queryClient = useQueryClient();

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["youtube-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("youtube_videos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as YouTubeVideo[];
    },
  });

  // Analisar vídeo com IA (defined first so addVideo can reference it)
  const analyzeVideo = useMutation({
    mutationFn: async (videoId: string) => {
      const toastId = toast.loading("Analisando vídeo com IA...");
      try {
        const { data, error } = await supabase.functions.invoke(
          'analyze-youtube-transcript',
          { body: { videoId } }
        );
        if (error) throw error;
        toast.success("Análise concluída com sucesso!", { id: toastId });
        return data;
      } catch (error: any) {
        if (error.message?.includes('Rate limit') || error.message?.includes('Limite de requisições')) {
          toast.error('Limite de requisições excedido. Tente novamente em alguns minutos.', { id: toastId });
        } else if (error.message?.includes('Créditos insuficientes') || error.message?.includes('402')) {
          toast.error('Créditos insuficientes. Adicione créditos no workspace.', { id: toastId });
        } else {
          toast.error(error.message || "Erro ao analisar vídeo", { id: toastId });
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["youtube-videos"] });
    },
  });

  // Adicionar novo vídeo e disparar análise automaticamente
  const addVideo = useMutation({
    mutationFn: async (videoUrl: string) => {
      const toastId = toast.loading("Extraindo transcrição do vídeo...");
      try {
        const { data, error } = await supabase.functions.invoke(
          'youtube-transcript-scraper',
          { body: { videoUrl } }
        );
        if (error) throw error;
        toast.success("Transcrição extraída com sucesso!", { id: toastId });
        return data;
      } catch (error) {
        toast.error("Erro ao extrair transcrição", { id: toastId });
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["youtube-videos"] });
      // Auto-trigger AI analysis if transcript is available
      const videoId = data?.data?.id;
      const transcript = data?.data?.transcript;
      if (videoId && transcript && transcript.trim().length > 0) {
        analyzeVideo.mutate(videoId);
      }
    },
    onError: (error: any) => {
      console.error("Erro ao adicionar vídeo:", error);
    },
  });

  // Deletar vídeo
  const deleteVideo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("youtube_videos")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["youtube-videos"] });
      toast.success("Vídeo removido!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover vídeo");
    },
  });

  return {
    videos,
    isLoading,
    addVideo,
    deleteVideo,
    analyzeVideo,
  };
};

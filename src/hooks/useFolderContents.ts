import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface FolderContent {
  id: string;
  folder_id: string;
  content_type: 'youtube_video' | 'instagram_profile' | 'profile_content_base' | 'instagram_post' | 'content_script';
  content_id: string;
  added_at: string;
  user_id?: string;
  content_data?: any;
}

export const useFolderContents = (folderId: string | null) => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const { data: subfolders = [] } = useQuery({
    queryKey: ["subfolders", folderId, userId],
    queryFn: async () => {
      if (!folderId || !userId) return [];
      
      const { data, error } = await supabase
        .from("content_folders")
        .select("*")
        .eq("parent_id", folderId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!folderId && !!userId,
  });

  const { data: contents = [], isLoading } = useQuery({
    queryKey: ["folder-contents", folderId, userId],
    queryFn: async () => {
      if (!folderId || !userId) return [];

      const { data: folderContents, error } = await supabase
        .from("folder_contents")
        .select("*")
        .eq("folder_id", folderId)
        .eq("user_id", userId)
        .order("added_at", { ascending: false });

      if (error) throw error;
      if (!folderContents || folderContents.length === 0) return [];

      const enrichedContents = await Promise.all(
        folderContents.map(async (fc) => {
          let contentData = null;

          switch (fc.content_type) {
            case "youtube_video":
              const { data: video } = await supabase
                .from("youtube_videos")
                .select("*")
                .eq("id", fc.content_id)
                .single();
              contentData = video;
              break;

            case "instagram_profile":
              const { data: profile } = await supabase
                .from("instagram_profiles")
                .select("*")
                .eq("id", fc.content_id)
                .single();
              contentData = profile;
              break;

            case "profile_content_base":
              const { data: base } = await supabase
                .from("profile_content_base")
                .select("*")
                .eq("id", fc.content_id)
                .single();
              contentData = base;
              break;

            case "instagram_post":
              const { data: post } = await supabase
                .from("instagram_posts")
                .select("*")
                .eq("id", fc.content_id)
                .single();
              contentData = post;
              break;

            case "content_script":
              const { data: script } = await supabase
                .from("content_scripts")
                .select("*")
                .eq("id", fc.content_id)
                .single();
              contentData = script;
              break;
          }

          return {
            ...fc,
            content_data: contentData,
          };
        })
      );

      return enrichedContents;
    },
    enabled: !!folderId && !!userId,
  });

  const addContent = useMutation({
    mutationFn: async ({ folderId, contentType, contentId }: {
      folderId: string;
      contentType: FolderContent['content_type'];
      contentId: string;
    }) => {
      if (!userId) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase
        .from("folder_contents")
        .insert([{ folder_id: folderId, content_type: contentType, content_id: contentId, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folder-contents"] });
      toast.success("Conteúdo adicionado à pasta!");
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error("Conteúdo já está nesta pasta");
      } else {
        toast.error(error.message || "Erro ao adicionar conteúdo");
      }
    },
  });

  const removeContent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("folder_contents")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folder-contents"] });
      toast.success("Conteúdo removido da pasta!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover conteúdo");
    },
  });

  return {
    contents,
    subfolders,
    isLoading,
    addContent,
    removeContent,
  };
};

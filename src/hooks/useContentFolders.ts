import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface ContentFolder {
  id: string;
  name: string;
  color: string;
  icon: string;
  parent_id: string | null;
  folder_type: 'platform' | 'custom';
  platform_name: string | null;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
  user_id?: string;
  content_count?: number;
}

export const useContentFolders = (parentId: string | null = null) => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const { data: folders = [], isLoading } = useQuery({
    queryKey: ["content-folders", parentId, userId],
    queryFn: async () => {
      if (!userId) return [];
      let query = supabase
        .from("content_folders")
        .select(`
          *,
          folder_contents(count)
        `)
        .eq("user_id", userId)
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: false });

      if (parentId === null) {
        query = query.is("parent_id", null);
      } else {
        query = query.eq("parent_id", parentId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(folder => ({
        ...folder,
        content_count: folder.folder_contents?.[0]?.count || 0
      })) as ContentFolder[];
    },
    enabled: !!userId,
  });

  const createFolder = useMutation({
    mutationFn: async (folder: Omit<ContentFolder, 'id' | 'created_at' | 'updated_at' | 'content_count' | 'user_id'>) => {
      if (!userId) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase
        .from("content_folders")
        .insert([{ ...folder, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-folders"] });
      toast.success("Pasta criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar pasta");
    },
  });

  const updateFolder = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContentFolder> & { id: string }) => {
      const { data, error } = await supabase
        .from("content_folders")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-folders"] });
      toast.success("Pasta atualizada!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar pasta");
    },
  });

  const deleteFolder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("content_folders")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-folders"] });
      toast.success("Pasta removida!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover pasta");
    },
  });

  return {
    folders,
    isLoading,
    createFolder,
    updateFolder,
    deleteFolder,
  };
};

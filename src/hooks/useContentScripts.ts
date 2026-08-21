import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface ContentScript {
  id: string;
  title: string;
  type: string;
  content: string;
  platform: string | null;
  metadata: any;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

export const useContentScripts = (type?: string) => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const { data: scripts = [], isLoading } = useQuery({
    queryKey: ["content-scripts", type, userId],
    queryFn: async () => {
      if (!userId) return [];
      let query = supabase
        .from("content_scripts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (type) {
        query = query.eq("type", type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ContentScript[];
    },
    enabled: !!userId,
  });

  const addScript = useMutation({
    mutationFn: async (script: Omit<ContentScript, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      if (!userId) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase
        .from("content_scripts")
        .insert([{ ...script, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-scripts"] });
      toast.success("Roteiro salvo com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar roteiro");
    },
  });

  const updateScript = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContentScript> & { id: string }) => {
      const { data, error } = await supabase
        .from("content_scripts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-scripts"] });
      toast.success("Roteiro atualizado!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar roteiro");
    },
  });

  const deleteScript = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("content_scripts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-scripts"] });
      toast.success("Roteiro removido!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover roteiro");
    },
  });

  const duplicateScript = useMutation({
    mutationFn: async (script: ContentScript) => {
      if (!userId) throw new Error("Usuário não autenticado");
      const { id, created_at, updated_at, user_id, ...scriptData } = script;
      const { data, error } = await supabase
        .from("content_scripts")
        .insert([{ ...scriptData, title: `${scriptData.title} (cópia)`, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-scripts"] });
      toast.success("Roteiro duplicado!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao duplicar roteiro");
    },
  });

  return {
    scripts,
    isLoading,
    addScript,
    updateScript,
    deleteScript,
    duplicateScript,
  };
};

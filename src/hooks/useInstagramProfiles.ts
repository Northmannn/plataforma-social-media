import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface InstagramProfile {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  follower_count: number | null;
  following_count: number | null;
  post_count: number | null;
  profile_picture_url: string | null;
  is_verified: boolean | null;
  category: string | null;
  notes: string | null;
  tags: string[] | null;
  last_analyzed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useInstagramProfiles = () => {
  const queryClient = useQueryClient();

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["instagram-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("instagram_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as InstagramProfile[];
    },
  });

  const addProfile = useMutation({
    mutationFn: async (profile: Omit<InstagramProfile, 'id' | 'created_at' | 'updated_at' | 'last_analyzed_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("instagram_profiles")
        .insert([{ ...profile, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram-profiles"] });
      toast.success("Perfil adicionado com sucesso!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao adicionar perfil");
    },
  });

  const updateProfile = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InstagramProfile> & { id: string }) => {
      const { data, error } = await supabase
        .from("instagram_profiles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram-profiles"] });
      toast.success("Perfil atualizado!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar perfil");
    },
  });

  const deleteProfile = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("instagram_profiles")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["instagram-profiles"] });
      toast.success("Perfil removido!");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover perfil");
    },
  });

  return {
    profiles,
    isLoading,
    addProfile,
    updateProfile,
    deleteProfile,
  };
};

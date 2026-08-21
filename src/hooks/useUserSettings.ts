import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserSetting {
  key: string;
  configured: boolean;
  masked_value: string;
  updated_at: string;
}

export const useUserSettings = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["user-settings"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return [];

      const response = await supabase.functions.invoke("manage-settings", {
        method: "GET",
      });

      if (response.error) throw response.error;
      return (response.data?.settings || []) as UserSetting[];
    },
  });

  const saveSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const response = await supabase.functions.invoke("manage-settings", {
        body: { key, value },
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
      toast.success("Configuração salva com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + (error instanceof Error ? error.message : "Erro desconhecido"));
    },
  });

  const deleteSetting = useMutation({
    mutationFn: async (key: string) => {
      const response = await supabase.functions.invoke("manage-settings", {
        body: { key, action: 'delete' },
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
      toast.success("Configuração removida!");
    },
  });

  const isConfigured = (key: string) => settings?.some(s => s.key === key) || false;
  const getMaskedValue = (key: string) => settings?.find(s => s.key === key)?.masked_value || "";

  return { settings, isLoading, saveSetting, deleteSetting, isConfigured, getMaskedValue };
};

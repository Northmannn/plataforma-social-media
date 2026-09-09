import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { invokeFunction } from "@/lib/supabase-functions";

export interface InstagramSearchResult {
  username: string;
  display_name: string | null;
  profile_picture_url: string | null;
  is_verified: boolean;
  follower_count: number | null;
  is_private: boolean | null;
}

export const useInstagramSearch = () => {
  const search = useMutation({
    mutationFn: async (query: string) => {
      const data = await invokeFunction<{ results: InstagramSearchResult[] }>(
        "instagram-search-scraper",
        { query, limit: 10 }
      );
      return data?.results ?? [];
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao buscar perfis no Instagram");
    },
  });

  return {
    search,
    results: search.data ?? [],
    isSearching: search.isPending,
    hasSearched: search.isSuccess,
    searchError: search.isError ? search.error.message : null,
    reset: search.reset,
  };
};

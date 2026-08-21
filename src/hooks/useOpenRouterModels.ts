import { useQuery } from "@tanstack/react-query";

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  pricing: {
    prompt: string;
    completion: string;
  };
}

interface APIModel {
  id: string;
  name: string;
  description?: string;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
  architecture?: {
    modality?: string;
  };
}

async function fetchModels(): Promise<OpenRouterModel[]> {
  const res = await fetch("https://openrouter.ai/api/v1/models");
  if (!res.ok) throw new Error("Failed to fetch OpenRouter models");
  const data = await res.json();
  return (data.data as APIModel[])
    .filter((m) => {
      const modality = m.architecture?.modality;
      return !modality || modality.includes("text");
    })
    .map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      pricing: {
        prompt: m.pricing?.prompt ?? "0",
        completion: m.pricing?.completion ?? "0",
      },
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function useOpenRouterModels() {
  return useQuery({
    queryKey: ["openrouter-models"],
    queryFn: fetchModels,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 2,
    retry: 2,
  });
}

export function formatPrice(pricePerToken: string): string {
  const price = parseFloat(pricePerToken) * 1_000_000;
  if (price === 0) return "Grátis";
  if (price < 0.01) return `<$0.01/1M`;
  return `$${price.toFixed(2)}/1M`;
}

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty, CommandGroup } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Search, Loader2, ChevronsUpDown } from "lucide-react";
import { useOpenRouterModels, formatPrice } from "@/hooks/useOpenRouterModels";
import { Input } from "@/components/ui/input";

interface Props {
  value: string;
  onSelect: (modelId: string) => void;
}

export const OpenRouterModelSearch = ({ value, onSelect }: Props) => {
  const [open, setOpen] = useState(false);
  const [fallbackValue, setFallbackValue] = useState(value);
  const { data: models, isLoading, isError } = useOpenRouterModels();

  if (isError) {
    return (
      <Input
        placeholder="ex: x-ai/grok-3, cohere/command-a"
        value={fallbackValue}
        onChange={(e) => {
          setFallbackValue(e.target.value);
          onSelect(e.target.value);
        }}
        className="bg-white/[0.05] border-border/30 text-sm font-mono mt-2"
      />
    );
  }

  const selectedModel = models?.find((m) => m.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white/[0.05] border-border/30 text-sm font-normal mt-2 h-auto py-2"
        >
          {selectedModel ? (
            <div className="flex flex-col items-start gap-0.5 text-left">
              <span className="font-medium text-foreground">{selectedModel.name}</span>
              <span className="text-[11px] font-mono text-muted-foreground">{selectedModel.id}</span>
            </div>
          ) : (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Search size={14} />
              Buscar modelos OpenRouter...
            </span>
          )}
          <ChevronsUpDown size={14} className="shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command filter={(value, search) => {
          const model = models?.find((m) => m.id === value);
          if (!model) return 0;
          const haystack = `${model.name} ${model.id}`.toLowerCase();
          return haystack.includes(search.toLowerCase()) ? 1 : 0;
        }}>
          <CommandInput placeholder="Buscar por nome ou ID..." />
          <CommandList className="max-h-[280px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground ml-2">Carregando modelos...</span>
              </div>
            ) : (
              <>
                <CommandEmpty>Nenhum modelo encontrado.</CommandEmpty>
                <CommandGroup>
                  {models?.map((model) => (
                    <CommandItem
                      key={model.id}
                      value={model.id}
                      onSelect={() => {
                        onSelect(model.id);
                        setOpen(false);
                      }}
                      className="flex flex-col items-start gap-0.5 py-2"
                    >
                      <span className="font-medium text-sm">{model.name}</span>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="font-mono">{model.id}</span>
                        <span>•</span>
                        <span>
                          Prompt: {formatPrice(model.pricing.prompt)} | Completion: {formatPrice(model.pricing.completion)}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

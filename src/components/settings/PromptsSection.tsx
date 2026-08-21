import { usePromptTemplates, PROMPT_DEFINITIONS } from "@/hooks/usePromptTemplates";
import { PromptEditor } from "./PromptEditor";
import { Loader2 } from "lucide-react";

const CATEGORIES = ["Análise", "Chat", "Geração", "Formatação", "Criativos", "YouTube"];

export const PromptsSection = () => {
  const { isLoading, savePrompt, deletePrompt, getPromptValue, isCustomized } = usePromptTemplates();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-muted-foreground" size={24} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-medium text-foreground">Prompts IA</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Customize os prompts usados pela IA em cada funcionalidade da plataforma.
        </p>
      </div>

      <div className="space-y-6">
        {CATEGORIES.map((category) => {
          const prompts = PROMPT_DEFINITIONS.filter((p) => p.category === category);
          if (prompts.length === 0) return null;

          return (
            <div key={category}>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {category}
              </h2>
              <div className="space-y-3">
                {prompts.map((def) => (
                  <PromptEditor
                    key={def.key}
                    definition={def}
                    currentValue={getPromptValue(def.key)}
                    isCustomized={isCustomized(def.key)}
                    isSaving={savePrompt.isPending}
                    onSave={(key, value) => savePrompt.mutate({ key, value })}
                    onRestore={(key) => deletePrompt.mutate(key)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-4 rounded-xl border border-border/30 bg-card/50">
        <h3 className="text-xs font-semibold text-muted-foreground mb-2">ℹ️ Sobre os prompts</h3>
        <ul className="text-xs text-muted-foreground/70 space-y-1">
          <li>• Variáveis entre {"{{chaves}}"} são substituídas automaticamente pelos dados reais</li>
          <li>• Restaurar um prompt remove sua customização e volta ao padrão da plataforma</li>
          <li>• Prompts customizados são aplicados em todas as gerações futuras</li>
        </ul>
      </div>
    </div>
  );
};

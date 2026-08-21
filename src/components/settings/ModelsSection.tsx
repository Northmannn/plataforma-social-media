import { useState, useEffect } from "react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { OpenRouterModelSearch } from "@/components/settings/OpenRouterModelSearch";
import { Loader2, Save, RotateCcw, Brain, MessageSquare, FileText, Image, Youtube, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const LOVABLE_MODELS = [
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", desc: "Mais preciso, mais lento" },
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", desc: "Equilibrado" },
  { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", desc: "Mais rápido, mais barato" },
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash", desc: "Nova geração, rápido" },
  { value: "google/gemini-3-pro-preview", label: "Gemini 3 Pro", desc: "Nova geração, preciso" },
  { value: "openai/gpt-5", label: "GPT-5", desc: "Alta precisão" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini", desc: "Equilibrado" },
  { value: "openai/gpt-5-nano", label: "GPT-5 Nano", desc: "Rápido e econômico" },
];

const OPENROUTER_MODELS = [
  { value: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4", desc: "Raciocínio avançado" },
  { value: "anthropic/claude-haiku-4", label: "Claude Haiku 4", desc: "Rápido e eficiente" },
  { value: "meta-llama/llama-4-maverick", label: "Llama 4 Maverick", desc: "Open source, forte" },
  { value: "deepseek/deepseek-r1", label: "DeepSeek R1", desc: "Raciocínio profundo" },
  { value: "mistralai/mistral-large", label: "Mistral Large", desc: "Alta qualidade" },
  { value: "qwen/qwen3-235b-a22b", label: "Qwen 3 235B", desc: "Modelo massivo" },
];

const CUSTOM_MODEL_VALUE = "__custom__";

const ALL_KNOWN_VALUES = [
  ...LOVABLE_MODELS.map(m => m.value),
  ...OPENROUTER_MODELS.map(m => m.value),
];

function isLovableModel(model: string) {
  return model.startsWith("google/") || model.startsWith("openai/");
}

const MODEL_CONFIGS = [
  { id: "profile_analysis", title: "Análise de Perfil", description: "Análise de posts do Instagram e geração da base de conhecimento", icon: Brain, defaultModel: "google/gemini-2.5-pro", defaultTemp: 0.7 },
  { id: "chat_generation", title: "Chat de Criação", description: "Geração de conteúdo via chat interativo", icon: MessageSquare, defaultModel: "google/gemini-2.5-flash", defaultTemp: 0.7 },
  { id: "content_generation", title: "Geração de Conteúdo", description: "Criação de roteiros, legendas e ideias", icon: FileText, defaultModel: "google/gemini-2.5-pro", defaultTemp: 0.8 },
  { id: "creative_analysis", title: "Análise de Criativos", description: "Análise visual de imagens dos posts", icon: Image, defaultModel: "google/gemini-2.5-flash", defaultTemp: 0.5 },
  { id: "youtube_analysis", title: "Análise YouTube", description: "Análise de transcrições de vídeos do YouTube", icon: Youtube, defaultModel: "google/gemini-2.5-flash", defaultTemp: 0.5 },
];

interface ModelCardState {
  model: string;
  customModel: string;
  temperature: number;
  dirty: boolean;
}

export const ModelsSection = () => {
  const { settings, isLoading, isConfigured, saveSetting } = useUserSettings();
  const [states, setStates] = useState<Record<string, ModelCardState>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const hasOpenRouterKey = isConfigured("openrouter_api_key");

  useEffect(() => {
    const initial: Record<string, ModelCardState> = {};
    for (const config of MODEL_CONFIGS) {
      const modelSetting = settings?.find(s => s.key === `model_${config.id}`);
      const tempSetting = settings?.find(s => s.key === `temp_${config.id}`);
      const savedModel = modelSetting?.masked_value || config.defaultModel;
      const isKnown = ALL_KNOWN_VALUES.includes(savedModel);
      initial[config.id] = {
        model: isKnown ? savedModel : CUSTOM_MODEL_VALUE,
        customModel: isKnown ? "" : savedModel,
        temperature: tempSetting ? parseFloat(tempSetting.masked_value) : config.defaultTemp,
        dirty: false,
      };
    }
    setStates(initial);
  }, [settings]);

  const getEffectiveModel = (state: ModelCardState) =>
    state.model === CUSTOM_MODEL_VALUE ? state.customModel : state.model;

  const updateState = (id: string, field: keyof ModelCardState, value: string | number) => {
    setStates(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value, dirty: true },
    }));
  };

  const resetToDefault = (id: string) => {
    const config = MODEL_CONFIGS.find(c => c.id === id)!;
    setStates(prev => ({
      ...prev,
      [id]: { model: config.defaultModel, customModel: "", temperature: config.defaultTemp, dirty: true },
    }));
  };

  const handleSave = async (id: string) => {
    const state = states[id];
    if (!state) return;
    const effectiveModel = getEffectiveModel(state);
    if (!effectiveModel) {
      toast.error("Informe o ID do modelo customizado");
      return;
    }
    setSavingId(id);
    try {
      await saveSetting.mutateAsync({ key: `model_${id}`, value: effectiveModel });
      await saveSetting.mutateAsync({ key: `temp_${id}`, value: String(state.temperature) });
      setStates(prev => ({ ...prev, [id]: { ...prev[id], dirty: false } }));
      toast.success("Configuração salva!");
    } catch {
      toast.error("Erro ao salvar configuração");
    } finally {
      setSavingId(null);
    }
  };

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
        <h1 className="text-xl font-medium text-foreground">Modelos IA</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure o modelo e a temperatura para cada funcionalidade de IA.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {MODEL_CONFIGS.map(config => {
          const state = states[config.id];
          if (!state) return null;
          const Icon = config.icon;
          const effectiveModel = getEffectiveModel(state);
          const isDefault = effectiveModel === config.defaultModel && state.temperature === config.defaultTemp;
          const needsOpenRouter = !isLovableModel(effectiveModel) && effectiveModel.length > 0;

          return (
            <Card key={config.id} className="border-border/50 bg-white/[0.03]">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                      <Icon size={18} className="text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{config.title}</CardTitle>
                      <CardDescription className="text-xs">{config.description}</CardDescription>
                    </div>
                  </div>
                  {!isDefault && (
                    <Button variant="ghost" size="sm" onClick={() => resetToDefault(config.id)} className="text-xs text-muted-foreground">
                      <RotateCcw size={12} className="mr-1" /> Restaurar
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Modelo</Label>
                  <Select value={state.model} onValueChange={v => updateState(config.id, "model", v)}>
                    <SelectTrigger className="bg-white/[0.05] border-border/30">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel className="text-xs text-primary">✨ Inclusos (Lovable AI)</SelectLabel>
                        {LOVABLE_MODELS.map(m => (
                          <SelectItem key={m.value} value={m.value}>
                            <span className="font-medium">{m.label}</span>
                            <span className="text-muted-foreground ml-2 text-xs">— {m.desc}</span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel className="text-xs text-orange-400">🔑 OpenRouter (requer API key)</SelectLabel>
                        {OPENROUTER_MODELS.map(m => (
                          <SelectItem key={m.value} value={m.value}>
                            <span className="font-medium">{m.label}</span>
                            <span className="text-muted-foreground ml-2 text-xs">— {m.desc}</span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      <SelectGroup>
                        <SelectLabel className="text-xs text-muted-foreground">🔍 Buscar</SelectLabel>
                        <SelectItem value={CUSTOM_MODEL_VALUE}>
                          <span className="font-medium">Buscar no OpenRouter...</span>
                          <span className="text-muted-foreground ml-2 text-xs">— Todos os modelos disponíveis</span>
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>

                  {state.model === CUSTOM_MODEL_VALUE && (
                    <OpenRouterModelSearch
                      value={state.customModel}
                      onSelect={(modelId) => updateState(config.id, "customModel", modelId)}
                    />
                  )}

                  {needsOpenRouter && !hasOpenRouterKey && (
                    <div className="flex items-center gap-2 mt-2">
                      <AlertTriangle size={14} className="text-orange-400 shrink-0" />
                      <span className="text-xs text-orange-400">
                        Configure sua API key do OpenRouter em Integrações para usar este modelo.
                      </span>
                    </div>
                  )}

                  {needsOpenRouter && hasOpenRouterKey && (
                    <Badge variant="outline" className="text-xs text-green-400 border-green-400/30 mt-2">
                      Via OpenRouter
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Temperatura (criatividade)</Label>
                    <span className="text-xs font-mono text-foreground">{state.temperature.toFixed(1)}</span>
                  </div>
                  <Slider
                    value={[state.temperature]}
                    onValueChange={([v]) => updateState(config.id, "temperature", Math.round(v * 10) / 10)}
                    min={0}
                    max={1}
                    step={0.1}
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground/50">
                    <span>Preciso</span>
                    <span>Criativo</span>
                  </div>
                </div>

                {state.dirty && (
                  <Button size="sm" onClick={() => handleSave(config.id)} disabled={savingId === config.id} className="w-full">
                    {savingId === config.id ? <Loader2 size={14} className="animate-spin mr-1" /> : <Save size={14} className="mr-1" />}
                    Salvar
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-4 rounded-xl border border-border/30 bg-card/50">
        <h3 className="text-xs font-semibold text-muted-foreground mb-2">ℹ️ Sobre os modelos</h3>
        <ul className="text-xs text-muted-foreground/70 space-y-1">
          <li>• <strong>Modelos inclusos:</strong> Gemini e GPT-5 já estão disponíveis sem custo extra</li>
          <li>• <strong>OpenRouter:</strong> Acesse Claude, Llama, DeepSeek, Mistral e qualquer outro modelo — requer API key</li>
          <li>• <strong>Buscar no OpenRouter:</strong> Pesquise entre centenas de modelos disponíveis com preços em tempo real</li>
          <li>• <strong>Temperatura baixa (0.0-0.3):</strong> Respostas mais focadas e previsíveis</li>
          <li>• <strong>Temperatura alta (0.7-1.0):</strong> Respostas mais criativas e variadas</li>
        </ul>
      </div>
    </div>
  );
};

import { useState } from "react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { Eye, EyeOff, ExternalLink, Loader2, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PromptsSection } from "@/components/settings/PromptsSection";
import { ModelsSection } from "@/components/settings/ModelsSection";

const INTEGRATIONS = [
  {
    key: "apify_api_key",
    title: "Apify",
    description: "Scraping de perfis Instagram, posts e transcrições YouTube",
    helpUrl: "https://console.apify.com/account/integrations",
    placeholder: "apify_api_...",
  },
];

const TABS = [
  { id: "integracoes", label: "Integrações" },
  { id: "prompts", label: "Prompts IA" },
  { id: "modelos", label: "Modelos IA" },
];

const IntegrationRow = ({
  integration,
  isConfigured,
  maskedValue,
  isSaving,
  onSave,
  onDelete,
}: {
  integration: typeof INTEGRATIONS[0];
  isConfigured: boolean;
  maskedValue: string;
  isSaving: boolean;
  onSave: (key: string, value: string) => void;
  onDelete: (key: string) => void;
}) => {
  const [value, setValue] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [showValue, setShowValue] = useState(false);

  const handleSave = () => {
    if (value.trim().length < 10) return;
    onSave(integration.key, value.trim());
    setValue("");
    setShowInput(false);
  };

  return (
    <div className="py-6 border-b border-border/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-2 w-2 rounded-full",
            isConfigured ? "bg-primary" : "bg-muted-foreground/30"
          )} />
          <span className="text-sm font-medium text-foreground">{integration.title}</span>
        </div>
        <a
          href={integration.helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Obter key <ExternalLink size={12} />
        </a>
      </div>
      <p className="text-sm text-muted-foreground mt-1">{integration.description}</p>

      {isConfigured && !showInput ? (
        <div className="flex items-center gap-3 mt-3">
          <span className="text-sm font-mono text-muted-foreground">
            {showValue ? maskedValue : "••••••••••••"}
          </span>
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setShowValue(!showValue)}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showValue ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              onClick={() => setShowInput(true)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              Alterar
            </button>
            <button
              onClick={() => onDelete(integration.key)}
              className="p-1 text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 mt-3">
          <input
            type="password"
            placeholder={integration.placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="flex-1 bg-transparent border-b border-border/30 focus:border-foreground text-sm py-2 outline-none text-foreground placeholder:text-muted-foreground/50 transition-colors"
          />
          <button
            onClick={handleSave}
            disabled={isSaving || value.trim().length < 10}
            className="text-xs text-foreground hover:text-primary disabled:text-muted-foreground/30 transition-colors font-medium"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : "Salvar"}
          </button>
          {showInput && (
            <button
              onClick={() => { setShowInput(false); setValue(""); }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const IntegrationsSection = () => {
  const { isLoading, isConfigured, getMaskedValue, saveSetting, deleteSetting } = useUserSettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-muted-foreground" size={20} />
      </div>
    );
  }

  return (
    <div>
      {INTEGRATIONS.map((integration) => (
        <IntegrationRow
          key={integration.key}
          integration={integration}
          isConfigured={isConfigured(integration.key)}
          maskedValue={getMaskedValue(integration.key)}
          isSaving={saveSetting.isPending}
          onSave={(key, value) => saveSetting.mutate({ key, value })}
          onDelete={(key) => deleteSetting.mutate(key)}
        />
      ))}

      <div className="mt-12 space-y-1">
        <p className="text-xs text-muted-foreground/60">• Suas keys são armazenadas de forma segura e criptografada</p>
        <p className="text-xs text-muted-foreground/60">• A IA da plataforma já está configurada automaticamente</p>
        <p className="text-xs text-muted-foreground/60">• Sem as keys acima, funcionalidades de scraping e transcrição não funcionarão</p>
      </div>
    </div>
  );
};

const SocialConfiguracoes = () => {
  const [activeSection, setActiveSection] = useState("integracoes");

  return (
    <div className="min-h-screen pt-28 px-8 pb-16">
      <div className="max-w-[1100px] mx-auto">
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">Configurações</h1>
        <p className="text-base text-muted-foreground mb-10">
          Gerencie integrações, prompts e modelos
        </p>

        <div className="flex items-center gap-6 mb-10 -mt-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={cn(
                "text-sm cursor-pointer transition-colors duration-200 pb-1",
                activeSection === tab.id
                  ? "text-foreground font-medium border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeSection === "integracoes" && <IntegrationsSection />}
        {activeSection === "prompts" && <PromptsSection />}
        {activeSection === "modelos" && <ModelsSection />}
      </div>
    </div>
  );
};

export default SocialConfiguracoes;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useSocialStats } from "@/hooks/useSocialStats";
import { useUserSettings } from "@/hooks/useUserSettings";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronRight } from "lucide-react";
import { ApiKeyWizard, useApiKeyWizardSeen } from "@/components/onboarding/ApiKeyWizard";
import { OnboardingBanner } from "@/components/onboarding/OnboardingBanner";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
};

const QUICK_ACTIONS = [
  {
    title: "Analisar Perfil",
    description: "Analise perfis de sucesso do Instagram",
    path: "/social/analise",
  },
  {
    title: "Criar Conteúdo",
    description: "Gere roteiros e legendas com IA",
    path: "/social/criacao",
  },
  {
    title: "Bases de Conhecimento",
    description: "Organize seus conteúdos de referência",
    path: "/social/bases",
  },
  {
    title: "Configurações",
    description: "API keys, modelos e prompts",
    path: "/social/configuracoes",
  },
];

const INTEGRATIONS = [
  { key: "apify_api_key", label: "Apify" },
];

const Social = () => {
  const navigate = useNavigate();
  const { totalProfiles, recentAnalysis, recentScripts, recentProfiles, recentCreations } = useSocialStats();
  const { isConfigured, isLoading: settingsLoading } = useUserSettings();
  const wizardSeen = useApiKeyWizardSeen();
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    if (!settingsLoading && !wizardSeen) {
      const hasAnyKey = ['apify_api_key'].some(k => isConfigured(k));
      if (!hasAnyKey) {
        setWizardOpen(true);
      }
    }
  }, [settingsLoading, wizardSeen, isConfigured]);

  const metrics = [
    { value: totalProfiles, label: "Perfis salvos" },
    { value: recentAnalysis, label: "Análises · 7 dias" },
    { value: recentScripts, label: "Roteiros · 7 dias" },
  ];

  const activities = [
    ...recentProfiles.map((p) => ({
      id: p.id,
      type: "profile" as const,
      title: `@${p.username}`,
      subtitle: "Perfil adicionado",
      initial: p.username?.charAt(0).toUpperCase() || "P",
      timestamp: p.created_at,
    })),
    ...recentCreations.map((s) => ({
      id: s.id,
      type: "script" as const,
      title: s.title,
      subtitle: "Roteiro criado",
      initial: s.title?.charAt(0).toUpperCase() || "R",
      timestamp: s.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  return (
    <Layout>
      <ApiKeyWizard isOpen={wizardOpen} onClose={() => setWizardOpen(false)} />
      <div className="min-h-screen pt-28 px-8 pb-16">
        <div className="max-w-[1100px] mx-auto">
          <OnboardingBanner onOpenWizard={() => setWizardOpen(true)} />

          {/* Greeting */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">
              {getGreeting()}
            </h1>
            <p className="text-base text-muted-foreground">
              Seu resumo de conteúdo social
            </p>
          </div>

          {/* KPIs */}
          <div className="flex items-end gap-10 mb-12">
            {metrics.map((m, i) => (
              <div key={m.label} className="flex items-end gap-10">
                <div
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 100}ms`, animationFillMode: "backwards" }}
                >
                  <p className="text-5xl font-bold text-foreground tabular-nums">{m.value}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mt-2">{m.label}</p>
                </div>
                {i < metrics.length - 1 && (
                  <div className="h-10 w-px bg-border/40 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Two-column: Quick Actions + Recent Activity */}
          <div className="grid grid-cols-2 gap-x-12 mb-12">
            <div>
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">
                Ações rápidas
              </h2>
            {QUICK_ACTIONS.map((action, i) => (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className={`group w-full flex items-center justify-between py-4 px-3 -mx-3 rounded-lg text-left transition-colors duration-200 hover:bg-accent/5 ${
                  i < QUICK_ACTIONS.length - 1 ? "border-b border-border/30" : ""
                }`}
              >
                <div>
                  <p className="font-medium text-foreground">{action.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{action.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200" />
              </button>
            ))}
            </div>

            <div>
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">
              Atividade recente
            </h2>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma atividade ainda. Comece analisando um perfil ou criando um roteiro.
              </p>
            ) : (
              <div>
                {activities.map((a, i) => (
                  <div
                    key={a.id}
                    className={`flex items-center gap-3 py-3 ${
                      i < activities.length - 1 ? "border-b border-border/20" : ""
                    }`}
                  >
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-medium text-muted-foreground">{a.initial}</span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{a.title}</span>
                    <span className="text-sm text-muted-foreground">{a.subtitle}</span>
                    <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                      {formatDistanceToNow(new Date(a.timestamp), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>

          {/* Integrations */}
          <div className="flex items-center gap-5">
            {settingsLoading ? (
              <span className="text-xs text-muted-foreground">Carregando...</span>
            ) : (
              INTEGRATIONS.map((i) => {
                const active = isConfigured(i.key);
                return (
                  <button
                    key={i.key}
                    onClick={() => navigate("/social/configuracoes")}
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity duration-200"
                  >
                    <div className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                    <span className="text-sm text-muted-foreground">{i.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Social;

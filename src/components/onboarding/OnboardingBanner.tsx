import React from "react";
import { AlertCircle, ArrowRight, X } from "lucide-react";
import { useUserSettings } from "@/hooks/useUserSettings";

interface OnboardingBannerProps {
  onOpenWizard: () => void;
}

export const OnboardingBanner: React.FC<OnboardingBannerProps> = ({ onOpenWizard }) => {
  const { isConfigured, isLoading } = useUserSettings();

  if (isLoading) return null;
  if (isConfigured("apify_api_key")) return null;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 mb-8">
      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
      <p className="text-sm text-muted-foreground flex-1">
        Configure sua <span className="text-foreground font-medium">API Key do Apify</span> para importar perfis e transcrever vídeos.
      </p>
      <button
        onClick={onOpenWizard}
        className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
      >
        Configurar <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

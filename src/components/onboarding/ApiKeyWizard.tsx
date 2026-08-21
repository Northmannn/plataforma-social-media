import React, { useState } from 'react';
import { X, ExternalLink, Eye, EyeOff, Loader2, KeyRound, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserSettings } from '@/hooks/useUserSettings';

interface ApiKeyWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const WIZARD_SEEN_KEY = 'apikey_wizard_seen';

export const ApiKeyWizard: React.FC<ApiKeyWizardProps> = ({ isOpen, onClose }) => {
  const [value, setValue] = useState('');
  const [showValue, setShowValue] = useState(false);
  const { isConfigured, saveSetting } = useUserSettings();

  const configured = isConfigured('apify_api_key');

  const handleClose = () => {
    localStorage.setItem(WIZARD_SEEN_KEY, 'true');
    onClose();
  };

  const handleSave = () => {
    if (value.trim().length < 10) return;
    saveSetting.mutate({ key: 'apify_api_key', value: value.trim() });
    setValue('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={handleClose} />

        <motion.div
          className="relative w-full max-w-md bg-card border border-border/50 rounded-2xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Configurar Apify</span>
            </div>
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              A API Key do Apify é necessária para importar perfis do Instagram e transcrições de vídeos do YouTube.
            </p>

            {configured ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <Check className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground font-medium">API Key configurada</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type={showValue ? 'text' : 'password'}
                    placeholder="apify_api_..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full bg-muted/50 border border-border/50 focus:border-primary/50 rounded-xl text-sm py-3 px-4 pr-10 outline-none text-foreground placeholder:text-muted-foreground/50 transition-colors"
                  />
                  <button
                    onClick={() => setShowValue(!showValue)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showValue ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <a
                    href="https://console.apify.com/account/integrations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Obter API Key <ExternalLink size={12} />
                  </a>
                  <button
                    onClick={handleSave}
                    disabled={saveSetting.isPending || value.trim().length < 10}
                    className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {saveSetting.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Salvar'}
                  </button>
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground/60">
              Você pode alterar isso a qualquer momento em Configurações.
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end px-6 py-4 border-t border-border/30">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {configured ? 'Fechar' : 'Pular'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export const useApiKeyWizardSeen = () => {
  return localStorage.getItem(WIZARD_SEEN_KEY) === 'true';
};

import { useProfileContentBase } from "@/hooks/useProfileContentBase";
import { useCreateContentBase } from "@/hooks/useCreateContentBase";
import { Sparkles, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProfileContentBaseProps {
  profileId: string;
  username: string;
}

export const ProfileContentBase = ({ profileId, username }: ProfileContentBaseProps) => {
  const { data: contentBase, isLoading, error } = useProfileContentBase(profileId);
  const createContentBase = useCreateContentBase();
  const [fakeProgress, setFakeProgress] = useState(0);

  useEffect(() => {
    if (!createContentBase.isPending) {
      setFakeProgress(0);
      return;
    }
    setFakeProgress(5);
    const interval = setInterval(() => {
      setFakeProgress(prev => {
        if (prev >= 92) return prev;
        return prev + Math.random() * 8;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [createContentBase.isPending]);

  const handleCreateAnalysis = () => {
    createContentBase.mutate(username);
  };

  if (createContentBase.isPending) {
    return (
      <div className="py-16 flex flex-col items-center gap-5">
        <div className="relative">
          <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
          <Sparkles className="h-4 w-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <div className="text-center space-y-1.5">
          <p className="text-sm font-medium text-foreground">Analisando conteúdo</p>
          <p className="text-xs text-muted-foreground">Processando posts e identificando padrões...</p>
        </div>
        <div className="w-64">
          <Progress value={fakeProgress} className="h-1.5" />
        </div>
        <p className="text-[11px] text-muted-foreground/60">Isso pode levar alguns segundos</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-12 justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Carregando...</span>
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-destructive py-8 text-center">
        Erro ao carregar base de conteúdo. Tente novamente.
      </p>
    );
  }

  if (!contentBase) {
    return (
      <div className="py-12 text-center space-y-4">
        <p className="text-sm text-muted-foreground">
          Nenhuma análise criada. Analise os últimos 30 posts para entender padrões de conteúdo e engajamento.
        </p>
        <button
          className="text-sm text-foreground hover:text-primary transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
          onClick={handleCreateAnalysis}
          disabled={createContentBase.isPending}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {createContentBase.isPending ? 'Analisando...' : 'Criar análise'}
        </button>
      </div>
    );
  }

  const summary = contentBase.analysis_summary;

  return (
    <div className="space-y-0">
      {/* Header info */}
      <div className="flex items-center justify-between border-b border-border/20 pb-6 mb-8">
        <span className="text-xs text-muted-foreground">
          {contentBase.posts_analyzed_count} posts analisados · {contentBase.total_engagement.toLocaleString('pt-BR')} engajamentos · Atualizado em {format(new Date(contentBase.analysis_date), "dd/MM", { locale: ptBR })}
        </span>
        <button
          className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
          onClick={handleCreateAnalysis}
          disabled={createContentBase.isPending}
        >
          {createContentBase.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
          {createContentBase.isPending ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      {/* Tom e Estilo */}
      <div className="border-b border-border/20 pb-8 mb-8">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
          Tom e Estilo
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {summary.tone_and_style || 'Análise não disponível'}
        </p>
      </div>

      {/* Fatores de Sucesso */}
      <div className="border-b border-border/20 pb-8 mb-8">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
          Fatores de Sucesso
        </h3>
        <ul className="space-y-1.5">
          {summary.key_success_factors?.map((factor: string, idx: number) => (
            <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
              <span className="text-muted-foreground/40 mt-px">·</span>
              <span>{factor}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Top 5 Posts */}
      <div className="border-b border-border/20 pb-8 mb-8">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">
          Top 5 Posts
        </h3>
        <div className="space-y-4">
          {summary.best_posts?.slice(0, 5).map((post: any, idx: number) => (
            <div key={post.post_id} className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-foreground">{idx + 1}.</span>
                <span className="text-sm text-muted-foreground">{post.reason}</span>
              </div>
              <div className="pl-5 flex items-center gap-2">
                <span className="text-xs text-muted-foreground/60">
                  Taxa: {(post.engagement_rate * 100).toFixed(2)}%
                </span>
                {post.key_factors?.length > 0 && (
                  <span className="text-xs text-muted-foreground/60">
                    · {post.key_factors.join(' · ')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Temas de Conteúdo */}
      <div className="border-b border-border/20 pb-8 mb-8">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
          Temas de Conteúdo
        </h3>
        <div className="flex flex-wrap gap-2">
          {summary.content_themes?.map((theme: string, idx: number) => (
            <span key={idx} className="rounded-full border border-border/30 px-3 py-1 text-xs text-muted-foreground">
              {theme}
            </span>
          ))}
        </div>
      </div>

      {/* Padrões Visuais */}
      <div className="border-b border-border/20 pb-8 mb-8">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
          Padrões Visuais
        </h3>
        <div className="flex flex-wrap gap-2">
          {summary.visual_patterns?.map((pattern: string, idx: number) => (
            <span key={idx} className="rounded-full border border-border/30 px-3 py-1 text-xs text-muted-foreground">
              {pattern}
            </span>
          ))}
        </div>
      </div>

      {/* Insights de Engajamento */}
      <div className="border-b border-border/20 pb-8 mb-8">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
          Insights de Engajamento
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {summary.engagement_insights || 'Análise não disponível'}
        </p>
      </div>

      {/* Padrões de Postagem */}
      <div className="border-b border-border/20 pb-8 mb-8">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
          Padrões de Postagem
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {summary.posting_patterns || 'Análise não disponível'}
        </p>
      </div>

      {/* Recomendações */}
      <div>
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-4">
          Recomendações
        </h3>
        <ol className="space-y-3">
          {summary.content_recommendations?.map((rec: string, idx: number) => (
            <li key={idx} className="flex items-start gap-3 text-sm">
              <span className="text-foreground font-medium flex-shrink-0">{idx + 1}.</span>
              <span className="text-muted-foreground">{rec}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

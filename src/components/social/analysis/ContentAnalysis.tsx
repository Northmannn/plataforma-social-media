import { InstagramPost } from "@/hooks/useInstagramPostsFromDB";
import { useProfileAnalytics } from "@/hooks/useProfileAnalytics";

interface ContentAnalysisProps {
  posts: InstagramPost[];
}

export const ContentAnalysis = ({ posts }: ContentAnalysisProps) => {
  const analytics = useProfileAnalytics(posts, null);

  return (
    <div className="space-y-0">
      {/* Top Hashtags */}
      <div className="border-b border-border/20 pb-6 mb-6">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
          Top Hashtags
        </h3>
        {analytics.topHashtags.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {analytics.topHashtags.slice(0, 10).map((item, i) => (
              <span key={item.hashtag}>
                #{item.hashtag} <span className="text-xs text-muted-foreground/60">({item.count})</span>
                {i < Math.min(analytics.topHashtags.length, 10) - 1 && ' · '}
              </span>
            ))}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/60">Nenhuma hashtag encontrada</p>
        )}
      </div>

      {/* Menções */}
      <div className="border-b border-border/20 pb-6 mb-6">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
          Menções Frequentes
        </h3>
        {analytics.topMentions.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            {analytics.topMentions.slice(0, 8).map((item, i) => (
              <span key={item.mention}>
                @{item.mention} <span className="text-xs text-muted-foreground/60">({item.count})</span>
                {i < Math.min(analytics.topMentions.length, 8) - 1 && ' · '}
              </span>
            ))}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/60">Nenhuma menção encontrada</p>
        )}
      </div>

      {/* Análise de Texto */}
      <div className="border-b border-border/20 pb-6 mb-6">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
          Análise de Texto
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center border-b border-border/10 pb-2">
            <span className="text-sm text-muted-foreground">Comprimento médio de caption</span>
            <span className="text-sm font-medium text-foreground">{analytics.avgCaptionLength} caracteres</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Hashtags por post</span>
            <span className="text-sm font-medium text-foreground">{analytics.avgHashtagsPerPost.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Tipos de Conteúdo */}
      <div>
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
          Tipos de Conteúdo
        </h3>
        <div className="space-y-2">
          {Object.entries(analytics.contentTypeDistribution).map(([type, count], i, arr) => (
            <div
              key={type}
              className={`flex justify-between items-center ${i < arr.length - 1 ? 'border-b border-border/10 pb-2' : ''}`}
            >
              <span className="text-sm text-muted-foreground capitalize">{type}</span>
              <span className="text-sm font-medium text-foreground">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import { InstagramPost } from "@/hooks/useInstagramPostsFromDB";
import { InstagramProfile } from "@/hooks/useInstagramProfiles";
import { useProfileAnalytics } from "@/hooks/useProfileAnalytics";

interface EngagementMetricsProps {
  posts: InstagramPost[];
  profile: InstagramProfile;
}

export const EngagementMetrics = ({ posts, profile }: EngagementMetricsProps) => {
  const analytics = useProfileAnalytics(posts, profile);

  const metrics = [
    {
      label: "ENGAGEMENT RATE",
      value: `${analytics.engagementRate.toFixed(2)}%`,
    },
    {
      label: "ENGAGEMENT MÉDIO",
      value: analytics.avgEngagement.toFixed(0),
    },
    {
      label: "POST MAIS POPULAR",
      value: analytics.topPost?.likesCount?.toLocaleString('pt-BR') || "0",
    },
    {
      label: "MELHOR FORMATO",
      value: analytics.bestPerformingType.type || "N/A",
    },
  ];

  return (
    <div className="flex flex-wrap items-start gap-y-6">
      {metrics.map((metric, index) => (
        <div key={metric.label} className="flex items-start">
          <div className="flex flex-col gap-1 px-1">
            <span className="text-3xl font-bold text-foreground tracking-tight">
              {metric.value}
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              {metric.label}
            </span>
          </div>
          {index < metrics.length - 1 && (
            <div className="h-10 w-px bg-border/40 mx-6 mt-1 hidden sm:block" />
          )}
        </div>
      ))}
    </div>
  );
};

import { EngagementMetrics } from "../EngagementMetrics";
import { PerformanceCharts } from "../PerformanceCharts";
import { ContentAnalysis } from "../ContentAnalysis";

interface OverviewViewProps {
  posts: any[];
  profile: any;
}

export const OverviewView = ({ posts, profile }: OverviewViewProps) => {
  return (
    <div className="space-y-12">
      <EngagementMetrics posts={posts} profile={profile} />
      <PerformanceCharts posts={posts} />
      <ContentAnalysis posts={posts} />
    </div>
  );
};

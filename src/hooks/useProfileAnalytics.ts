import { useMemo } from "react";
import { InstagramPost } from "./useInstagramPosts";
import { InstagramProfile } from "./useInstagramProfiles";

export const useProfileAnalytics = (posts: InstagramPost[], profile: InstagramProfile | null) => {
  return useMemo(() => {
    if (posts.length === 0) {
      return {
        engagementRate: 0,
        avgEngagement: 0,
        topPost: null,
        bestPerformingType: { type: "N/A", avgEngagement: 0 },
        topHashtags: [],
        topMentions: [],
        avgCaptionLength: 0,
        avgHashtagsPerPost: 0,
        contentTypeDistribution: {},
      };
    }

    // Engagement metrics
    const totalEngagement = posts.reduce(
      (sum, post) => sum + post.likesCount + post.commentsCount,
      0
    );
    const avgEngagement = totalEngagement / posts.length;

    const engagementRate = profile?.follower_count
      ? (avgEngagement / profile.follower_count) * 100
      : 0;

    // Top post
    const topPost = posts.reduce((max, post) =>
      post.likesCount > (max?.likesCount || 0) ? post : max
    , posts[0]);

    // Best performing type
    const typeEngagement: Record<string, { total: number; count: number }> = {};
    posts.forEach((post) => {
      const engagement = post.likesCount + post.commentsCount;
      if (!typeEngagement[post.type]) {
        typeEngagement[post.type] = { total: 0, count: 0 };
      }
      typeEngagement[post.type].total += engagement;
      typeEngagement[post.type].count += 1;
    });

    let bestType = { type: "N/A", avgEngagement: 0 };
    Object.entries(typeEngagement).forEach(([type, data]) => {
      const avg = data.total / data.count;
      if (avg > bestType.avgEngagement) {
        bestType = { type, avgEngagement: avg };
      }
    });

    // Hashtag analysis
    const hashtagCount: Record<string, number> = {};
    posts.forEach((post) => {
      post.hashtags.forEach((tag) => {
        hashtagCount[tag] = (hashtagCount[tag] || 0) + 1;
      });
    });
    const topHashtags = Object.entries(hashtagCount)
      .map(([hashtag, count]) => ({ hashtag, count }))
      .sort((a, b) => b.count - a.count);

    // Mentions analysis
    const mentionCount: Record<string, number> = {};
    posts.forEach((post) => {
      post.mentions.forEach((mention) => {
        mentionCount[mention] = (mentionCount[mention] || 0) + 1;
      });
    });
    const topMentions = Object.entries(mentionCount)
      .map(([mention, count]) => ({ mention, count }))
      .sort((a, b) => b.count - a.count);

    // Caption analysis
    const totalCaptionLength = posts.reduce((sum, post) => sum + post.caption.length, 0);
    const avgCaptionLength = Math.round(totalCaptionLength / posts.length);

    const totalHashtags = posts.reduce((sum, post) => sum + post.hashtags.length, 0);
    const avgHashtagsPerPost = totalHashtags / posts.length;

    // Content type distribution
    const contentTypeDistribution: Record<string, number> = {};
    posts.forEach((post) => {
      contentTypeDistribution[post.type] = (contentTypeDistribution[post.type] || 0) + 1;
    });

    return {
      engagementRate,
      avgEngagement,
      topPost,
      bestPerformingType: bestType,
      topHashtags,
      topMentions,
      avgCaptionLength,
      avgHashtagsPerPost,
      contentTypeDistribution,
    };
  }, [posts, profile]);
};

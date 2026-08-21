import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ExternalLink, ChevronDown, ChevronUp, Sparkles, FileText, Eye as EyeIcon } from "lucide-react";
import { InstagramPost } from "@/hooks/useInstagramPostsFromDB";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAnalyzeCreative } from "@/hooks/useAnalyzeCreative";
import { useTranscribeVideo } from "@/hooks/useTranscribeVideo";
import { CreativeAnalysisDialog } from "./CreativeAnalysisDialog";

interface PostsTableProps {
  posts: InstagramPost[];
}

export const PostsTable = ({ posts }: PostsTableProps) => {
  const [sortBy, setSortBy] = useState<"date" | "engagement">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [analyzingPost, setAnalyzingPost] = useState<string | null>(null);
  const [transcribingPost, setTranscribingPost] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<InstagramPost | null>(null);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);

  const analyzeCreative = useAnalyzeCreative();
  const transcribeVideo = useTranscribeVideo();

  const handleAnalyzeImage = async (post: InstagramPost) => {
    setAnalyzingPost(post.id);
    try {
      await analyzeCreative.mutateAsync({ postId: post.id, imageUrl: post.displayUrl });
    } finally {
      setAnalyzingPost(null);
    }
  };

  const handleTranscribeVideo = async (post: InstagramPost) => {
    if (!post.videoUrl) return;
    setTranscribingPost(post.id);
    try {
      await transcribeVideo.mutateAsync({ postId: post.id, videoUrl: post.videoUrl });
    } finally {
      setTranscribingPost(null);
    }
  };

  const handleViewAnalysis = (post: InstagramPost) => {
    setSelectedPost(post);
    setShowAnalysisDialog(true);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const sortedPosts = [...posts].sort((a, b) => {
    if (sortBy === "date") {
      return sortOrder === "desc"
        ? new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        : new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    }
    const eA = a.likesCount + a.commentsCount;
    const eB = b.likesCount + b.commentsCount;
    return sortOrder === "desc" ? eB - eA : eA - eB;
  });

  const toggleSort = (newSortBy: "date" | "engagement") => {
    if (sortBy === newSortBy) {
      setSortOrder(prev => prev === "desc" ? "asc" : "desc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-muted-foreground">{posts.length} posts</span>
        <div className="flex items-center gap-4">
          <span
            className={`text-xs cursor-pointer transition-colors ${sortBy === "date" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => toggleSort("date")}
          >
            Por data {sortBy === "date" && (sortOrder === "desc" ? "↓" : "↑")}
          </span>
          <span
            className={`text-xs cursor-pointer transition-colors ${sortBy === "engagement" ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}
            onClick={() => toggleSort("engagement")}
          >
            Por engagement {sortBy === "engagement" && (sortOrder === "desc" ? "↓" : "↑")}
          </span>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">Mídia</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Caption</TableHead>
            <TableHead className="text-right">Likes</TableHead>
            <TableHead className="text-right">Coment.</TableHead>
            <TableHead className="text-right">Views</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>IA</TableHead>
            <TableHead className="w-[40px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPosts.map((post) => {
            const isExpanded = expandedPost === post.id;
            const truncatedCaption = post.caption.length > 100
              ? `${post.caption.substring(0, 100)}...`
              : post.caption;

            return (
              <TableRow key={post.id}>
                <TableCell>
                  <img
                    src={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(post.displayUrl)}`}
                    alt="Post"
                    className="h-14 w-14 rounded-sm object-cover"
                    onError={(e) => { e.currentTarget.src = post.displayUrl; }}
                  />
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {format(new Date(post.timestamp), "dd/MM/yy", { locale: ptBR })}
                </TableCell>
                <TableCell className="max-w-md">
                  <div className="space-y-1">
                    <p className="text-sm whitespace-pre-wrap">
                      {isExpanded ? post.caption : truncatedCaption}
                    </p>
                    {post.caption.length > 100 && (
                      <button
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
                        onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                      >
                        {isExpanded ? <><ChevronUp className="h-3 w-3" /> menos</> : <><ChevronDown className="h-3 w-3" /> mais</>}
                      </button>
                    )}
                    {post.hashtags.length > 0 && (
                      <p className="text-xs text-muted-foreground/60">
                        {post.hashtags.slice(0, 3).map(t => `#${t}`).join(' ')}
                        {post.hashtags.length > 3 && ` +${post.hashtags.length - 3}`}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {formatNumber(post.likesCount)}
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {formatNumber(post.commentsCount)}
                </TableCell>
                <TableCell className="text-right text-sm font-medium">
                  {post.videoViewCount > 0 ? formatNumber(post.videoViewCount) : ''}
                </TableCell>
                <TableCell>
                  <span className="text-xs text-muted-foreground capitalize">{post.type}</span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-0.5">
                    {(post.aiImageAnalysis || post.aiVideoTranscription) && (
                      <button
                        className="p-1.5 rounded hover:bg-accent/10 transition-colors"
                        onClick={() => handleViewAnalysis(post)}
                        title="Ver Análise"
                      >
                        <EyeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    )}
                    {!post.aiImageAnalysis && (
                      <button
                        className="p-1.5 rounded hover:bg-accent/10 transition-colors disabled:opacity-30"
                        onClick={() => handleAnalyzeImage(post)}
                        disabled={analyzingPost === post.id}
                        title="Analisar Imagem"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    )}
                    {post.videoUrl && !post.aiVideoTranscription && (
                      <button
                        className="p-1.5 rounded hover:bg-accent/10 transition-colors disabled:opacity-30"
                        onClick={() => handleTranscribeVideo(post)}
                        disabled={transcribingPost === post.id}
                        title="Transcrever Vídeo"
                      >
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <a href={post.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <CreativeAnalysisDialog
        open={showAnalysisDialog}
        onOpenChange={setShowAnalysisDialog}
        post={selectedPost}
      />
    </div>
  );
};

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { OverviewView } from "@/components/social/analysis/views/OverviewView";
import { ContentBaseView } from "@/components/social/analysis/views/ContentBaseView";
import { PostsView } from "@/components/social/analysis/views/PostsView";
import { useInstagramProfiles } from "@/hooks/useInstagramProfiles";
import { useInstagramPostsFromDB } from "@/hooks/useInstagramPostsFromDB";
import { useSyncInstagramPosts } from "@/hooks/useSyncInstagramPosts";
import { useCreateContentBase } from "@/hooks/useCreateContentBase";
import { ArrowLeft, RefreshCw, Download } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SubView = 'overview' | 'content-base' | 'posts';

const formatNumber = (num: number | null) => {
  if (!num) return "0";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const SocialAnaliseDetalhada = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { profiles } = useInstagramProfiles();
  const profile = profiles?.find(p => p.username === username);

  const [activeSubView, setActiveSubView] = useState<SubView>('overview');

  const { data: postsData } = useInstagramPostsFromDB(username || null, !!username);
  const syncPosts = useSyncInstagramPosts();
  const createBase = useCreateContentBase();

  const posts = postsData?.posts || [];
  const lastSyncedAt = postsData?.lastSyncedAt;
  const isUpdating = syncPosts.isPending || createBase.isPending;

  const handleUpdateAnalysis = async () => {
    if (!username) return;
    try {
      await syncPosts.mutateAsync(username);
      await createBase.mutateAsync(username);
      toast.success("Análise atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar análise:", error);
    }
  };

  const handleExportPDF = () => {
    toast.info("Exportação de PDF em desenvolvimento");
  };

  const tabs: { id: SubView; label: string }[] = [
    { id: 'overview', label: 'Visão Geral' },
    { id: 'content-base', label: 'Base de Conteúdo' },
    { id: 'posts', label: 'Posts' },
  ];

  if (!username || !profile) {
    return (
      <Layout>
        <div className="min-h-screen pt-28 px-8 pb-16">
          <div className="max-w-[1100px] mx-auto">
            <p className="text-sm text-muted-foreground">Perfil não encontrado</p>
            <button
              onClick={() => navigate('/social/analise')}
              className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen pt-28 px-8 pb-16">
        <div className="max-w-[1100px] mx-auto">
          {/* Header */}
          <div className="mb-10">
            <button
              onClick={() => navigate('/social/analise')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              @{profile.username}
            </h1>
            <p className="text-base text-muted-foreground mt-1">
              {profile.display_name && `${profile.display_name} · `}
              {formatNumber(profile.follower_count)} seguidores
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 mb-10">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubView(tab.id)}
                className={cn(
                  "text-sm cursor-pointer transition-colors duration-200 pb-1",
                  activeSubView === tab.id
                    ? "text-foreground font-medium border-b-2 border-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="mb-12">
            {activeSubView === 'overview' && (
              <OverviewView posts={posts} profile={profile} />
            )}
            {activeSubView === 'content-base' && (
              <ContentBaseView profileId={profile.id} username={profile.username} />
            )}
            {activeSubView === 'posts' && (
              <PostsView posts={posts} />
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border/20 pt-6 flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              {lastSyncedAt
                ? `Última sync ${formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true, locale: ptBR })}`
                : "Sem análise"}
            </span>
            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={handleExportPDF}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" />
                Exportar PDF
              </button>
              <button
                onClick={handleUpdateAnalysis}
                disabled={isUpdating}
                className="text-xs text-foreground hover:text-foreground/80 transition-colors flex items-center gap-1.5 disabled:opacity-40"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", isUpdating && "animate-spin")} />
                {isUpdating ? "Atualizando..." : "Atualizar Análise"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SocialAnaliseDetalhada;

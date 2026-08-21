import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { AddProfileDialog } from "@/components/social/AddProfileDialog";
import { useInstagramProfiles } from "@/hooks/useInstagramProfiles";
import { useYouTubeVideos } from "@/hooks/useYouTubeVideos";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ChevronRight, Plus, Trash2, ExternalLink, Sparkles, FileText, Copy, Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type TabType = 'instagram' | 'youtube';

const formatNumber = (num: number | null) => {
  if (!num) return "0";
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const formatDuration = (duration: string | null) => {
  if (!duration) return "";
  const seconds = parseInt(duration.replace("s", ""));
  if (isNaN(seconds)) return duration;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}min`;
  if (m > 0) return `${m}min ${s}s`;
  return `${s}s`;
};

const SocialAnalise = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('instagram');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { profiles, isLoading: profilesLoading, deleteProfile } = useInstagramProfiles();
  const { videos, isLoading: videosLoading, addVideo, deleteVideo, analyzeVideo } = useYouTubeVideos();

  const filteredProfiles = (profiles || []).filter(p =>
    p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.display_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddVideo = async () => {
    if (!videoUrl.trim()) return;
    const youtubePattern = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/;
    if (!youtubePattern.test(videoUrl)) {
      toast.error("URL do YouTube inválida");
      return;
    }
    await addVideo.mutateAsync(videoUrl);
    setVideoUrl("");
  };

  const handleCopyTranscript = (transcript: string) => {
    navigator.clipboard.writeText(transcript);
    toast.success("Transcrição copiada!");
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: 'instagram', label: 'Instagram' },
    { id: 'youtube', label: 'YouTube' },
  ];

  return (
    <Layout>
      <div className="min-h-screen pt-28 px-8 pb-16">
        <div className="max-w-[1100px] mx-auto">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">
              Análise
            </h1>
            <p className="text-base text-muted-foreground">
              Perfis e vídeos para referência
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-6 mb-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "text-sm cursor-pointer transition-colors duration-200 pb-1",
                  activeTab === tab.id
                    ? "text-foreground font-medium border-b-2 border-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Instagram Tab */}
          {activeTab === 'instagram' && (
            <div>
              {/* Search + Add */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Buscar perfil..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent border-b border-border/30 focus:border-foreground text-sm py-2 outline-none transition-colors text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </button>
              </div>

              {/* Profile list */}
              {profilesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 rounded-xl bg-muted/20 animate-pulse" />
                  ))}
                </div>
              ) : filteredProfiles.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8">
                  {searchTerm ? "Nenhum perfil encontrado" : "Nenhum perfil adicionado ainda"}
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredProfiles.map((profile, index) => {
                    const proxyPicUrl = profile.profile_picture_url
                      ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(profile.profile_picture_url)}`
                      : "";

                    return (
                      <div
                        key={profile.id}
                        className="group rounded-xl border border-border/20 bg-card/30 hover:bg-card/50 cursor-pointer transition-all duration-200 p-4"
                        style={{
                          animation: `fadeIn 300ms ease-out ${index * 50}ms both`,
                        }}
                        onClick={() => navigate(`/social/analise/${profile.username}`)}
                      >
                        <div className="flex items-center gap-4">
                          {/* Profile picture */}
                          <Avatar className="h-12 w-12 ring-2 ring-border/20">
                            <AvatarImage src={proxyPicUrl} />
                            <AvatarFallback className="text-sm bg-muted text-muted-foreground font-medium">
                              {profile.username.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-medium text-foreground">
                                @{profile.username}
                              </h3>
                              {profile.is_verified && (
                                <span className="inline-flex items-center text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                                  Verificado
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              {profile.display_name && (
                                <span className="text-xs text-muted-foreground">{profile.display_name}</span>
                              )}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                                <span>{formatNumber(profile.follower_count)} seguidores</span>
                                {profile.post_count && (
                                  <>
                                    <span className="w-0.5 h-0.5 rounded-full bg-muted-foreground/30" />
                                    <span>{formatNumber(profile.post_count)} posts</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground/50">
                              {profile.last_analyzed_at
                                ? formatDistanceToNow(new Date(profile.last_analyzed_at), { addSuffix: true, locale: ptBR })
                                : "Nunca analisado"}
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all duration-200" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* YouTube Tab */}
          {activeTab === 'youtube' && (
            <div>
              {/* URL Input */}
              <div className="flex items-center gap-3 mb-8">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Cole a URL do vídeo do YouTube..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddVideo()}
                    className="w-full bg-transparent border-b border-border/30 focus:border-foreground text-sm py-2 outline-none transition-colors text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <button
                  onClick={handleAddVideo}
                  disabled={addVideo.isPending || !videoUrl.trim()}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 flex items-center gap-1.5 whitespace-nowrap disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" />
                  {addVideo.isPending ? "Processando..." : "Adicionar"}
                </button>
              </div>

              {/* Video list */}
              {videosLoading ? (
                <div className="space-y-4">
                  {[1, 2].map(i => (
                    <div key={i} className="h-28 rounded-xl bg-muted/20 animate-pulse" />
                  ))}
                </div>
              ) : videos.length === 0 ? (
                <div className="text-center py-16">
                  <Play className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum vídeo adicionado ainda
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    Cole uma URL do YouTube acima para começar
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {videos.map((video, index) => {
                    const hasAnalysis = !!video.ai_analysis;
                    const hasTranscript = !!video.transcript && video.transcript.trim().length > 0;
                    const isTranscriptOpen = expandedId === `transcript-${video.id}`;
                    const isAnalysisOpen = expandedId === `analysis-${video.id}`;

                    return (
                      <div
                        key={video.id}
                        className="rounded-xl border border-border/20 bg-card/30 hover:bg-card/50 transition-all duration-200 overflow-hidden"
                        style={{
                          animation: `fadeIn 300ms ease-out ${index * 50}ms both`,
                        }}
                      >
                        {/* Card header */}
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            {/* YouTube thumbnail placeholder */}
                            <div className="relative flex-shrink-0 w-16 h-16 rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden">
                              <img
                                src={`https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`}
                                alt=""
                                className="w-full h-full object-cover rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                              <Play className="h-5 w-5 text-muted-foreground/40 hidden" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-foreground leading-snug line-clamp-2">
                                {video.ai_analysis?.titulo_sugerido || video.title || 'Sem título'}
                              </h3>
                              <div className="flex items-center gap-2 mt-1.5">
                                {video.channel_name && video.channel_name !== 'Canal não disponível' && (
                                  <span className="text-xs text-muted-foreground">
                                    {video.channel_name}
                                  </span>
                                )}
                                {video.duration && (
                                  <span className="text-xs text-muted-foreground/60">
                                    {formatDuration(video.duration)}
                                  </span>
                                )}
                                {hasAnalysis && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                                    <Sparkles className="h-2.5 w-2.5" />
                                    Analisado
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              {!hasAnalysis && hasTranscript && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary"
                                  onClick={() => analyzeVideo.mutate(video.id)}
                                  disabled={analyzeVideo.isPending}
                                  title="Analisar com IA"
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => window.open(video.url, '_blank')}
                                title="Abrir no YouTube"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => deleteVideo.mutate(video.id)}
                                disabled={deleteVideo.isPending}
                                title="Remover"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>

                          {/* Action buttons row */}
                          {(hasTranscript || hasAnalysis) && (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/10">
                              {hasTranscript && (
                                <button
                                  onClick={() => setExpandedId(isTranscriptOpen ? null : `transcript-${video.id}`)}
                                  className={cn(
                                    "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-200",
                                    isTranscriptOpen
                                      ? "bg-primary/15 text-primary"
                                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                  )}
                                >
                                  <FileText className="h-3 w-3" />
                                  Transcrição
                                  <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", isTranscriptOpen && "rotate-180")} />
                                </button>
                              )}
                              {hasAnalysis && (
                                <button
                                  onClick={() => setExpandedId(isAnalysisOpen ? null : `analysis-${video.id}`)}
                                  className={cn(
                                    "inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all duration-200",
                                    isAnalysisOpen
                                      ? "bg-primary/15 text-primary"
                                      : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                  )}
                                >
                                  <Sparkles className="h-3 w-3" />
                                  Análise IA
                                  <ChevronDown className={cn("h-3 w-3 transition-transform duration-200", isAnalysisOpen && "rotate-180")} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Expanded transcript */}
                        {isTranscriptOpen && hasTranscript && (
                          <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                            <div className="bg-muted/20 rounded-lg p-4 border border-border/10">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-medium text-muted-foreground">Transcrição completa</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                                  onClick={() => handleCopyTranscript(video.transcript!)}
                                >
                                  <Copy className="h-3 w-3" />
                                  Copiar
                                </Button>
                              </div>
                              <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                  {video.transcript}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Expanded analysis */}
                        {isAnalysisOpen && hasAnalysis && (
                          <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                            <div className="bg-muted/20 rounded-lg p-4 border border-border/10 space-y-4">
                              {video.ai_analysis.resumo_executivo && (
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground mb-2 block">Resumo</span>
                                  <p className="text-sm text-foreground/80 leading-relaxed">
                                    {video.ai_analysis.resumo_executivo}
                                  </p>
                                </div>
                              )}
                              {video.ai_analysis.highlights_e_insights?.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground mb-2 block">Insights</span>
                                  <div className="space-y-2">
                                    {video.ai_analysis.highlights_e_insights.map((h: any) => (
                                      <div key={h.id} className="text-sm border-l-2 border-primary/40 pl-3 py-1">
                                        <p className="text-foreground/90">{h.ponto_chave}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{h.aplicacao_criativo}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {video.ai_analysis.citacoes_impactantes?.length > 0 && (
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground mb-2 block">Citações</span>
                                  <div className="space-y-1.5">
                                    {video.ai_analysis.citacoes_impactantes.map((c: string, i: number) => (
                                      <p key={i} className="text-xs italic text-muted-foreground/80 border-l-2 border-border/30 pl-3 py-0.5">
                                        "{c}"
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AddProfileDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: hsl(var(--border));
          border-radius: 2px;
        }
      `}</style>
    </Layout>
  );
};

export default SocialAnalise;

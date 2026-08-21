import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, TrendingUp, Image, Sparkles, Heart, MessageCircle, Play } from "lucide-react";
import { InstagramProfile } from "@/hooks/useInstagramProfiles";
import { useInstagramPosts } from "@/hooks/useInstagramPosts";

interface ProfileAnalysisDialogProps {
  profile: InstagramProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileAnalysisDialog = ({ 
  profile, 
  open, 
  onOpenChange 
}: ProfileAnalysisDialogProps) => {
  const { data: postsData, isLoading: isLoadingPosts } = useInstagramPosts(profile?.username || null, open);
  
  const formatNumber = (num: number | null) => {
    if (!num) return "0";
    return num.toLocaleString("pt-BR");
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-4 mb-2">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profile.profile_picture_url || ""} />
              <AvatarFallback>{profile.username.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="flex items-center gap-2">
                @{profile.username}
                {profile.is_verified && (
                  <Badge variant="secondary">✓ Verificado</Badge>
                )}
              </DialogTitle>
              {profile.display_name && (
                <DialogDescription>{profile.display_name}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="perfil" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="perfil">Perfil</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="perfil" className="space-y-6 mt-6">
            {/* Métricas Principais */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Seguidores</span>
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(profile.follower_count)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Image className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Posts</span>
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(profile.post_count)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Seguindo</span>
                  </div>
                  <p className="text-2xl font-bold">{formatNumber(profile.following_count)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Bio */}
            {profile.bio && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Bio</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {profile.bio}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Insights com IA - Placeholder */}
            <Card className="border-dashed">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Insights com IA</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    A análise detalhada com IA estará disponível em breve!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Em breve você poderá obter insights sobre tom de voz, padrões de conteúdo,
                    engajamento e sugestões de melhoria.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Observações */}
            {profile.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {profile.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="posts" className="mt-6">
            {isLoadingPosts ? (
              <div className="grid grid-cols-3 gap-4">
                {[...Array(9)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : postsData?.posts && postsData.posts.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {postsData.posts.map((post) => (
                  <Card key={post.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                    <div className="relative aspect-square">
                      <img 
                        src={post.displayUrl} 
                        alt={post.caption.slice(0, 50)} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                        <div className="flex items-center gap-1">
                          <Heart className="h-5 w-5" />
                          <span className="font-semibold">{formatNumber(post.likesCount)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-5 w-5" />
                          <span className="font-semibold">{formatNumber(post.commentsCount)}</span>
                        </div>
                        {post.videoViewCount > 0 && (
                          <div className="flex items-center gap-1">
                            <Play className="h-5 w-5" />
                            <span className="font-semibold">{formatNumber(post.videoViewCount)}</span>
                          </div>
                        )}
                      </div>
                      {post.type === 'Video' && (
                        <div className="absolute top-2 right-2">
                          <Play className="h-5 w-5 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-muted-foreground line-clamp-2">{post.caption || 'Sem legenda'}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(post.timestamp)}</p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Nenhum post encontrado</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

import { useState } from "react";
import { useFolderContents, FolderContent } from "@/hooks/useFolderContents";
import { Youtube, Instagram, Database, Image, FileText } from "lucide-react";
import { YouTubeVideoDialog } from "./YouTubeVideoDialog";
import { InstagramProfileDialog } from "./InstagramProfileDialog";
import { ContentBaseDialog } from "./ContentBaseDialog";
import { CreativeAnalysisDialog } from "@/components/social/analysis/CreativeAnalysisDialog";
import { ContentScriptDialog } from "./ContentScriptDialog";

interface FolderViewProps {
  folderId: string;
}

const formatNumber = (num: number) => {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export const FolderView = ({ folderId }: FolderViewProps) => {
  const { contents, isLoading, removeContent } = useFolderContents(folderId);
  const [selectedContent, setSelectedContent] = useState<FolderContent | null>(null);
  const [dialogType, setDialogType] = useState<FolderContent['content_type'] | null>(null);

  if (isLoading) {
    return (
      <div className="text-center py-12 text-sm text-muted-foreground">
        Carregando conteúdos...
      </div>
    );
  }

  if (contents.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-muted-foreground">Nenhum conteúdo nesta pasta ainda</p>
        <p className="text-xs text-muted-foreground mt-1">Adicione conteúdos usando o botão acima</p>
      </div>
    );
  }

  const getContentIcon = (type: FolderContent['content_type']) => {
    const cls = "h-4 w-4 text-muted-foreground";
    switch (type) {
      case 'youtube_video': return <Youtube className={cls} />;
      case 'instagram_profile': return <Instagram className={cls} />;
      case 'profile_content_base': return <Database className={cls} />;
      case 'instagram_post': return <Image className={cls} />;
      case 'content_script': return <FileText className={cls} />;
    }
  };

  const getContentRow = (content: FolderContent) => {
    const data = content.content_data;
    if (!data) return { title: 'Conteúdo não encontrado', meta: '' };

    switch (content.content_type) {
      case 'youtube_video':
        return {
          title: data.title || 'Vídeo do YouTube',
          meta: [data.channel_name, data.duration].filter(Boolean).join(' · ')
        };
      case 'instagram_profile':
        return {
          title: `@${data.username}`,
          meta: [data.display_name, data.follower_count ? `${formatNumber(data.follower_count)} seguidores` : null].filter(Boolean).join(' · ')
        };
      case 'profile_content_base':
        return {
          title: 'Base de Conhecimento',
          meta: `${data.posts_analyzed_count || 0} posts analisados · ${formatNumber(data.total_engagement || 0)} engajamentos`
        };
      case 'instagram_post':
        return {
          title: data.caption?.substring(0, 60) + '...' || 'Post do Instagram',
          meta: [
            data.likes_count ? `${formatNumber(data.likes_count)} likes` : null,
            data.comments_count ? `${formatNumber(data.comments_count)} comentários` : null
          ].filter(Boolean).join(' · ')
        };
      case 'content_script':
        return {
          title: data.title || 'Roteiro',
          meta: [data.type, data.platform].filter(Boolean).join(' · ')
        };
    }
  };

  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
        Conteúdos
      </p>
      
      {contents.map((content) => {
        const { title, meta } = getContentRow(content as FolderContent);
        return (
          <div
            key={content.id}
            className="group flex items-center gap-3 py-4 px-3 -mx-3 rounded-lg hover:bg-accent/5 cursor-pointer transition-colors duration-200 border-b border-border/20"
            onClick={() => {
              setSelectedContent(content as FolderContent);
              setDialogType(content.content_type as any);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              if (confirm('Deseja remover este conteúdo da pasta?')) {
                removeContent.mutate(content.id);
              }
            }}
          >
            {getContentIcon(content.content_type as FolderContent['content_type'])}
            <span className="text-sm font-medium text-foreground">{title}</span>
            {meta && (
              <span className="text-sm text-muted-foreground ml-auto">{meta}</span>
            )}
          </div>
        );
      })}

      {/* Dialogs */}
      <YouTubeVideoDialog 
        open={dialogType === 'youtube_video'}
        onOpenChange={(open) => !open && setDialogType(null)}
        video={dialogType === 'youtube_video' ? selectedContent?.content_data : null}
      />
      
      <InstagramProfileDialog 
        open={dialogType === 'instagram_profile'}
        onOpenChange={(open) => !open && setDialogType(null)}
        profile={dialogType === 'instagram_profile' ? selectedContent?.content_data : null}
      />
      
      <ContentBaseDialog 
        open={dialogType === 'profile_content_base'}
        onOpenChange={(open) => !open && setDialogType(null)}
        contentBase={dialogType === 'profile_content_base' ? selectedContent?.content_data : null}
        username={(selectedContent?.content_data as any)?.username || ''}
      />
      
      <CreativeAnalysisDialog 
        open={dialogType === 'instagram_post'}
        onOpenChange={(open) => !open && setDialogType(null)}
        post={dialogType === 'instagram_post' ? selectedContent?.content_data : null}
      />
      
      <ContentScriptDialog
        open={dialogType === 'content_script'}
        onOpenChange={(open) => !open && setDialogType(null)}
        script={dialogType === 'content_script' ? selectedContent?.content_data : null}
      />
    </div>
  );
};

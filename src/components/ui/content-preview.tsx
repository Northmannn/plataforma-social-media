import { Badge } from "./badge";
import { Button } from "./button";
import { cn } from "@/lib/utils";

const truncateText = (text: string, maxLength: number = 60) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

export interface ContentPreviewData {
  type: 'youtube_video' | 'instagram_profile' | 'instagram_post' | 'profile_content_base' | 'folder';
  thumbnail?: string;
  title?: string;
  subtitle?: string;
  stats?: {
    label: string;
    value: string | number;
  }[];
  description?: string;
  actions?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive' | 'outline';
    disabled?: boolean;
  }[];
}

interface ContentPreviewProps {
  data: ContentPreviewData;
}

const getTypeBadge = (type: string) => {
  const badges: Record<string, string> = {
    youtube_video: '📹 Vídeo',
    instagram_profile: '👤 Perfil',
    instagram_post: '📸 Post',
    profile_content_base: '🗄️ Base',
    folder: '📁 Pasta'
  };
  return badges[type] || type;
};

export const ContentPreview = ({ data }: ContentPreviewProps) => {
  return (
    <div className="w-[420px] space-y-3 overflow-hidden">
      {/* Thumbnail */}
      {data.thumbnail && (
        <div className="relative w-full h-52 rounded-lg overflow-hidden bg-muted">
          <img 
            src={data.thumbnail} 
            alt={data.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <Badge className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm">
            {getTypeBadge(data.type)}
          </Badge>
        </div>
      )}

      {/* Título e Subtítulo */}
      <div className="space-y-1 overflow-hidden text-center">
        {data.title && (
          <h4 className="font-semibold text-base line-clamp-2 break-words">
            {truncateText(data.title, 70)}
          </h4>
        )}
        {data.subtitle && (
          <p className="text-sm text-muted-foreground truncate">
            {truncateText(data.subtitle, 50)}
          </p>
        )}
      </div>

      {/* Estatísticas */}
      {data.stats && data.stats.length > 0 && (
        <div className={`grid gap-2 ${data.stats.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {data.stats.map((stat, idx) => (
            <div key={idx} className="bg-muted/50 rounded-md p-3 overflow-hidden text-center">
              <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
              <p className="text-base font-semibold truncate">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Descrição */}
      {data.description && (
        <p className="text-sm text-muted-foreground line-clamp-3 break-words text-center">
          {truncateText(data.description, 150)}
        </p>
      )}

      {/* Ações Rápidas */}
      {data.actions && data.actions.length > 0 && (
        <div className="flex gap-2 pt-3 border-t border-border/50">
          {data.actions.map((action, idx) => (
            <Button
              key={idx}
              size="sm"
              variant={action.variant || 'outline'}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              disabled={action.disabled}
              className="flex-1 gap-2"
            >
              {action.icon}
              <span>{action.label}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

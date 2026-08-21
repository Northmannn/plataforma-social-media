import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Youtube, Copy, FileText, Sparkles, ExternalLink, Clock } from "lucide-react";
import { toast } from "sonner";

interface YouTubeVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: {
    title?: string;
    url?: string;
    transcript?: string;
    ai_analysis?: any;
    duration?: string;
    channel_name?: string;
    video_id?: string;
  } | null;
}

const extractVideoId = (url?: string) => {
  if (!url) return '';
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : '';
};

export const YouTubeVideoDialog = ({ open, onOpenChange, video }: YouTubeVideoDialogProps) => {
  if (!video) return null;

  const videoId = video.video_id || extractVideoId(video.url);

  const handleCopyTranscript = () => {
    if (video.transcript) {
      navigator.clipboard.writeText(video.transcript);
      toast.success('Transcrição copiada para a área de transferência!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="h-5 w-5 text-red-500" />
            {video.title || 'Vídeo do YouTube'}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4">
            {video.channel_name && <span>{video.channel_name}</span>}
            {video.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {video.duration}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Player do YouTube */}
          {videoId && (
            <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                className="w-full h-full"
                allowFullScreen
                title={video.title || 'YouTube video'}
              />
            </div>
          )}

          {/* Transcrição */}
          {video.transcript && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Transcrição
                </h3>
                <Button variant="outline" size="sm" onClick={handleCopyTranscript}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              </div>
              <div className="p-4 bg-muted rounded-lg max-h-[300px] overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{video.transcript}</p>
              </div>
            </div>
          )}

          {/* Análise AI */}
          {video.ai_analysis && (
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Análise com IA
              </h3>
              <div className="p-4 bg-muted rounded-lg">
                <pre className="text-sm whitespace-pre-wrap leading-relaxed">
                  {typeof video.ai_analysis === 'string' 
                    ? video.ai_analysis 
                    : JSON.stringify(video.ai_analysis, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" asChild>
              <a href={video.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir no YouTube
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

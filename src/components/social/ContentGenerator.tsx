import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGenerateContent } from "@/hooks/useGenerateContent";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";

interface ContentGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  contentType: 'video' | 'post' | 'idea';
  onGenerated: (data: { title: string; content: string; metadata: any }) => void;
}

export const ContentGenerator = ({ 
  open, 
  onOpenChange, 
  profileId, 
  contentType,
  onGenerated 
}: ContentGeneratorProps) => {
  const [prompt, setPrompt] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const { mutate: generateContent, isPending } = useGenerateContent();

  const handleGenerate = () => {
    if (!prompt.trim()) return;

    generateContent(
      {
        profileId,
        contentType,
        prompt: prompt.trim(),
        platform,
      },
      {
        onSuccess: (data) => {
          onGenerated(data);
          onOpenChange(false);
          setPrompt("");
        },
      }
    );
  };

  const getPlaceholder = () => {
    if (contentType === 'video') {
      return "Ex: Vídeo sobre rotina matinal de produtividade";
    } else if (contentType === 'post') {
      return "Ex: Post motivacional sobre superar desafios";
    } else {
      return "Ex: Ideia criativa sobre organização de casa";
    }
  };

  const getTitle = () => {
    if (contentType === 'video') return "Gerar Roteiro de Vídeo com IA";
    if (contentType === 'post') return "Gerar Legenda com IA";
    return "Gerar Ideia com IA";
  };

  const getDescription = () => {
    return "A IA vai criar conteúdo baseado na análise completa do perfil selecionado.";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="platform">Plataforma</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger id="platform">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Sobre o que você quer criar?</Label>
            <Textarea
              id="prompt"
              placeholder={getPlaceholder()}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {isPending && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                Analisando base de conhecimento e gerando conteúdo personalizado...
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Gerar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

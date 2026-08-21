import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Image as ImageIcon, Palette, Sparkles, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { InstagramPost } from "@/hooks/useInstagramPostsFromDB";

interface CreativeAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: InstagramPost | null;
}

export const CreativeAnalysisDialog = ({ open, onOpenChange, post }: CreativeAnalysisDialogProps) => {
  if (!post) return null;

  const analysis = post.aiImageAnalysis;
  const transcription = post.aiVideoTranscription;

  const handleCopyAnalysis = () => {
    if (analysis) {
      const text = `
Análise do Post: ${post.caption?.substring(0, 50)}...

DESCRIÇÃO VISUAL:
${analysis.description}

ESTILO: ${analysis.style}
EMOÇÃO: ${analysis.emotion}
COMPOSIÇÃO: ${analysis.composition}
QUALIDADE: ${analysis.quality}

CORES DOMINANTES:
${analysis.colors.join(', ')}

ELEMENTOS IDENTIFICADOS:
${analysis.elements.join(', ')}

SUGESTÕES DE MELHORIA:
${analysis.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}
${transcription ? `\nTRANSCRIÇÃO:\n${transcription}` : ''}
      `.trim();
      
      navigator.clipboard.writeText(text);
      toast.success('Análise copiada para a área de transferência!');
    }
  };

  const proxyImageUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(post.displayUrl)}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Análise de Criativo com IA
          </DialogTitle>
          <DialogDescription>
            Análise detalhada gerada por inteligência artificial
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Imagem */}
          <div className="relative rounded-lg overflow-hidden border">
            <img 
              src={proxyImageUrl} 
              alt="Post" 
              className="w-full h-auto max-h-[400px] object-contain bg-muted"
              onError={(e) => {
                e.currentTarget.src = post.displayUrl;
              }}
            />
          </div>

          {analysis ? (
            <>
              {/* Descrição */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Descrição Visual</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {analysis.description}
                </p>
              </div>

              {/* Métricas Visuais */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Estilo</p>
                  <Badge variant="secondary">{analysis.style}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Emoção</p>
                  <Badge variant="secondary">{analysis.emotion}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Qualidade</p>
                  <Badge variant="secondary">{analysis.quality}</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Composição</p>
                  <Badge variant="secondary" className="text-xs">
                    {analysis.composition.split(' ').slice(0, 3).join(' ')}...
                  </Badge>
                </div>
              </div>

              {/* Cores Dominantes */}
              {analysis.colors && analysis.colors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">Cores Dominantes</h3>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {analysis.colors.map((color, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded border shadow-sm" 
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs text-muted-foreground font-mono">
                          {color}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Elementos Identificados */}
              {analysis.elements && analysis.elements.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">Elementos Identificados</h3>
                  <div className="flex gap-2 flex-wrap">
                    {analysis.elements.map((element, index) => (
                      <Badge key={index} variant="outline">
                        {element}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Sugestões */}
              {analysis.suggestions && analysis.suggestions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">Sugestões de Melhoria</h3>
                  </div>
                  <ul className="space-y-1 list-disc list-inside text-sm text-muted-foreground">
                    {analysis.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : null}

          {/* Transcrição */}
          {transcription && (
            <div className="space-y-2">
              <h3 className="font-semibold">Transcrição do Vídeo</h3>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {transcription}
                </p>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleCopyAnalysis}
              disabled={!analysis && !transcription}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copiar Análise
            </Button>
            <Button variant="default" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

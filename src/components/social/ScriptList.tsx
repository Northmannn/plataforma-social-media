import { useState } from "react";
import { Copy, MoreVertical, Trash2, Edit, Files, FileDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ContentScript, useContentScripts } from "@/hooks/useContentScripts";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { generateContentPDF } from "@/lib/pdf-generator";

// Função para renderizar markdown no preview
const renderMarkdown = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
};

interface ScriptListProps {
  type: "video" | "post" | "idea";
}

const platformLabels: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  twitter: "Twitter",
};

export const ScriptList = ({ type }: ScriptListProps) => {
  const { scripts, isLoading, deleteScript, duplicateScript } = useContentScripts(type);

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    toast.success("Conteúdo copiado!");
  };

  const handleExportPDF = async (script: ContentScript) => {
    const loadingToast = toast.loading("Gerando PDF...");
    
    try {
      generateContentPDF(script);
      toast.success("PDF gerado com sucesso!", { id: loadingToast });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF", { id: loadingToast });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (scripts.length === 0) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Files className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum conteúdo salvo</h3>
            <p className="text-sm text-muted-foreground">
              Crie seu primeiro conteúdo usando o editor acima
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Conteúdos Salvos ({scripts.length})</h3>
      
      {scripts.map((script) => (
        <Card key={script.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{script.title}</h4>
                  {script.platform && (
                    <Badge variant="secondary" className="text-xs">
                      {platformLabels[script.platform] || script.platform}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Criado {formatDistanceToNow(new Date(script.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleCopy(script.content)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => duplicateScript.mutate(script)}>
                    <Files className="h-4 w-4 mr-2" />
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportPDF(script)}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => deleteScript.mutate(script.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remover
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="bg-muted/50 rounded-md p-4">
              <p className="text-sm whitespace-pre-wrap line-clamp-4">
                {renderMarkdown(script.content)}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

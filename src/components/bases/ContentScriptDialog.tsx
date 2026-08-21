import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Copy, FileDown, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import { generateChatMessagePDF } from "@/lib/pdf-generator-chat";

interface ContentScriptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  script: any | null;
}

const typeLabels: Record<string, string> = {
  video: "Roteiro de Vídeo",
  post: "Legenda para Post",
  idea: "Ideia de Conteúdo",
};

// --- Same markdown renderer used in the creation chat artifact ---
const renderInline = (text: string) => {
  const parts = text.split(/(\*\*[^\*]+\*\*|\*[^\*]+\*|`[^`]+`|\[[^\]]+\]\([^\)]+\))/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono text-emerald-400">{part.slice(1, -1)}</code>;
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^\)]+)\)$/);
    if (linkMatch) {
      return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-emerald-500 underline hover:text-emerald-400">{linkMatch[1]}</a>;
    }
    return part;
  });
};

const renderFormattedContent = (content: string) => {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    if (trimmed.startsWith('### ')) {
      elements.push(<h4 key={i} className="text-base font-bold mt-4 mb-2 text-foreground">{renderInline(trimmed.slice(4))}</h4>);
      i++; continue;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(<h3 key={i} className="text-lg font-bold mt-5 mb-2 text-emerald-500">{renderInline(trimmed.slice(3))}</h3>);
      i++; continue;
    }
    if (trimmed.startsWith('# ')) {
      elements.push(<h2 key={i} className="text-xl font-bold mt-6 mb-3 text-foreground">{renderInline(trimmed.slice(2))}</h2>);
      i++; continue;
    }

    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(<hr key={i} className="my-4 border-border/50" />);
      i++; continue;
    }

    if (trimmed.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      elements.push(
        <pre key={`code-${i}`} className="my-3 p-4 rounded-lg bg-zinc-900 border border-border/30 overflow-x-auto">
          <code className="text-xs font-mono text-zinc-300">{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    if (trimmed.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <blockquote key={`bq-${i}`} className="my-3 border-l-2 border-emerald-500/50 pl-4 text-sm text-muted-foreground italic">
          {quoteLines.map((ql, qi) => <p key={qi}>{renderInline(ql)}</p>)}
        </blockquote>
      );
      continue;
    }

    if (/^[-*+]\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*+]\s/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-1.5 my-3">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-sm">
              <span className="mt-1 flex-shrink-0 text-emerald-500">•</span>
              <span className="flex-1 text-foreground">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+[.)]\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+[.)]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+[.)]\s/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-1.5 my-3 list-none">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-sm">
              <span className="mt-0 flex-shrink-0 text-emerald-500 font-medium text-xs min-w-[20px]">{j + 1}.</span>
              <span className="flex-1 text-foreground">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    elements.push(
      <p key={i} className="mb-3 leading-relaxed text-sm text-foreground">
        {renderInline(trimmed)}
      </p>
    );
    i++;
  }

  return elements;
};

export const ContentScriptDialog = ({ open, onOpenChange, script }: ContentScriptDialogProps) => {
  const navigate = useNavigate();
  if (!script) return null;

  const handleUseInCreation = () => {
    // Clear active conversation so it starts fresh
    sessionStorage.removeItem('active_conversation_id');
    // Store the script id to pre-select as knowledge source
    sessionStorage.setItem('prefill_content_script_id', script.id);
    sessionStorage.setItem('prefill_content_script_title', script.title || 'Conteúdo salvo');
    onOpenChange(false);
    navigate('/social/criacao');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(script.content || "");
    toast.success("Conteúdo copiado!");
  };

  const handleGeneratePDF = () => {
    generateChatMessagePDF(
      {
        id: script.id,
        role: 'assistant' as const,
        content: script.content,
        timestamp: script.created_at,
      },
      {
        contentType: typeLabels[script.type] || script.type,
        platform: script.platform || undefined,
      }
    );
  };

  const formattedDate = script.created_at
    ? format(new Date(script.created_at), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 h-[85vh] flex flex-col overflow-hidden gap-0">
        {/* Header - matching artifact style */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/30 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-emerald-500" />
            <DialogTitle className="text-sm font-medium text-foreground">
              {typeLabels[script.type] || "Conteúdo Gerado"}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-1">
            {script.type && (
              <Badge variant="secondary" className="text-xs mr-2">
                {typeLabels[script.type] || script.type}
              </Badge>
            )}
            {script.platform && (
              <Badge variant="outline" className="text-xs capitalize mr-2">
                {script.platform}
              </Badge>
            )}
          </div>
        </div>

        <DialogDescription className="sr-only">
          Visualização do conteúdo salvo
        </DialogDescription>

        {/* Metadata */}
        <div className="px-5 pt-3 pb-2 flex-shrink-0">
          {script.title && (
            <p className="text-sm font-medium text-foreground mb-1">{script.title}</p>
          )}
          {formattedDate && (
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          )}
          {script.metadata?.profileName && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Baseado em @{script.metadata.profileName}
            </p>
          )}
        </div>

        {/* Content - scrollable, same style as artifact */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-5 py-4">
            {renderFormattedContent(script.content || "")}
          </div>
        </ScrollArea>

        {/* Footer - matching artifact style */}
        <div className="p-3 border-t border-border/30 flex gap-2 flex-shrink-0">
          <button
            onClick={handleUseInCreation}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/5 border border-emerald-500/30 transition-colors duration-200"
          >
            <MessageSquarePlus className="w-4 h-4" />
            Usar na Criação
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/5 border border-border/30 transition-colors duration-200"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleGeneratePDF}
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/5 border border-border/30 transition-colors duration-200"
          >
            <FileDown className="w-4 h-4" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Menu, PenSquare, ArrowUp, Paperclip, X, Copy, FileDown,
  FolderPlus, Plus, FileText
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle
} from "@/components/ui/sheet";
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatGenerationSettings } from "@/components/social/creation/ChatGenerationSettings";
import { SaveToFolderDialog } from "@/components/social/creation/SaveToFolderDialog";
import { useConversations } from "@/hooks/useConversations";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { useCreateConversation } from "@/hooks/useCreateConversation";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useKnowledgeSources } from "@/hooks/useKnowledgeSources";
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";
import { generateChatMessagePDF } from "@/lib/pdf-generator-chat";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: any;
}

const generateSummary = (content: string): string => {
  const lines = content
    .split('\n')
    .map(l => l.replace(/#{1,3}\s*/g, '').replace(/\*\*/g, '').replace(/^[-*]\s*/g, '').replace(/^\d+\.\s*/g, '').trim())
    .filter(l => l.length > 0);
  const summary = lines.slice(0, 3).join(' ');
  if (summary.length > 150) return summary.slice(0, 147) + '...';
  return summary + (lines.length > 3 ? '...' : '');
};

const contentTypeLabels: Record<string, string> = {
  video: 'Roteiro de Vídeo',
  post: 'Legenda para Post',
  idea: 'Ideia de Conteúdo'
};

const PROMPT_SUGGESTIONS = [
  "Roteiro de vídeo",
  "Legenda para post",
  "Ideias de conteúdo",
  "Script de Reels",
  "Carrossel educativo",
  "Copy para stories",
];

// --- Markdown renderer ---
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

    // Headings
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

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(<hr key={i} className="my-4 border-border/50" />);
      i++; continue;
    }

    // Code block
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

    // Blockquote
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

    // Unordered list
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

    // Ordered list
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

    // Regular paragraph
    elements.push(
      <p key={i} className="mb-3 leading-relaxed text-sm text-foreground">
        {renderInline(trimmed)}
      </p>
    );
    i++;
  }

  return elements;
};

const SocialCriacao = () => {
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationIdState] = useState<string | null>(() => {
    return sessionStorage.getItem('active_conversation_id') || null;
  });

  const setActiveConversationId = (id: string | null) => {
    setActiveConversationIdState(id);
    if (id) {
      sessionStorage.setItem('active_conversation_id', id);
    } else {
      sessionStorage.removeItem('active_conversation_id');
    }
  };
  const [selectedContentType, setSelectedContentType] = useState<'video' | 'post' | 'idea'>('video');
  const [previewMessage, setPreviewMessage] = useState<Message | null>(null);
  const [artifactOpen, setArtifactOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pendingUserMessage, setPendingUserMessage] = useState<Message | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 48, maxHeight: 150 });

  const { data: conversations = [] } = useConversations();
  const { data: messages = [] } = useConversationMessages(activeConversationId);

  // Clear stale conversation from sessionStorage if it doesn't belong to current user
  useEffect(() => {
    if (activeConversationId && conversations.length > 0) {
      const found = conversations.some((c: any) => c.id === activeConversationId);
      if (!found) {
        setActiveConversationId(null);
      }
    }
  }, [activeConversationId, conversations]);
  const createConversation = useCreateConversation();
  const sendMessage = useSendMessage();
  const {
    selectedSources, toggleSource, isSelected, clearSources,
    sourceSummary, sourceCount, serializeForAPI,
    availableProfiles, availableVideos, availableScripts,
  } = useKnowledgeSources();

  const isGenerating = sendMessage.isPending;

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  // Pre-select content script from Biblioteca redirect
  useEffect(() => {
    const scriptId = sessionStorage.getItem('prefill_content_script_id');
    const scriptTitle = sessionStorage.getItem('prefill_content_script_title');
    if (scriptId && scriptTitle) {
      sessionStorage.removeItem('prefill_content_script_id');
      sessionStorage.removeItem('prefill_content_script_title');
      toggleSource('content_script', scriptId, scriptTitle);
      toast.info(`"${scriptTitle}" anexado como contexto`);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleNewConversation = () => {
    setActiveConversationId(null);
    setPreviewMessage(null);
    setArtifactOpen(false);
    setSidebarOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setPreviewMessage(null);
    setArtifactOpen(false);
    setSidebarOpen(false);
  };

  const handleSend = async (text?: string) => {
    const content = text || message.trim();
    if (!content || isGenerating) return;

    if (sourceCount === 0) {
      toast.warning('💡 Dica: Selecione bases de conhecimento para gerar conteúdo personalizado');
    }

    if (!text) {
      setMessage("");
      adjustHeight(true);
    }

    try {
      const knowledgeSources = serializeForAPI();
      if (!activeConversationId) {
        const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');

        // Show user message immediately as optimistic
        setPendingUserMessage({
          id: `pending-${Date.now()}`,
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
        });

        const conversationId = await createConversation.mutateAsync({
          title,
          firstMessage: content,
          contentType: selectedContentType
        });

        // Wait for AI response
        await sendMessage.mutateAsync({ conversationId, content, knowledgeSources, contentType: selectedContentType, skipUserMessage: true });

        // Fetch all messages and seed cache
        const { data: freshMessages } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (freshMessages) {
          queryClient.setQueryData(['chat-messages', conversationId], freshMessages.map((msg: any) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: msg.created_at,
            metadata: msg.metadata
          })));
        }

        // Clear pending and set active conversation
        setPendingUserMessage(null);
        setActiveConversationId(conversationId);
      } else {
        await sendMessage.mutateAsync({ conversationId: activeConversationId, content, knowledgeSources, contentType: selectedContentType });
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      setPendingUserMessage(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: ptBR });
    } catch {
      return '';
    }
  };

  const handleOpenArtifact = (msg: Message) => {
    setPreviewMessage(msg);
    setArtifactOpen(true);
  };

  const handleCopyContent = () => {
    if (previewMessage) {
      navigator.clipboard.writeText(previewMessage.content);
      toast.success('Conteúdo copiado!');
    }
  };

  const handleGeneratePDF = () => {
    if (previewMessage) {
      generateChatMessagePDF(previewMessage, {
        profileName: sourceSummary || undefined,
        contentType: contentTypeLabels[selectedContentType],
        platform: 'Instagram'
      });
    }
  };

  const hasMessages = messages.length > 0;
  const displayMessages = (pendingUserMessage && !hasMessages)
    ? [pendingUserMessage]
    : messages;
  const hasDisplayMessages = displayMessages.length > 0;

  return (
    <TooltipProvider>
      <div className="fixed inset-0 top-[80px] flex flex-col bg-background">
        {/* Compact header */}
        <div className="h-12 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/5 transition-colors duration-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-muted-foreground">Criação com IA</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleNewConversation}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/5 transition-colors duration-200"
              >
                <PenSquare className="w-5 h-5" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Nova conversa</TooltipContent>
          </Tooltip>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Chat area */}
          <div
            className={cn(
              "flex-1 flex flex-col transition-all duration-300",
              artifactOpen && previewMessage ? "w-[55%]" : "w-full"
            )}
          >
            {/* Scrollable messages / empty state */}
            <div className="flex-1 overflow-y-auto" ref={scrollRef}>
              {!hasDisplayMessages ? (
                /* Empty state - centered */
                <div className="flex flex-col items-center justify-center h-full px-6">
                  <div className="max-w-[720px] mx-auto w-full flex flex-col items-center">
                    <h1 className="text-2xl font-medium text-foreground mb-6">
                      O que você quer criar?
                    </h1>
                    <div className="flex flex-wrap gap-2 justify-center max-w-[600px]">
                      {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(suggestion)}
                          className="rounded-full px-4 py-2 border border-border/50 text-sm text-muted-foreground hover:border-border hover:text-foreground transition-colors duration-150"
                          style={{ animationDelay: `${idx * 50}ms` }}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Messages */
                <div className="max-w-[720px] mx-auto w-full px-6 py-6 space-y-6">
                  {displayMessages.map((msg: Message, idx: number) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex animate-fade-in",
                        msg.role === 'user' ? "justify-end" : "justify-start gap-3"
                      )}
                      style={{ animationDelay: `${idx * 30}ms` }}
                    >
                      {/* AI dot */}
                      {msg.role === 'assistant' && (
                        <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                      )}

                      {msg.role === 'user' ? (
                        /* User message */
                        <div className="max-w-[85%] bg-zinc-800 rounded-2xl px-4 py-3">
                          <p className="text-sm leading-relaxed text-zinc-100 whitespace-pre-wrap">
                            {msg.content}
                          </p>
                          <span className="text-xs text-zinc-500 mt-1.5 block">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                      ) : (
                        /* AI message */
                        <div className="max-w-[85%] flex flex-col">
                          {/* Conversational text */}
                          {msg.metadata?.is_deliverable && msg.metadata?.chat_message ? (
                            <div className="text-sm leading-relaxed text-zinc-200">
                              {renderFormattedContent(msg.metadata.chat_message)}
                            </div>
                          ) : !msg.metadata?.is_deliverable ? (
                            <div className="text-sm leading-relaxed text-zinc-200">
                              {renderFormattedContent(msg.content)}
                            </div>
                          ) : null}

                          {/* Content card - only for deliverables */}
                          {msg.metadata?.is_deliverable && (
                            <div className="border-l-2 border-emerald-500 bg-zinc-900/50 pl-4 py-3 rounded-r-lg mt-3">
                              <div className="flex items-center gap-2 mb-1">
                                <FileText className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm font-medium text-foreground">
                                  {contentTypeLabels[selectedContentType] || 'Conteúdo Gerado'}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {(msg.metadata?.deliverable_content || msg.content).slice(0, 120)}...
                              </p>
                              <button
                                onClick={() => handleOpenArtifact(msg)}
                                className="text-xs text-emerald-500 hover:text-emerald-400 mt-2 transition-colors duration-150"
                              >
                                Abrir →
                              </button>
                            </div>
                          )}

                          <span className="text-xs text-zinc-500 mt-2 block">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {(isGenerating || pendingUserMessage) && (
                    <div className="flex gap-3 justify-start animate-fade-in">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                      <div className="flex gap-1 py-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input area - fixed bottom */}
            <div className="flex-shrink-0 px-6 pb-4 pt-2">
              <div className="max-w-[720px] mx-auto w-full">
                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
                  <textarea
                    ref={textareaRef}
                    placeholder="Descreva o que você quer criar..."
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      adjustHeight();
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={isGenerating}
                    className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 resize-none outline-none min-h-[24px] max-h-[150px]"
                    rows={1}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <ChatGenerationSettings
                      selectedSources={selectedSources}
                      onToggleSource={toggleSource}
                      isSourceSelected={isSelected}
                      sourceCount={sourceCount}
                      availableProfiles={availableProfiles}
                      availableVideos={availableVideos}
                      availableScripts={(availableScripts as any) || []}
                      selectedContentType={selectedContentType}
                      onContentTypeChange={setSelectedContentType}
                    />
                    {message.trim() && (
                      <button
                        onClick={() => handleSend()}
                        disabled={isGenerating}
                        className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center transition-colors duration-200 disabled:opacity-50"
                      >
                        <ArrowUp className="w-4 h-4 text-white" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-zinc-600 text-center mt-2">
                  IA gera conteúdo baseado no perfil selecionado
                </p>
              </div>
            </div>
          </div>

          {/* Artifact panel (right side) */}
          {artifactOpen && previewMessage && (
            <div className="w-[45%] border-l border-border/30 flex flex-col bg-background animate-slide-in-right">
              {/* Artifact header */}
              <div className="h-12 flex items-center justify-between px-4 border-b border-border/30 flex-shrink-0">
                <h3 className="text-sm font-medium text-foreground truncate">
                  {contentTypeLabels[selectedContentType] || 'Conteúdo Gerado'}
                </h3>
                <div className="flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={handleCopyContent}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/5 transition-colors duration-200"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Copiar</TooltipContent>
                  </Tooltip>
                  <button
                    onClick={() => { setArtifactOpen(false); setPreviewMessage(null); }}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent/5 transition-colors duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Artifact metadata */}
              <div className="px-6 pt-4 pb-2 flex-shrink-0">
                <p className="text-xs text-muted-foreground">
                  {format(new Date(previewMessage.timestamp), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
                </p>
                {sourceSummary && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Baseado em @{sourceSummary}
                  </p>
                )}
              </div>

              {/* Artifact content */}
              <ScrollArea className="flex-1">
                <div className="px-6 py-4">
                  {renderFormattedContent(previewMessage.content)}
                </div>
              </ScrollArea>

              {/* Artifact footer */}
              <div className="p-4 border-t border-border/30 flex gap-2 flex-shrink-0">
                <button
                  onClick={handleCopyContent}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/5 border border-border/30 transition-colors duration-200"
                >
                  <Copy className="w-4 h-4" />
                  Copiar
                </button>
                <button
                  onClick={() => setSaveDialogOpen(true)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/5 border border-border/30 transition-colors duration-200"
                >
                  <FolderPlus className="w-4 h-4" />
                  Salvar
                </button>
                <button
                  onClick={handleGeneratePDF}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/5 border border-border/30 transition-colors duration-200"
                >
                  <FileDown className="w-4 h-4" />
                  PDF
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Sheet (left) */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-[300px] bg-background p-0 border-r border-border/30">
            <SheetHeader className="p-4 border-b border-border/30">
              <SheetTitle className="text-sm font-medium text-foreground">Conversas</SheetTitle>
            </SheetHeader>
            <div className="p-2">
              <button
                onClick={handleNewConversation}
                className="w-full flex items-center gap-2 py-2.5 px-3 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/5 transition-colors duration-200"
              >
                <Plus className="w-4 h-4" />
                Nova Conversa
              </button>
            </div>
            <ScrollArea className="flex-1 h-[calc(100vh-140px)]">
              <div className="px-2 py-1">
                {conversations.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-3 py-6 text-center">
                    Nenhuma conversa ainda.
                  </p>
                ) : (
                  conversations.map((conv: any) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={cn(
                        "w-full text-left py-3 px-3 rounded-lg text-sm transition-colors duration-200",
                        activeConversationId === conv.id
                          ? "text-foreground bg-accent/5"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent/5"
                      )}
                    >
                      <p className="truncate font-medium">{conv.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatTime(conv.updated_at || conv.created_at)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Save dialog */}
        {previewMessage && (
          <SaveToFolderDialog
            open={saveDialogOpen}
            onClose={() => setSaveDialogOpen(false)}
            message={previewMessage}
            contentType={selectedContentType}
            metadata={{
              profileName: sourceSummary || undefined,
              contentType: contentTypeLabels[selectedContentType],
              platform: 'Instagram'
            }}
          />
        )}
      </div>
    </TooltipProvider>
  );
};

export default SocialCriacao;

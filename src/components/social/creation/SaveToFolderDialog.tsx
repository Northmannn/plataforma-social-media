import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, FolderPlus, Check } from "lucide-react";
import { useContentFolders } from "@/hooks/useContentFolders";
import { useContentScripts } from "@/hooks/useContentScripts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface SaveToFolderDialogProps {
  open: boolean;
  onClose: () => void;
  message: Message;
  contentType: 'video' | 'post' | 'idea';
  metadata?: {
    profileName?: string;
    contentType?: string;
    platform?: string;
  };
}

const contentTypeLabels: Record<string, string> = {
  video: 'Roteiro de Vídeo',
  post: 'Legenda para Post',
  idea: 'Ideia de Conteúdo',
};

export const SaveToFolderDialog = ({ open, onClose, message, contentType, metadata }: SaveToFolderDialogProps) => {
  const defaultTitle = `${contentTypeLabels[contentType]} - ${new Date(message.timestamp).toLocaleDateString('pt-BR')}`;
  const [title, setTitle] = useState(defaultTitle);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { folders, createFolder } = useContentFolders();
  const { addScript } = useContentScripts();
  const { session } = useAuth();
  const userId = session?.user?.id;

  const customFolders = folders.filter(f => f.folder_type === 'custom');

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const result = await createFolder.mutateAsync({
        name: newFolderName.trim(),
        color: 'indigo',
        icon: 'folder',
        folder_type: 'custom',
        parent_id: null,
        platform_name: null,
        description: null,
        order_index: 0,
      });
      setSelectedFolderId(result.id);
      setNewFolderName('');
      setIsCreatingFolder(false);
    } catch {}
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {

      const script = await addScript.mutateAsync({
        title,
        type: contentType,
        content: message.content,
        platform: 'instagram',
        metadata: {
          messageId: message.id,
          profileName: metadata?.profileName,
        },
      });

      if (selectedFolderId) {
        await supabase.from('folder_contents').insert({
          folder_id: selectedFolderId,
          content_type: 'content_script',
          content_id: script.id,
          user_id: userId,
        });
        toast.success('Conteúdo salvo na pasta!');
      } else {
        toast.success('Conteúdo salvo na biblioteca! Use auto-organizar para classificá-lo.');
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5" style={{ color: 'hsl(var(--primary))' }} />
            Salvar nas Bases
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Título</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nome do conteúdo"
            />
          </div>

          <p className="text-sm text-muted-foreground">Escolha uma pasta ou salve sem pasta para organizar depois:</p>

          <ScrollArea className="max-h-[200px]">
            <div className="space-y-1">
              {customFolders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolderId(folder.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors"
                  style={{
                    background: selectedFolderId === folder.id
                      ? 'hsl(var(--primary) / 0.15)'
                      : 'transparent',
                  }}
                >
                  <Folder className="w-4 h-4 flex-shrink-0" style={{ color: folder.color }} />
                  <span className="text-sm flex-1 truncate">{folder.name}</span>
                  {selectedFolderId === folder.id && (
                    <Check className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
                  )}
                </button>
              ))}
              {customFolders.length === 0 && !isCreatingFolder && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhuma pasta personalizada encontrada
                </p>
              )}
            </div>
          </ScrollArea>

          {isCreatingFolder ? (
            <div className="flex gap-2">
              <Input
                placeholder="Nome da pasta"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                autoFocus
              />
              <Button size="sm" onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
                Criar
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => setIsCreatingFolder(true)}
            >
              <FolderPlus className="w-4 h-4" />
              Nova pasta
            </Button>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          {!selectedFolderId ? (
            <Button onClick={handleSave} variant="secondary" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar sem pasta'}
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar na pasta'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

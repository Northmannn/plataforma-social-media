import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Edit, Trash2, FolderPlus, Palette } from "lucide-react";
import { ContentFolder } from "@/hooks/useContentFolders";

interface FolderContextMenuProps {
  folder: ContentFolder;
  children: React.ReactNode;
  onRename: () => void;
  onChangeColor: () => void;
  onCreateSubfolder: () => void;
  onDelete: () => void;
}

export const FolderContextMenu = ({
  folder,
  children,
  onRename,
  onChangeColor,
  onCreateSubfolder,
  onDelete
}: FolderContextMenuProps) => {
  const isPlatformFolder = folder.folder_type === 'platform';

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {!isPlatformFolder && (
          <>
            <ContextMenuItem onClick={onRename} className="gap-2">
              <Edit className="w-4 h-4" />
              Renomear
            </ContextMenuItem>
            <ContextMenuItem onClick={onChangeColor} className="gap-2">
              <Palette className="w-4 h-4" />
              Mudar Cor
            </ContextMenuItem>
          </>
        )}
        <ContextMenuItem onClick={onCreateSubfolder} className="gap-2">
          <FolderPlus className="w-4 h-4" />
          Criar Subpasta
        </ContextMenuItem>
        {!isPlatformFolder && (
          <ContextMenuItem onClick={onDelete} className="gap-2 text-destructive">
            <Trash2 className="w-4 h-4" />
            Deletar Pasta
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useContentFolders, ContentFolder } from "@/hooks/useContentFolders";
import { useUnfiledScripts } from "@/hooks/useUnfiledScripts";
import { CreateFolderDialog } from "@/components/bases/CreateFolderDialog";
import { DeleteFolderDialog } from "@/components/bases/DeleteFolderDialog";
import { FolderContextMenu } from "@/components/bases/FolderContextMenu";
import { FolderBreadcrumb } from "@/components/bases/FolderBreadcrumb";
import { FolderView } from "@/components/bases/FolderView";
import { ContentScriptDialog } from "@/components/bases/ContentScriptDialog";
import { Plus, ArrowLeft, Folder, ChevronRight, FileText } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const SocialBases = () => {
  const queryClient = useQueryClient();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<ContentFolder[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<ContentFolder | null>(null);
  
  const [selectedScript, setSelectedScript] = useState<any>(null);

  const { folders, isLoading, deleteFolder } = useContentFolders(currentFolderId);
  const { data: unfiledScripts = [] } = useUnfiledScripts();

  const handleFolderClick = (folder: ContentFolder) => {
    setCurrentFolderId(folder.id);
    setFolderPath([...folderPath, folder]);
  };

  const handleBreadcrumbNavigate = (index: number) => {
    if (index === -1) {
      setCurrentFolderId(null);
      setFolderPath([]);
    } else {
      const targetFolder = folderPath[index];
      setCurrentFolderId(targetFolder.id);
      setFolderPath(folderPath.slice(0, index + 1));
    }
  };


  const handleBack = () => {
    if (folderPath.length > 0) {
      const newPath = [...folderPath];
      newPath.pop();
      setFolderPath(newPath);
      setCurrentFolderId(newPath.length > 0 ? newPath[newPath.length - 1].id : null);
    }
  };

  const handleDeleteFolder = (folder: ContentFolder) => {
    setFolderToDelete(folder);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (folderToDelete) {
      deleteFolder.mutate(folderToDelete.id, {
        onSuccess: () => {
          toast.success(`Pasta "${folderToDelete.name}" excluída com sucesso!`);
          setDeleteDialogOpen(false);
          setFolderToDelete(null);
        },
        onError: (error: any) => {
          toast.error(`Erro ao excluir pasta: ${error.message}`);
        }
      });
    }
  };

  return (
    <Layout>
      <div className="min-h-screen pt-28 px-8 pb-16">
        <div className="max-w-[1100px] mx-auto">
          {/* Header */}
          {folderPath.length > 0 ? (
            <div className="mb-8">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <FolderBreadcrumb
                folderPath={folderPath}
                onNavigate={handleBreadcrumbNavigate}
              />
            </div>
          ) : (
            <div className="mb-10">
              <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">
                Biblioteca
              </h1>
              <p className="text-base text-muted-foreground">
                Organize seus conteúdos em pastas
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Pasta
            </button>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Carregando pastas...
            </div>
          ) : currentFolderId ? (
            <div className="space-y-10">
              {/* Subfolders */}
              {folders.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
                    Subpastas
                  </p>
                  <div>
                    {folders.map((folder) => (
                      <FolderContextMenu
                        key={folder.id}
                        folder={folder}
                        onRename={() => {}}
                        onChangeColor={() => {}}
                        onCreateSubfolder={() => {
                          setCurrentFolderId(folder.id);
                          setShowCreateDialog(true);
                        }}
                        onDelete={() => handleDeleteFolder(folder)}
                      >
                        <div
                          className="group flex items-center gap-3 py-4 px-3 -mx-3 rounded-lg hover:bg-accent/5 cursor-pointer transition-colors duration-200 border-b border-border/20"
                          onClick={() => handleFolderClick(folder)}
                        >
                          <Folder className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">{folder.name}</span>
                          <span className="text-sm text-muted-foreground ml-auto">
                            {folder.content_count || 0} itens
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </FolderContextMenu>
                    ))}
                  </div>
                </div>
              )}

              {/* Folder contents */}
              <FolderView folderId={currentFolderId} />
            </div>
          ) : folders.length > 0 ? (
            <div>
              {folders.map((folder) => (
                <FolderContextMenu
                  key={folder.id}
                  folder={folder}
                  onRename={() => {}}
                  onChangeColor={() => {}}
                  onCreateSubfolder={() => {
                    setCurrentFolderId(folder.id);
                    setShowCreateDialog(true);
                  }}
                  onDelete={() => handleDeleteFolder(folder)}
                >
                  <div
                    className="group flex items-center gap-3 py-4 px-3 -mx-3 rounded-lg hover:bg-accent/5 cursor-pointer transition-colors duration-200 border-b border-border/20"
                    onClick={() => handleFolderClick(folder)}
                  >
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{folder.name}</span>
                    <span className="text-sm text-muted-foreground ml-auto">
                      {folder.content_count || 0} itens
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </FolderContextMenu>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-sm text-muted-foreground mb-1">
                Nenhuma pasta criada
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                Crie pastas para organizar ou use auto-organização
              </p>
              <button
                onClick={() => setShowCreateDialog(true)}
                className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
              >
                Criar primeira pasta
              </button>
            </div>
          )}

          {/* Unfiled content scripts */}
          {!currentFolderId && unfiledScripts.length > 0 && (
            <div className="mt-10">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-3">
                Sem pasta ({unfiledScripts.length})
              </p>
              {unfiledScripts.map((script) => (
                <div
                  key={script.id}
                  className="group flex items-center gap-3 py-4 px-3 -mx-3 rounded-lg hover:bg-accent/5 cursor-pointer transition-colors duration-200 border-b border-border/20"
                  onClick={() => setSelectedScript(script)}
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{script.title}</span>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {[script.type, script.platform].filter(Boolean).join(' · ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateFolderDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        parentId={currentFolderId}
      />
      
      <DeleteFolderDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        folderName={folderToDelete?.name || ''}
        itemCount={folderToDelete?.content_count || 0}
        onConfirm={confirmDelete}
        isDeleting={deleteFolder.isPending}
      />

      <ContentScriptDialog
        open={!!selectedScript}
        onOpenChange={(open) => !open && setSelectedScript(null)}
        script={selectedScript}
      />
    </Layout>
  );
};

export default SocialBases;

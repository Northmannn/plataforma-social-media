import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderName: string;
  itemCount: number;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const DeleteFolderDialog = ({
  open,
  onOpenChange,
  folderName,
  itemCount,
  onConfirm,
  isDeleting
}: DeleteFolderDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="backdrop-blur-xl bg-background/95 border-2 border-destructive/20">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-destructive/10">
              <Trash2 className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">
              Excluir Pasta?
            </AlertDialogTitle>
          </div>
          
          <AlertDialogDescription className="text-base space-y-3">
            <p>
              Você está prestes a excluir a pasta <strong className="text-foreground">"{folderName}"</strong>.
            </p>
            
            {itemCount > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-destructive">
                    Esta pasta contém {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                  </p>
                  <p className="text-sm mt-1">
                    Os conteúdos permanecerão salvos, mas serão removidos desta pasta.
                  </p>
                </div>
              </div>
            )}
            
            <p className="text-sm">
              Esta ação não pode ser desfeita.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Pasta
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

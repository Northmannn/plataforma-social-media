import { ChevronRight, Home } from "lucide-react";
import { ContentFolder } from "@/hooks/useContentFolders";

interface FolderBreadcrumbProps {
  folderPath: ContentFolder[];
  onNavigate: (index: number) => void;
}

export const FolderBreadcrumb = ({ folderPath, onNavigate }: FolderBreadcrumbProps) => {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
      <button
        onClick={() => onNavigate(-1)}
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="w-4 h-4" />
        Todas as Pastas
      </button>

      {folderPath.map((folder, index) => (
        <div key={folder.id} className="flex items-center gap-2">
          <ChevronRight className="w-4 h-4" />
          <button
            onClick={() => onNavigate(index)}
            className={`hover:text-foreground transition-colors ${
              index === folderPath.length - 1 ? 'text-foreground font-medium' : ''
            }`}
          >
            {folder.name}
          </button>
        </div>
      ))}
    </div>
  );
};

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Database } from "lucide-react";
import { ProfileContentBase } from "@/components/social/analysis/ProfileContentBase";

interface ContentBaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentBase: {
    profile_id?: string;
    posts_analyzed_count?: number;
    analysis_summary?: any;
    total_engagement?: number;
  } | null;
  username: string;
}

export const ContentBaseDialog = ({ open, onOpenChange, contentBase, username }: ContentBaseDialogProps) => {
  if (!contentBase || !contentBase.profile_id) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Base de Conhecimento - @{username}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <ProfileContentBase 
            profileId={contentBase.profile_id} 
            username={username}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Instagram, Check, ExternalLink, Users, Image as ImageIcon, UserPlus } from "lucide-react";

interface InstagramProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    username?: string;
    display_name?: string;
    bio?: string;
    profile_picture_url?: string;
    follower_count?: number;
    following_count?: number;
    post_count?: number;
    category?: string;
    is_verified?: boolean;
    notes?: string;
  } | null;
}

export const InstagramProfileDialog = ({ open, onOpenChange, profile }: InstagramProfileDialogProps) => {
  if (!profile) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-pink-500" />
            @{profile.username}
            {profile.is_verified && (
              <Badge variant="secondary" className="ml-2">
                <Check className="h-3 w-3 mr-1" />
                Verificado
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Foto de Perfil e Info */}
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24 border-2">
              <AvatarImage src={profile.profile_picture_url} />
              <AvatarFallback className="text-2xl">
                {profile.username?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 space-y-2">
              <h3 className="text-xl font-semibold">{profile.display_name || profile.username}</h3>
              {profile.category && (
                <Badge variant="outline">{profile.category}</Badge>
              )}
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <ImageIcon className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{profile.post_count?.toLocaleString('pt-BR') || 0}</p>
                <p className="text-sm text-muted-foreground">Posts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{profile.follower_count?.toLocaleString('pt-BR') || 0}</p>
                <p className="text-sm text-muted-foreground">Seguidores</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <UserPlus className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold">{profile.following_count?.toLocaleString('pt-BR') || 0}</p>
                <p className="text-sm text-muted-foreground">Seguindo</p>
              </CardContent>
            </Card>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground">Bio</h3>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
              </div>
            </div>
          )}

          {/* Notas */}
          {profile.notes && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground">Notas</h3>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{profile.notes}</p>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" asChild>
              <a 
                href={`https://instagram.com/${profile.username}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir no Instagram
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

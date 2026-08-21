import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Image as ImageIcon, UserCheck, Clock } from "lucide-react";
import { InstagramProfile } from "@/hooks/useInstagramProfiles";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProfileHeaderProps {
  profile: InstagramProfile;
  lastSyncedAt?: string | null;
}

export const ProfileHeader = ({ profile, lastSyncedAt }: ProfileHeaderProps) => {
  const formatNumber = (num: number | null) => {
    if (!num) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.profile_picture_url || ""} />
            <AvatarFallback className="text-2xl">
              {profile.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">@{profile.username}</h1>
                {profile.is_verified && (
                  <Badge variant="secondary" className="h-6 px-2">✓</Badge>
                )}
              </div>
              {profile.display_name && (
                <p className="text-lg text-muted-foreground">{profile.display_name}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-6">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{formatNumber(profile.follower_count)}</span>
                <span className="text-sm text-muted-foreground">seguidores</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{formatNumber(profile.following_count)}</span>
                <span className="text-sm text-muted-foreground">seguindo</span>
              </div>
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{formatNumber(profile.post_count)}</span>
                <span className="text-sm text-muted-foreground">posts</span>
              </div>
            </div>

            {profile.bio && (
              <p className="text-sm whitespace-pre-wrap">{profile.bio}</p>
            )}

            {profile.tags && profile.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {profile.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {lastSyncedAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  Última atualização: {formatDistanceToNow(new Date(lastSyncedAt), { 
                    addSuffix: true,
                    locale: ptBR 
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

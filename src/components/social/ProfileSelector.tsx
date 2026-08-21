import { useInstagramProfiles } from "@/hooks/useInstagramProfiles";
import { useProfileContentBase } from "@/hooks/useProfileContentBase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

interface ProfileSelectorProps {
  value: string | null;
  onChange: (value: string) => void;
}

export const ProfileSelector = ({ value, onChange }: ProfileSelectorProps) => {
  const { profiles, isLoading } = useInstagramProfiles();
  const { data: contentBase } = useProfileContentBase(value);

  const getStatusBadge = () => {
    if (!value) return null;
    
    if (!contentBase) {
      return (
        <Badge variant="outline" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Sem base de conhecimento
        </Badge>
      );
    }

    const daysSinceAnalysis = Math.floor(
      (Date.now() - new Date(contentBase.analysis_date).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceAnalysis === 0) {
      return (
        <Badge className="gap-1 bg-green-500/10 text-green-500 border-green-500/20">
          <Sparkles className="h-3 w-3" />
          Base disponível (hoje)
        </Badge>
      );
    } else if (daysSinceAnalysis <= 3) {
      return (
        <Badge className="gap-1 bg-green-500/10 text-green-500 border-green-500/20">
          <Sparkles className="h-3 w-3" />
          Base disponível ({daysSinceAnalysis}d atrás)
        </Badge>
      );
    } else if (daysSinceAnalysis <= 7) {
      return (
        <Badge variant="outline" className="gap-1">
          <Sparkles className="h-3 w-3" />
          Base disponível ({daysSinceAnalysis}d atrás)
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="gap-1 text-orange-500">
          <AlertCircle className="h-3 w-3" />
          Base desatualizada ({daysSinceAnalysis}d atrás)
        </Badge>
      );
    }
  };

  const selectedProfile = profiles.find(p => p.id === value);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">
            Perfil base para geração
          </label>
          <Select value={value || ""} onValueChange={onChange} disabled={isLoading}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um perfil..." />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((profile) => (
                <SelectItem key={profile.id} value={profile.id}>
                  @{profile.username}
                  {profile.display_name && ` - ${profile.display_name}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {value && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {contentBase && (
              <span className="text-xs text-muted-foreground">
                {contentBase.posts_analyzed_count} posts analisados
              </span>
            )}
          </div>
          
          {!contentBase && selectedProfile && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/social/analise/${selectedProfile.username}`}>
                Criar Base
              </Link>
            </Button>
          )}
        </div>
      )}

      {value && contentBase && (
        <p className="text-xs text-muted-foreground">
          💡 A IA vai criar conteúdo baseado na análise de {contentBase.posts_analyzed_count} posts deste perfil
        </p>
      )}
    </div>
  );
};

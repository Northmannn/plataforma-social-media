import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Paperclip, Sparkles, AlertCircle, Video, FileText, Lightbulb, Instagram, Youtube, ChevronDown, Search, BookOpen } from "lucide-react";
import { useProfileContentBase } from "@/hooks/useProfileContentBase";
import { cn } from "@/lib/utils";
import { KnowledgeSource } from "@/types/knowledge-sources";

interface ChatGenerationSettingsProps {
  selectedSources: KnowledgeSource[];
  onToggleSource: (type: KnowledgeSource['type'], id: string, label: string) => void;
  isSourceSelected: (type: KnowledgeSource['type'], id: string) => boolean;
  sourceCount: number;
  availableProfiles: any[];
  availableVideos: any[];
  availableScripts: any[];
  selectedContentType: 'video' | 'post' | 'idea';
  onContentTypeChange: (type: 'video' | 'post' | 'idea') => void;
}

export const ChatGenerationSettings = ({
  selectedSources,
  onToggleSource,
  isSourceSelected,
  sourceCount,
  availableProfiles,
  availableVideos,
  availableScripts,
  selectedContentType,
  onContentTypeChange,
}: ChatGenerationSettingsProps) => {
  const [profileSearch, setProfileSearch] = useState("");
  const [videoSearch, setVideoSearch] = useState("");
  const [scriptSearch, setScriptSearch] = useState("");
  const [profilesOpen, setProfilesOpen] = useState(true);
  const [videosOpen, setVideosOpen] = useState(true);
  const [scriptsOpen, setScriptsOpen] = useState(true);

  const contentTypeOptions = [
    { value: 'video' as const, label: 'Roteiro de Vídeo', icon: Video },
    { value: 'post' as const, label: 'Legenda de Post', icon: FileText },
    { value: 'idea' as const, label: 'Ideia de Conteúdo', icon: Lightbulb },
  ];

  const analyzedVideos = availableVideos.filter((v: any) => v.ai_analysis);

  const filteredProfiles = availableProfiles.filter((p: any) => {
    if (!profileSearch.trim()) return true;
    const q = profileSearch.toLowerCase();
    return p.username?.toLowerCase().includes(q) || p.display_name?.toLowerCase().includes(q);
  });

  const filteredVideos = analyzedVideos.filter((v: any) => {
    if (!videoSearch.trim()) return true;
    const q = videoSearch.toLowerCase();
    return v.title?.toLowerCase().includes(q) || v.channel_name?.toLowerCase().includes(q) || v.video_id?.toLowerCase().includes(q);
  });

  const selectedProfileCount = selectedSources.filter(s => s.type === 'instagram_profile').length;
  const selectedVideoCount = selectedSources.filter(s => s.type === 'youtube_video').length;
  const selectedScriptCount = selectedSources.filter(s => s.type === 'content_script').length;

  const filteredScripts = (availableScripts || []).filter((s: any) => {
    if (!scriptSearch.trim()) return true;
    const q = scriptSearch.toLowerCase();
    return s.title?.toLowerCase().includes(q) || s.content?.toLowerCase().includes(q);
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground relative"
        >
          <Paperclip className="w-4 h-4" />
          {sourceCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
              {sourceCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[420px] p-4 space-y-4 max-h-[500px] overflow-y-auto"
        align="start"
        side="top"
      >
        <div className="space-y-1">
          <h4 className="font-medium text-sm">⚙️ Configurações de Geração</h4>
          <p className="text-xs text-muted-foreground">
            Selecione as bases de conhecimento e o tipo de conteúdo
          </p>
        </div>

        {/* Tipo de Conteúdo */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo de conteúdo</label>
          <div className="grid grid-cols-3 gap-2">
            {contentTypeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.value}
                  onClick={() => onContentTypeChange(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                    selectedContentType === option.value
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium text-center">
                    {option.label.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Perfis Instagram */}
        <SourceSection
          icon={<Instagram className="w-4 h-4 text-pink-500" />}
          title="Perfis Instagram"
          selectedCount={selectedProfileCount}
          totalCount={availableProfiles.length}
          isOpen={profilesOpen}
          onToggle={() => setProfilesOpen(!profilesOpen)}
          searchValue={profileSearch}
          onSearchChange={setProfileSearch}
          searchPlaceholder="Buscar perfil..."
          emptyMessage={availableProfiles.length === 0 ? "Nenhum perfil adicionado" : "Nenhum resultado"}
          showSearch={availableProfiles.length > 0}
          isEmpty={filteredProfiles.length === 0}
        >
          {filteredProfiles.map((profile: any) => (
            <ProfileSourceItem
              key={profile.id}
              profile={profile}
              isSelected={isSourceSelected('instagram_profile', profile.id)}
              onToggle={() => onToggleSource('instagram_profile', profile.id, `@${profile.username}`)}
            />
          ))}
        </SourceSection>

        {/* Vídeos YouTube */}
        <SourceSection
          icon={<Youtube className="w-4 h-4 text-red-500" />}
          title="Vídeos YouTube"
          selectedCount={selectedVideoCount}
          totalCount={analyzedVideos.length}
          isOpen={videosOpen}
          onToggle={() => setVideosOpen(!videosOpen)}
          searchValue={videoSearch}
          onSearchChange={setVideoSearch}
          searchPlaceholder="Buscar vídeo..."
          emptyMessage={
            availableVideos.length === 0
              ? 'Nenhum vídeo adicionado'
              : analyzedVideos.length === 0
                ? 'Nenhum vídeo analisado'
                : 'Nenhum resultado'
          }
          showSearch={analyzedVideos.length > 0}
          isEmpty={filteredVideos.length === 0}
        >
          {filteredVideos.map((video: any) => (
            <VideoSourceItem
              key={video.id}
              video={video}
              isSelected={isSourceSelected('youtube_video', video.id)}
              onToggle={() => onToggleSource('youtube_video', video.id, video.title || video.video_id)}
            />
          ))}
        </SourceSection>

        {/* Conteúdos Salvos */}
        <SourceSection
          icon={<BookOpen className="w-4 h-4 text-emerald-500" />}
          title="Conteúdos Salvos"
          selectedCount={selectedScriptCount}
          totalCount={availableScripts?.length || 0}
          isOpen={scriptsOpen}
          onToggle={() => setScriptsOpen(!scriptsOpen)}
          searchValue={scriptSearch}
          onSearchChange={setScriptSearch}
          searchPlaceholder="Buscar conteúdo..."
          emptyMessage={
            (availableScripts?.length || 0) === 0
              ? 'Nenhum conteúdo salvo'
              : 'Nenhum resultado'
          }
          showSearch={(availableScripts?.length || 0) > 0}
          isEmpty={filteredScripts.length === 0}
        >
          {filteredScripts.map((script: any) => (
            <ScriptSourceItem
              key={script.id}
              script={script}
              isSelected={isSourceSelected('content_script', script.id)}
              onToggle={() => onToggleSource('content_script', script.id, script.title || 'Conteúdo')}
            />
          ))}
        </SourceSection>

        {/* Info */}
        <div className="p-3 rounded-lg bg-muted/30 border">
          <p className="text-xs text-muted-foreground">
            {sourceCount === 0
              ? '⚠️ Nenhuma base selecionada — a IA vai gerar conteúdo genérico'
              : `✅ ${sourceCount} fonte${sourceCount > 1 ? 's' : ''} selecionada${sourceCount > 1 ? 's' : ''} — a IA vai combinar todas como contexto`}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// --- Collapsible Source Section ---

interface SourceSectionProps {
  icon: React.ReactNode;
  title: string;
  selectedCount: number;
  totalCount: number;
  isOpen: boolean;
  onToggle: () => void;
  searchValue: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder: string;
  emptyMessage: string;
  showSearch: boolean;
  isEmpty: boolean;
  children: React.ReactNode;
}

function SourceSection({
  icon, title, selectedCount, totalCount, isOpen, onToggle,
  searchValue, onSearchChange, searchPlaceholder, emptyMessage,
  showSearch, isEmpty, children,
}: SourceSectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <button className="w-full flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-medium">{title}</span>
            {selectedCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                {selectedCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{totalCount}</span>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )} />
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-1.5 pt-1">
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 pl-8 text-xs"
            />
          </div>
        )}
        {totalCount === 0 || isEmpty ? (
          <p className="text-xs text-muted-foreground p-2 text-center">{emptyMessage}</p>
        ) : (
          <div className="space-y-0.5 max-h-[160px] overflow-y-auto pr-1">
            {children}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

// --- Item Components ---

function ProfileSourceItem({ profile, isSelected, onToggle }: { profile: any; isSelected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-3 p-2 rounded-lg border transition-all text-left",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-transparent hover:bg-muted/50"
      )}
    >
      <Checkbox checked={isSelected} className="pointer-events-none" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">@{profile.username}</p>
        {profile.display_name && (
          <p className="text-xs text-muted-foreground truncate">{profile.display_name}</p>
        )}
      </div>
      <KBStatusBadge profileId={profile.id} />
    </button>
  );
}

function VideoSourceItem({ video, isSelected, onToggle }: { video: any; isSelected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-3 p-2 rounded-lg border transition-all text-left",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-transparent hover:bg-muted/50"
      )}
    >
      <Checkbox checked={isSelected} className="pointer-events-none" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{video.title || video.video_id}</p>
        {video.channel_name && (
          <p className="text-xs text-muted-foreground truncate">{video.channel_name}</p>
        )}
      </div>
      <Badge variant="outline" className="gap-1 text-[10px] flex-shrink-0 bg-green-500/10 text-green-500 border-green-500/20">
        <Sparkles className="h-3 w-3" />
        Analisado
      </Badge>
    </button>
  );
}

const scriptTypeLabels: Record<string, string> = {
  video: 'Roteiro',
  post: 'Legenda',
  idea: 'Ideia',
};

function ScriptSourceItem({ script, isSelected, onToggle }: { script: any; isSelected: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center gap-3 p-2 rounded-lg border transition-all text-left",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-transparent hover:bg-muted/50"
      )}
    >
      <Checkbox checked={isSelected} className="pointer-events-none" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{script.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {scriptTypeLabels[script.type] || script.type}
          {script.platform ? ` · ${script.platform}` : ''}
        </p>
      </div>
      <Badge variant="outline" className="gap-1 text-[10px] flex-shrink-0 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
        <FileText className="h-3 w-3" />
        Salvo
      </Badge>
    </button>
  );
}


function KBStatusBadge({ profileId }: { profileId: string }) {
  const { data: contentBase } = useProfileContentBase(profileId, true);

  if (!contentBase) {
    return (
      <Badge variant="outline" className="gap-1 text-[10px] flex-shrink-0">
        <AlertCircle className="h-3 w-3" />
        Sem base
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 text-[10px] flex-shrink-0 bg-green-500/10 text-green-500 border-green-500/20">
      <Sparkles className="h-3 w-3" />
      {contentBase.posts_analyzed_count}p
    </Badge>
  );
}

import { useState, useCallback, useMemo } from "react";
import { KnowledgeSource, KnowledgeSourceType } from "@/types/knowledge-sources";
import { useInstagramProfiles } from "@/hooks/useInstagramProfiles";
import { useYouTubeVideos } from "@/hooks/useYouTubeVideos";
import { useProfileContentBase } from "@/hooks/useProfileContentBase";
import { useContentScripts } from "@/hooks/useContentScripts";

export const useKnowledgeSources = () => {
  const [selectedSources, setSelectedSources] = useState<KnowledgeSource[]>([]);
  const { profiles } = useInstagramProfiles();
  const { videos } = useYouTubeVideos();
  const { scripts } = useContentScripts();

  const addSource = useCallback((type: KnowledgeSourceType, id: string, label: string) => {
    setSelectedSources(prev => {
      if (prev.some(s => s.type === type && s.id === id)) return prev;
      return [...prev, { type, id, label }];
    });
  }, []);

  const removeSource = useCallback((type: KnowledgeSourceType, id: string) => {
    setSelectedSources(prev => prev.filter(s => !(s.type === type && s.id === id)));
  }, []);

  const toggleSource = useCallback((type: KnowledgeSourceType, id: string, label: string) => {
    setSelectedSources(prev => {
      const exists = prev.some(s => s.type === type && s.id === id);
      if (exists) return prev.filter(s => !(s.type === type && s.id === id));
      return [...prev, { type, id, label }];
    });
  }, []);

  const isSelected = useCallback((type: KnowledgeSourceType, id: string) => {
    return selectedSources.some(s => s.type === type && s.id === id);
  }, [selectedSources]);

  const clearSources = useCallback(() => {
    setSelectedSources([]);
  }, []);

  // Summary for display
  const sourceSummary = useMemo(() => {
    if (selectedSources.length === 0) return null;
    const igCount = selectedSources.filter(s => s.type === 'instagram_profile').length;
    const ytCount = selectedSources.filter(s => s.type === 'youtube_video').length;
    const csCount = selectedSources.filter(s => s.type === 'content_script').length;
    const parts: string[] = [];
    
    if (igCount === 1) {
      const src = selectedSources.find(s => s.type === 'instagram_profile');
      parts.push(src?.label || '1 perfil');
    } else if (igCount > 1) {
      parts.push(`${igCount} perfis`);
    }
    
    if (ytCount === 1) {
      const src = selectedSources.find(s => s.type === 'youtube_video');
      parts.push(src?.label || '1 vídeo');
    } else if (ytCount > 1) {
      parts.push(`${ytCount} vídeos`);
    }

    if (csCount === 1) {
      const src = selectedSources.find(s => s.type === 'content_script');
      parts.push(src?.label || '1 conteúdo');
    } else if (csCount > 1) {
      parts.push(`${csCount} conteúdos`);
    }
    
    return parts.join(' + ');
  }, [selectedSources]);

  // Serialize for sending to edge functions
  const serializeForAPI = useCallback(() => {
    return selectedSources.map(s => ({ type: s.type, id: s.id }));
  }, [selectedSources]);

  return {
    selectedSources,
    addSource,
    removeSource,
    toggleSource,
    isSelected,
    clearSources,
    sourceSummary,
    sourceCount: selectedSources.length,
    serializeForAPI,
    // Available data for selection UI
    availableProfiles: profiles,
    availableVideos: videos,
    availableScripts: scripts,
  };
};

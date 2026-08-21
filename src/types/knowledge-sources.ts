export type KnowledgeSourceType = 'instagram_profile' | 'youtube_video' | 'content_script';

export interface KnowledgeSource {
  type: KnowledgeSourceType;
  id: string;
  label: string;
  contextData?: any;
}

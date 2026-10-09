export const COMMUNITY_TAB_KEYS = ['posts', 'photos', 'videos', 'articles', 'files', 'pdf'] as const;
export type CommunityTabKey = (typeof COMMUNITY_TAB_KEYS)[number];

export interface CommunityTopTab {
  tab_key: CommunityTabKey;
  title: string;
  position: number;
  is_visible: boolean;
  version: number;
}

export interface CommunityTopTabConfig {
  items: CommunityTopTab[];
  configured: boolean;
}

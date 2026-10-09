import { COMMUNITY_TAB_KEYS, type CommunityTabKey, type CommunityTopTabConfig, type CommunityTopTab } from '../types/communityTopTab.types';

export interface DisplayTab extends CommunityTopTab {
  href: string;
}

const TAB_PATHS: Record<CommunityTabKey, string> = {
  posts: '', photos: '/fotos', videos: '/videos', articles: '/articulos', files: '/archivos', pdf: '/pdf',
};

export function buildCommunityTopTabs(
  slug: string, config: CommunityTopTabConfig, labels: Record<CommunityTabKey, string>, canManage: boolean,
): DisplayTab[] {
  const base = `/feed/comunidades/${encodeURIComponent(slug)}`;
  const byKey = new Map(config.items.map((tab) => [tab.tab_key, tab]));
  const keys = config.configured ? config.items.map((tab) => tab.tab_key) : [...COMMUNITY_TAB_KEYS];
  return keys.map((key, index) => ({
    tab_key: key, title: byKey.get(key)?.title ?? labels[key],
    position: byKey.get(key)?.position ?? index,
    is_visible: byKey.get(key)?.is_visible ?? true,
    version: byKey.get(key)?.version ?? 0,
    href: `${base}${TAB_PATHS[key]}`,
  })).filter((tab) => canManage || tab.is_visible)
    .sort((a, b) => a.position - b.position || COMMUNITY_TAB_KEYS.indexOf(a.tab_key) - COMMUNITY_TAB_KEYS.indexOf(b.tab_key));
}

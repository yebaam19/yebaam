import { describe, expect, it } from 'vitest';
import { buildCommunityTopTabs } from '@/features/communities/lib/community-top-tabs';
import type { CommunityTopTab } from '@/features/communities/types/communityTopTab.types';

const labels = {
  posts: 'Publicaciones', photos: 'Fotos', videos: 'Videos',
  articles: 'Artículos', files: 'Archivos', pdf: 'PDF',
};

describe('community content tabs', () => {
  it('keeps existing communities on the six visible default tabs', () => {
    const tabs = buildCommunityTopTabs('mi comunidad', { items: [], configured: false }, labels, false);
    expect(tabs.map((tab) => tab.title)).toEqual(Object.values(labels));
    expect(tabs[0].href).toBe('/feed/comunidades/mi%20comunidad');
    expect(tabs.every((tab) => tab.is_visible && tab.version === 0)).toBe(true);
  });

  it('applies saved order, title and visibility to visitors while managers see hidden tabs', () => {
    const saved: CommunityTopTab[] = [
      { tab_key: 'photos', title: 'Galería', position: 0, is_visible: true, version: 2 },
      { tab_key: 'posts', title: 'Publicaciones', position: 1, is_visible: false, version: 2 },
    ];
    const visitor = buildCommunityTopTabs('ejemplo', { items: saved, configured: true }, labels, false);
    expect(visitor[0].title).toBe('Galería');
    expect(visitor.some((tab) => tab.tab_key === 'posts')).toBe(false);
    const manager = buildCommunityTopTabs('ejemplo', { items: saved, configured: true }, labels, true);
    expect(manager[1]).toMatchObject({ tab_key: 'posts', is_visible: false });
  });

  it('does not resurrect hidden tabs when RLS omits their rows', () => {
    const visitor = buildCommunityTopTabs('ejemplo', {
      configured: true,
      items: [{ tab_key: 'photos', title: 'Galería', position: 1, is_visible: true, version: 2 }],
    }, labels, false);
    expect(visitor.map((tab) => tab.tab_key)).toEqual(['photos']);
    expect(buildCommunityTopTabs('ejemplo', { configured: true, items: [] }, labels, false)).toEqual([]);
  });
});

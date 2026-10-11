import { beforeEach, expect, it, vi } from 'vitest';
import { CommunityLibraryPage } from '@/features/communities/components/library/CommunityLibraryPage';

const mocks = vi.hoisted(() => ({
  community: vi.fn(), legacy: vi.fn(), assets: vi.fn(), folders: vi.fn(),
  folder: vi.fn(), capabilities: vi.fn(), tabs: vi.fn(),
}));
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NOT_FOUND'); } }));
vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key }));
vi.mock('@/features/communities/server/communities.server', () => ({
  getCommunityBySlug: mocks.community, getCommunityLegacyPosts: mocks.legacy,
}));
vi.mock('@/features/communities/server/community-plan.server', () => ({ getCommunityProfileCapabilities: mocks.capabilities }));
vi.mock('@/features/communities/server/community-top-tabs.server', () => ({ getCommunityTopTabs: mocks.tabs }));
vi.mock('@/features/communities/server/community-library.server', () => ({
  getLibraryAssets: mocks.assets, getAssetFolders: mocks.folders, getAssetFolder: mocks.folder,
}));
vi.mock('@/features/communities/components/CommunityTopTabs', () => ({ CommunityTopTabs: () => null }));
vi.mock('@/features/communities/components/library/LibraryWorkspace', () => ({ LibraryWorkspace: () => null }));
vi.mock('@/features/communities/components/CommunityPhotosPanel', () => ({ CommunityPhotosPanel: () => null }));
vi.mock('@/features/communities/components/CommunityVideosPanel', () => ({ CommunityVideosPanel: () => null }));

const communityId = '11111111-1111-4111-8111-111111111111';
beforeEach(() => {
  vi.resetAllMocks();
  mocks.community.mockResolvedValue({ id: communityId });
  mocks.assets.mockResolvedValue({ items: [], nextCursor: null });
  mocks.folders.mockResolvedValue({ items: [], nextCursor: null });
  mocks.capabilities.mockResolvedValue({ settings: false, content: false });
  mocks.tabs.mockResolvedValue([]);
  mocks.legacy.mockResolvedValue({ posts: [], nextCursor: null });
});

it('does not load publication history for a collapsed photo gallery', async () => {
  await CommunityLibraryPage({ slug: 'demo', kind: 'image', searchParams: {} });
  expect(mocks.legacy).not.toHaveBeenCalled();
});

it('loads the same paginated history when a reader opens it', async () => {
  await CommunityLibraryPage({ slug: 'demo', kind: 'image', searchParams: { legacyPage: 'recent' } });
  expect(mocks.legacy).toHaveBeenCalledWith(communityId, null, 'demo');
  const cursor = { createdAt: '2026-10-10T10:00:00Z', id: '22222222-2222-4222-8222-222222222222' };
  await CommunityLibraryPage({ slug: 'demo', kind: 'video', searchParams: { legacyCursor: JSON.stringify(cursor) } });
  expect(mocks.legacy).toHaveBeenLastCalledWith(communityId, cursor, 'demo');
});

it('never loads publication history for documents', async () => {
  await CommunityLibraryPage({ slug: 'demo', kind: 'document', searchParams: { legacyPage: 'recent' } });
  expect(mocks.legacy).not.toHaveBeenCalled();
});

it('preserves the library workspace for the same view and resets it for a different filter', async () => {
  const first = await CommunityLibraryPage({ slug: 'demo', kind: 'document', searchParams: {} });
  const again = await CommunityLibraryPage({ slug: 'demo', kind: 'document', searchParams: {} });
  const unfiled = await CommunityLibraryPage({ slug: 'demo', kind: 'document', searchParams: { carpeta: 'none' } });
  const searched = await CommunityLibraryPage({ slug: 'demo', kind: 'document', searchParams: { q: 'acta' } });
  const workspaceKey = (element: Awaited<ReturnType<typeof CommunityLibraryPage>>) =>
    (element.props.children as Array<{ key: string | null }>)[1].key;
  expect(workspaceKey(first)).toBe(workspaceKey(again));
  expect(workspaceKey(unfiled)).not.toBe(workspaceKey(first));
  expect(workspaceKey(searched)).not.toBe(workspaceKey(first));
});

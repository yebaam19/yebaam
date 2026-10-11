import { describe, expect, it, vi } from 'vitest';
import { getCommunityHomePosts, getCommunityLegacyPosts } from '@/features/communities/server/communities/communities-posts.server';

const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('react', () => ({ cache: (fn: unknown) => fn }));
vi.mock('@/utils/supabase/server', () => ({ getServerClient: async () => ({ from: mocks.from }) }));
vi.mock('@/lib/api/communities', () => ({ mapPost: (row: { id: string }, _profile: unknown, slug: string) => ({ id: row.id, slug }) }));

const communityId = '11111111-1111-4111-8111-111111111111';
const createdAt = '2026-05-02T03:55:44.672499+00:00';
const rows = Array.from({ length: 11 }, (_, index) => ({
  id: `00000000-0000-4000-8000-${String(11 - index).padStart(12, '0')}`,
  author_id: communityId,
  created_at: createdAt,
}));

function database(data = rows) {
  mocks.from.mockClear();
  const postQuery = {
    select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    then: (resolve: (value: { data: typeof rows; error: null }) => void) => resolve({ data, error: null }),
  };
  mocks.from.mockImplementation((table: string) => {
    if (table === 'community_posts') return postQuery;
    if (table === 'profiles') return { select: () => ({ in: async () => ({ data: [] }) }) };
    return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { slug: 'test' } }) }) }) };
  });
  return postQuery;
}

describe('community home post pagination', () => {
  it('returns ten posts and a cursor on the last visible row when timestamps tie', async () => {
    const query = database();
    const page = await getCommunityHomePosts(communityId, null);
    expect(page.posts.map((post) => post.id)).toEqual(rows.slice(0, 10).map((row) => row.id));
    expect(page.nextCursor).toEqual({ createdAt, id: rows[9].id });
    expect(query.limit).toHaveBeenCalledWith(11);
    expect(query.order.mock.calls).toEqual([
      ['created_at', { ascending: false }], ['id', { ascending: false }],
    ]);
  });

  it('filters both timestamp and id to continue after the visible row', async () => {
    const query = database();
    const cursor = { createdAt, id: rows[9].id };
    await getCommunityHomePosts(communityId, cursor);
    expect(query.or).toHaveBeenCalledWith(
      `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${cursor.id})`,
    );
  });

  it('uses the known community slug for article links without another community lookup', async () => {
    database();
    const page = await getCommunityHomePosts(communityId, null, 'comunidad-mvp-test');
    expect(page.posts[0]).toMatchObject({ slug: 'comunidad-mvp-test' });
    expect(mocks.from).not.toHaveBeenCalledWith('communities');
  });

  it('pages legacy galleries without a fixed fifty-post cutoff', async () => {
    const history = Array.from({ length: 51 }, (_, index) => ({
      id: `00000000-0000-4000-8000-${String(51 - index).padStart(12, '0')}`,
      author_id: communityId, created_at: createdAt,
    }));
    const query = database(history);
    const first = await getCommunityLegacyPosts(communityId, null, 'comunidad-mvp-test');
    expect(first.posts).toHaveLength(50);
    expect(first.nextCursor).toEqual({ createdAt, id: history[49].id });
    expect(query.limit).toHaveBeenCalledWith(51);
    expect(mocks.from).not.toHaveBeenCalledWith('communities');
    await getCommunityLegacyPosts(communityId, first.nextCursor, 'comunidad-mvp-test');
    expect(query.or).toHaveBeenCalledWith(
      `created_at.lt.${createdAt},and(created_at.eq.${createdAt},id.lt.${history[49].id})`,
    );
  });
});

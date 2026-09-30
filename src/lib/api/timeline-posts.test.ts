import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadTimelinePosts } from './timeline-posts';
import { loadMyReactions, loadProfilesForPosts, type PostRow } from './posts';

vi.mock('./posts', () => ({
  loadProfilesForPosts: vi.fn(async () => new Map()),
  loadMyReactions: vi.fn(async () => new Map([['own', 'like']])),
  mapPost: vi.fn((row, _profiles, reaction) => ({ ...row, currentUserReaction: reaction })),
}));

const row = (id: string, extra: Partial<PostRow> = {}) => ({
  id, author_id: 'viewer', privacy: 'public', ...extra,
}) as PostRow;

function clientFor(
  rows: PostRow[] | null,
  visible: { id: string }[] | null = rows?.map(({ id }) => ({ id })) ?? null,
  visibilityError: { message: string } | null = null,
) {
  const query = {
    select: vi.fn(() => query),
    in: vi.fn(() => query),
    is: vi.fn(() => query),
    then: (resolve: (value: unknown) => unknown) =>
      Promise.resolve({ data: visible, error: visibilityError }).then(resolve),
  };
  const rpc = vi.fn(async () => ({ data: rows, error: null as { message: string } | null }));
  const from = vi.fn(() => query);
  const client = { rpc, from } as unknown as Parameters<typeof loadTimelinePosts>[0];
  return { client, rpc, from, query };
}

describe('loadTimelinePosts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not query or hydrate a signed-out request', async () => {
    const { client, rpc, from } = clientFor([row('own')]);
    expect(await loadTimelinePosts(client, null)).toEqual({ data: [], error: null });
    expect(rpc).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
    expect(loadProfilesForPosts).not.toHaveBeenCalled();
  });

  it('passes the verified viewer and valid pagination unchanged', async () => {
    const { client, rpc } = clientFor([]);
    expect(await loadTimelinePosts(client, 'viewer', 40, 80)).toEqual({ data: [], error: null });
    expect(rpc).toHaveBeenCalledWith('get_timeline_posts', {
      p_user_id: 'viewer', p_limit: 40, p_offset: 80,
    });
  });

  it.each([
    [1_000, 0, 100, 0], [NaN, -1, 20, 0], [1.5, 2.5, 20, 0],
    [0, Infinity, 20, 0],
  ])('bounds pagination (%s, %s)', async (limit, offset, expectedLimit, expectedOffset) => {
    const { client, rpc } = clientFor([]);
    await loadTimelinePosts(client, 'viewer', limit, offset);
    expect(rpc).toHaveBeenCalledWith('get_timeline_posts', {
      p_user_id: 'viewer', p_limit: expectedLimit, p_offset: expectedOffset,
    });
  });

  it('checks positive RLS visibility and excludes page/blog walls before hydration', async () => {
    const rows = [row('hidden'), row('own', { privacy: 'private' }), row('page')];
    const { client, query } = clientFor(rows, [{ id: 'own' }]);
    const result = await loadTimelinePosts(client, 'viewer');
    expect(query.select).toHaveBeenCalledWith('id');
    expect(query.in).toHaveBeenCalledWith('id', ['hidden', 'own', 'page']);
    expect(query.is).toHaveBeenCalledWith('blog_id', null);
    expect(query.is).toHaveBeenCalledWith('page_id', null);
    expect(result.data).toEqual([{ ...rows[1], currentUserReaction: 'like' }]);
    expect(loadProfilesForPosts).toHaveBeenCalledWith(client, [rows[1]]);
    expect(loadMyReactions).toHaveBeenCalledWith(client, ['own'], 'viewer');
  });

  it('preserves RPC ordering, followed-business metadata and viewer reactions', async () => {
    const rows = [row('business', { business_id: 'b', business_name: 'Store' }), row('own')];
    const { client } = clientFor(rows, [{ id: 'own' }, { id: 'business' }]);
    const result = await loadTimelinePosts(client, 'viewer');
    expect(result.data.map(({ id }) => id)).toEqual(['business', 'own']);
    expect(result.data[0]).toMatchObject({ business_id: 'b', business_name: 'Store' });
    expect(result.data[1].currentUserReaction).toBe('like');
  });

  it('fails closed on a visibility error instead of rendering unverified RPC rows', async () => {
    const error = { message: 'temporarily unavailable' };
    const { client } = clientFor([row('hidden')], null, error);
    expect(await loadTimelinePosts(client, 'viewer')).toEqual({ data: [], error });
    expect(loadProfilesForPosts).not.toHaveBeenCalled();
    expect(loadMyReactions).not.toHaveBeenCalled();
  });

  it('does not hydrate rows missing from a successful RLS result', async () => {
    const { client } = clientFor([row('deleted-or-restricted')], []);
    expect(await loadTimelinePosts(client, 'viewer')).toEqual({ data: [], error: null });
    expect(loadProfilesForPosts).not.toHaveBeenCalled();
  });

  it('propagates RPC failure without making follow-up reads', async () => {
    const { client, rpc, from } = clientFor(null);
    rpc.mockResolvedValueOnce({ data: null, error: { message: 'RPC failure' } });
    expect(await loadTimelinePosts(client, 'viewer')).toEqual({ data: [], error: { message: 'RPC failure' } });
    expect(from).not.toHaveBeenCalled();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { from, results, queries } = vi.hoisted(() => ({
  from: vi.fn(), results: new Map<string, { data: unknown; error?: unknown }>(),
  queries: new Map<string, { select: ReturnType<typeof vi.fn>; in: ReturnType<typeof vi.fn> }>(),
}));
vi.mock('@/utils/supabase/server', () => ({ getServerClient: async () => ({ from }) }));
vi.mock('react', () => ({ cache: (fn: unknown) => fn }));

import { listLatestMusicMedia } from './music-media.server';

const media = {
  id: 'media', kind: 'photo', source: 'cf_image', cf_image_id: 'image', cf_stream_uid: null,
  embed_url: null, embed_provider: null, thumbnail_cf_image_id: null, caption: 'Caption',
  duration_seconds: null, uploaded_by: 'owner', created_at: '2026-09-30T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  results.clear();
  queries.clear();
  from.mockImplementation((table: string) => {
    const query = {
      select: vi.fn(), order: vi.fn(), limit: vi.fn(), in: vi.fn(),
    };
    query.select.mockReturnValue(query);
    query.order.mockReturnValue(query);
    query.limit.mockImplementation(async () => results.get(table) ?? { data: [] });
    query.in.mockImplementation(async () => results.get(table) ?? { data: [] });
    queries.set(table, query);
    return query;
  });
  results.set('music_media', { data: [media] });
});

describe('music media association hydration', () => {
  it('hydrates the unchanged output in four total queries with no parent-table lookups', async () => {
    const artist = { id: 'artist', name: 'Artist', slug: 'artist' };
    const album = { id: 'album', title: 'Album', slug: 'album' };
    const club = { id: 'club', name: 'Club', slug: 'club' };
    results.set('music_media_artists', { data: [{ media_id: 'media', ref: artist }] });
    results.set('music_media_albums', { data: [{ media_id: 'media', ref: [album] }] });
    results.set('music_media_clubs', { data: [{ media_id: 'media', ref: club }] });
    expect(await listLatestMusicMedia(12)).toEqual([
      { ...media, artists: [artist], albums: [album], clubs: [club] },
    ]);
    expect(from.mock.calls.map(([table]) => table)).toEqual([
      'music_media', 'music_media_artists', 'music_media_albums', 'music_media_clubs',
    ]);
    expect(queries.get('music_media_clubs')?.select)
      .toHaveBeenCalledWith('media_id, ref:clubs!inner(id, name, slug)');
    expect(queries.get('music_media_clubs')?.in).toHaveBeenCalledWith('media_id', ['media']);
  });

  it('omits RLS-hidden/missing parent labels without leaking pivot identifiers', async () => {
    results.set('music_media_clubs', { data: [
      { media_id: 'media', ref: null }, { media_id: 'media', ref: [] },
    ] });
    expect(await listLatestMusicMedia()).toEqual([{ ...media, artists: [], albums: [], clubs: [] }]);
  });

  it('preserves partial results when an association query fails', async () => {
    results.set('music_media_artists', { data: null, error: { message: 'unavailable' } });
    const club = { id: 'club', name: 'Club', slug: 'club' };
    results.set('music_media_clubs', { data: [{ media_id: 'media', ref: club }] });
    expect((await listLatestMusicMedia())[0]).toMatchObject({ artists: [], clubs: [club] });
  });

  it.each([{ data: [] }, { data: null, error: { message: 'unavailable' } }])(
    'skips associations for empty or failed media reads', async (result) => {
      results.set('music_media', result);
      expect(await listLatestMusicMedia()).toEqual([]);
      expect(from).toHaveBeenCalledExactlyOnceWith('music_media');
    },
  );
});

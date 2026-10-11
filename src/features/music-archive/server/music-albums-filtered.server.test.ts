import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ from: vi.fn(), clubs: vi.fn() }));
vi.mock('react', () => ({ cache: (fn: unknown) => fn }));
vi.mock('@/utils/supabase/server', () => ({ getServerClient: async () => ({ from: mocks.from }) }));
vi.mock('./clubs/metadata.server', () => ({ listMusicClubs: mocks.clubs }));

import { listAlbumsFiltered } from './music-albums-filtered.server';

beforeEach(() => vi.resetAllMocks());

it('reuses the visible club list for genre filters without repeating genre and club lookups', async () => {
  mocks.clubs.mockResolvedValue([
    { id: 'salsa-club', genre_slug: 'salsa' },
    { id: 'jazz-club', genre_slug: 'jazz' },
  ]);
  const pivots = { in: vi.fn().mockResolvedValue({ data: [{ album_id: 'album-1' }] }) };
  const albums = { in: vi.fn(), order: vi.fn(), limit: vi.fn().mockResolvedValue({ data: [{ id: 'album-1' }] }) };
  albums.in.mockReturnValue(albums);
  albums.order.mockReturnValue(albums);
  mocks.from.mockImplementation((table: string) => ({
    select: () => table === 'music_album_clubs' ? pivots : albums,
  }));

  expect(await listAlbumsFiltered({ genreSlug: 'salsa' })).toEqual([{ id: 'album-1' }]);
  expect(mocks.from.mock.calls.map(([table]) => table)).toEqual(['music_album_clubs', 'music_albums']);
  expect(pivots.in).toHaveBeenCalledWith('club_id', ['salsa-club']);
  expect(albums.in).toHaveBeenCalledWith('id', ['album-1']);
});

it('returns an empty page without database lookups when no visible club matches', async () => {
  mocks.clubs.mockResolvedValue([{ id: 'jazz-club', genre_slug: 'jazz' }]);
  expect(await listAlbumsFiltered({ genreSlug: 'salsa' })).toEqual([]);
  expect(mocks.from).not.toHaveBeenCalled();
});

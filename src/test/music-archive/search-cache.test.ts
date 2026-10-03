import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  getUser: vi.fn(), from: vi.fn(), read: vi.fn(), write: vi.fn(),
  key: vi.fn(() => 'scoped-key'),
}));
vi.mock('@/utils/supabase/server', () => ({ getServerClient: async () => ({
  auth: { getUser: mocks.getUser }, from: mocks.from,
}) }));
vi.mock('@/lib/cloudflare/music-cache', () => ({
  musicSearchCacheKey: mocks.key, readMusicSearchCache: mocks.read, writeMusicSearchCache: mocks.write,
}));
import { searchMusic, searchMusicTopHits } from '@/features/music-archive/server/music-search.server';

const empty = { artists: [], albums: [], tracks: [] };
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('MUSIC_CACHE_ORIGIN', 'https://cache.example.test');
  vi.stubEnv('MUSIC_CACHE_SECRET', 'test-only-secret');
  mocks.getUser.mockResolvedValue({ data: { user: { id: 'a' } }, error: null });
  mocks.read.mockResolvedValue(null);
  mocks.write.mockResolvedValue(undefined);
  mocks.from.mockImplementation(() => ({ select: () => ({ ilike: () => ({
    limit: async () => ({ data: [], error: null }),
  }) }) }));
});
afterEach(() => vi.unstubAllEnvs());

it('uses the verified user, normalized query and bounded limit for cache lookup', async () => {
  mocks.read.mockResolvedValue(empty);
  expect(await searchMusic(' Bolero ', 12)).toEqual(empty);
  expect(mocks.getUser).toHaveBeenCalledOnce();
  expect(mocks.key).toHaveBeenCalledWith('a', 'bolero', 12);
  expect(mocks.from).not.toHaveBeenCalled();
});

it('fills only from session-bound database reads on a miss', async () => {
  expect(await searchMusic('Bolero', 30)).toEqual(empty);
  expect(mocks.from.mock.calls.map(([table]) => table)).toEqual(['music_artists', 'music_albums', 'music_tracks']);
  expect(mocks.write).toHaveBeenCalledWith('scoped-key', empty);
});

it('shares the search cache path with autocomplete', async () => {
  mocks.read.mockResolvedValue({ ...empty, artists: [{ id: 'artist', name: 'Bolero', slug: 'bolero', country: 'CO' }] });
  expect(await searchMusicTopHits('bolero', 8)).toEqual([
    { type: 'artist', id: 'artist', label: 'Bolero', sublabel: 'CO', href: '/musica/artistas/bolero' },
  ]);
  expect(mocks.from).not.toHaveBeenCalled();
});

it('uses a separate anonymous scope only for a genuinely missing session', async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: { name: 'AuthSessionMissingError', status: 400 } });
  await searchMusic('Bolero', 12);
  expect(mocks.key).toHaveBeenCalledWith(null, 'bolero', 12);
});

it('does not read or fill a cache after an auth outage or invalid token', async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null }, error: { name: 'AuthApiError', status: 401 } });
  await searchMusic('Bolero', 12);
  expect(mocks.read).not.toHaveBeenCalled();
  expect(mocks.write).not.toHaveBeenCalled();
});

it('does not cache partial database failures', async () => {
  mocks.from.mockImplementation(() => ({ select: () => ({ ilike: () => ({
    limit: async () => ({ data: null, error: { message: 'unavailable' } }),
  }) }) }));
  await searchMusic('Bolero', 12);
  expect(mocks.write).not.toHaveBeenCalled();
});

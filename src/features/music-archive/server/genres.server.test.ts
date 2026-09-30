import { beforeEach, describe, expect, it, vi } from 'vitest';

const { from, select, getPublicClient, getSessionClient, cached, entries } = vi.hoisted(() => ({
  from: vi.fn(), select: vi.fn(), getPublicClient: vi.fn(), getSessionClient: vi.fn(),
  cached: vi.fn(), entries: new Map<string, unknown>(),
}));
vi.mock('@/utils/supabase/public-server', () => ({ getPublicServerClient: getPublicClient }));
vi.mock('@/utils/supabase/server', () => ({ getServerClient: getSessionClient }));
vi.mock('react', () => ({ cache: (fn: unknown) => fn }));
vi.mock('next/cache', () => ({
  unstable_cache: cached.mockImplementation((fn: () => Promise<unknown>, keys: string[]) => async () => {
    const key = keys.join(':');
    if (!entries.has(key)) entries.set(key, await fn());
    return entries.get(key);
  }),
}));

import { getMusicGenreBySlug, listMusicGenres, MUSIC_GENRES_CACHE_TAG } from './genres.server';

const genre = (name: string, sort_order = 999) => ({
  id: name, slug: name.toLowerCase(), name, sort_order, description: null, image_cf_id: null,
});

beforeEach(() => {
  from.mockClear();
  select.mockReset();
  getPublicClient.mockClear();
  getSessionClient.mockClear();
  entries.clear();
  from.mockReturnValue({ select });
  getPublicClient.mockReturnValue({ from });
});

describe('shared public music taxonomy', () => {
  it('declares a short, explicitly tagged cache', () => {
    expect(cached).toHaveBeenCalledWith(expect.any(Function), ['public-music-genres-v1'], {
      revalidate: 60, tags: [MUSIC_GENRES_CACHE_TAG],
    });
  });

  it('uses only the anonymous client and projects taxonomy fields', async () => {
    select.mockResolvedValue({ data: [genre('Salsa')] });
    expect(await listMusicGenres()).toEqual([genre('Salsa')]);
    expect(getSessionClient).not.toHaveBeenCalled();
    expect(from).toHaveBeenCalledExactlyOnceWith('music_genres');
    expect(select).toHaveBeenCalledWith('id, slug, name, description, image_cf_id, sort_order');
  });

  it('preserves pinned groups and Spanish/numeric alphabetical sorting', async () => {
    const rows = [genre('Salsa'), genre('Jazz 10'), genre('África'), genre('Jazz 2'), genre('Zouk', 0)];
    select.mockResolvedValue({ data: rows });
    expect((await listMusicGenres()).map((row) => row.name))
      .toEqual(['Zouk', 'África', 'Jazz 2', 'Jazz 10', 'Salsa']);
    expect(rows[0].name).toBe('Salsa');
  });

  it('reuses the same cached taxonomy for list and slug readers', async () => {
    select.mockResolvedValue({ data: [genre('Salsa')] });
    await listMusicGenres();
    expect(await getMusicGenreBySlug('salsa')).toEqual(genre('Salsa'));
    expect(await getMusicGenreBySlug('missing')).toBeNull();
    expect(select).toHaveBeenCalledTimes(1);
  });

  it('keeps failed reads out of the shared cache and allows recovery', async () => {
    select.mockResolvedValueOnce({ data: null, error: { message: 'temporarily unavailable' } })
      .mockResolvedValueOnce({ data: [genre('Salsa')] });
    expect(await listMusicGenres()).toEqual([]);
    expect(await listMusicGenres()).toEqual([genre('Salsa')]);
    expect(select).toHaveBeenCalledTimes(2);
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { from, query } = vi.hoisted(() => {
  const query = {
    select: vi.fn(), eq: vi.fn(), not: vi.fn(), order: vi.fn(), maybeSingle: vi.fn(),
  };
  return { from: vi.fn(), query };
});
vi.mock('@/utils/supabase/server', () => ({ getServerClient: async () => ({ from }) }));
vi.mock('react', () => ({ cache: (fn: unknown) => fn }));

import { getMusicClubBySlug, listMusicClubs } from './metadata.server';
import { CLUB_SELECT } from './club-shape.helpers';

function club(id: string, name: string, albumCount = 0, memberCount = 0) {
  return {
    id, name, slug: id, description: 'Description', music_genre_id: 'genre',
    cover_image_url: null, profile_image_url: null,
    music_genres: { slug: 'jazz', name: 'Jazz' },
    music_album_clubs: [{ count: albumCount }], club_members: [{ count: memberCount }],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  from.mockReturnValue(query);
  query.select.mockReturnValue(query);
  query.eq.mockReturnValue(query);
  query.not.mockReturnValue(query);
});

describe('music club counts', () => {
  it('uses one RLS-bound query with embedded counts and preserves sorting/shape', async () => {
    query.order.mockResolvedValue({ data: [club('b', 'Beta', 2), club('a', 'Alpha', 1501, 2500)] });
    const clubs = await listMusicClubs();
    expect(from).toHaveBeenCalledExactlyOnceWith('clubs');
    expect(query.select).toHaveBeenCalledWith(CLUB_SELECT);
    expect(CLUB_SELECT).toContain('music_album_clubs(count), club_members(count)');
    expect(query.eq).toHaveBeenCalledWith('category', 'MUSICA');
    expect(query.not).toHaveBeenCalledWith('music_genre_id', 'is', null);
    expect(clubs.map((row) => row.id)).toEqual(['a', 'b']);
    expect(clubs[0]).toEqual({
      id: 'a', name: 'Alpha', slug: 'a', description: 'Description', music_genre_id: 'genre',
      cover_image_url: null, profile_image_url: null, genre_slug: 'jazz', genre_name: 'Jazz',
      album_count: 1501, member_count: 2500,
    });
  });

  it('sorts equal counts alphabetically and accepts array genre joins', async () => {
    query.order.mockResolvedValue({ data: [
      club('b', 'Beta'), { ...club('a', 'Alpha'), music_genres: [{ slug: 'jazz', name: 'Jazz' }] },
    ] });
    expect((await listMusicClubs()).map((row) => row.name)).toEqual(['Alpha', 'Beta']);
  });

  it.each([{ data: null, error: { message: 'unavailable' } }, { data: [] }])(
    'preserves empty/error list handling', async (result) => {
      query.order.mockResolvedValue(result);
      expect(await listMusicClubs()).toEqual([]);
      expect(from).toHaveBeenCalledTimes(1);
    },
  );

  it('loads detail and both counts in one query without exposing aggregate joins', async () => {
    query.maybeSingle.mockResolvedValue({ data: club('salsa', 'Salsa', 3, 7) });
    const result = await getMusicClubBySlug('salsa');
    expect(from).toHaveBeenCalledExactlyOnceWith('clubs');
    expect(query.eq).toHaveBeenCalledWith('slug', 'salsa');
    expect(result).toMatchObject({ album_count: 3, member_count: 7 });
    expect(result).not.toHaveProperty('club_members');
  });

  it('returns null for a missing or RLS-hidden club', async () => {
    query.maybeSingle.mockResolvedValue({ data: null });
    expect(await getMusicClubBySlug('hidden')).toBeNull();
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { query, from, adminGate, updateTag } = vi.hoisted(() => ({
  from: vi.fn(), adminGate: vi.fn(), updateTag: vi.fn(),
  query: {
    select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn(), eq: vi.fn(),
    maybeSingle: vi.fn(), single: vi.fn(),
  },
}));
vi.mock('@/utils/supabase/server', () => ({ getServiceClient: () => ({ from }) }));
vi.mock('./_shared', () => ({ adminGate, musicSlug: () => 'salsa' }));
vi.mock('next/cache', () => ({ updateTag, revalidatePath: vi.fn() }));
vi.mock('../server/genres.server', () => ({ MUSIC_GENRES_CACHE_TAG: 'music-genres' }));

import { createGenre, deleteGenre, updateGenre } from './genres.actions';

beforeEach(() => {
  vi.resetAllMocks();
  adminGate.mockResolvedValue({ ok: true, userId: 'admin' });
  from.mockReturnValue(query);
  for (const method of ['select', 'insert', 'update', 'delete', 'eq'] as const) {
    query[method].mockReturnValue(query);
  }
  query.maybeSingle.mockResolvedValue({ data: null });
  query.single.mockResolvedValue({ data: { id: 'genre', name: 'Salsa' } });
});

describe('genre mutation cache invalidation', () => {
  it.each([
    ['create', () => createGenre({ name: 'Salsa' })],
    ['update', () => updateGenre('genre', { name: 'Salsa' })],
    ['delete', () => deleteGenre('genre')],
  ] as const)('expires the taxonomy immediately after successful %s', async (_name, mutate) => {
    expect((await mutate()).ok).toBe(true);
    expect(updateTag).toHaveBeenCalledExactlyOnceWith('music-genres');
  });

  it.each([
    () => createGenre({ name: 'Salsa' }),
    () => updateGenre('genre', { name: 'Salsa' }),
    () => deleteGenre('genre'),
  ])('does not invalidate or mutate when authorization fails', async (mutate) => {
    adminGate.mockResolvedValue({ ok: false, error: 'denied' });
    expect((await mutate()).ok).toBe(false);
    expect(updateTag).not.toHaveBeenCalled();
    expect(from).not.toHaveBeenCalled();
  });

  it('does not invalidate after a failed update', async () => {
    query.single.mockResolvedValue({ data: null, error: { message: 'failed' } });
    expect((await updateGenre('genre', { name: 'Salsa' })).ok).toBe(false);
    expect(updateTag).not.toHaveBeenCalled();
  });

  it('does not invalidate a blocked delete', async () => {
    query.eq.mockResolvedValue({ count: 1 });
    expect((await deleteGenre('genre')).ok).toBe(false);
    expect(query.delete).not.toHaveBeenCalled();
    expect(updateTag).not.toHaveBeenCalled();
  });
});

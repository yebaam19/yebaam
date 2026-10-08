import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCommunityAbout, getAboutMedia } from '@/features/communities/server/community-about.server';

const mocks = vi.hoisted(() => ({ client: vi.fn(), from: vi.fn() }));
vi.mock('@/utils/supabase/server', () => ({ getServerClient: mocks.client }));
const id = '11111111-1111-4111-8111-111111111111';
function query(data: unknown, error: unknown = null) {
  const result = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), or: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve({ data, error }).then(resolve) };
  mocks.from.mockReturnValue(result); return result;
}
beforeEach(() => { vi.resetAllMocks(); mocks.client.mockResolvedValue({ from: mocks.from }); });
describe('About reads', () => {
  it('handles a missing draft and fails visibly on backend errors', async () => {
    query(null); expect(await getCommunityAbout(id)).toBeNull();
    query(null, { code: '503' }); await expect(getCommunityAbout(id)).rejects.toThrow('No se pudo cargar');
  });
  it('sanitizes all rich sections and limits outgoing links written by other clients', async () => {
    query({ description: '<p>Overview</p>', history: '<script>bad()</script><p>History</p>', mission: '', vision: '', objectives: '', values: '',
      website: 'javascript:alert(1)', social_links: [{ label: 'Good', url: 'https://example.test', extra: 'never serialize' }, { label: 'Bad', url: 'https://user:pass@example.test' }] });
    const result = await getCommunityAbout(id);
    expect(result?.history).toBe('<p>History</p>');
    expect(result?.website).toBe('');
    expect(result?.social_links).toEqual([{ label: 'Good', url: 'https://example.test' }]);
  });
  it('bounds media pages, excludes archived files and preserves composite cursors', async () => {
    const read = query(Array.from({ length: 31 }, (_, position) => ({ id, position })));
    const result = await getAboutMedia(id, id, JSON.stringify({ id, position: 5 }));
    expect(read.limit).toHaveBeenCalledWith(31);
    expect(read.is).toHaveBeenCalledWith('asset.deleted_at', null);
    expect(read.in).toHaveBeenCalledWith('asset.kind', ['image', 'video']);
    expect(read.or).toHaveBeenCalledWith(`position.gt.5,and(position.eq.5,id.gt.${id})`);
    expect(result.items).toHaveLength(30);
    expect(result.nextCursor).toEqual({ id, position: 29 });
  });
});

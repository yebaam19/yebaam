import { beforeEach, expect, it, vi } from 'vitest';
import { loadTimelinePage } from '@/lib/api/timeline-page';
import { hydrateTimelineRows } from '@/lib/api/timeline-posts';
import { GET } from '@/app/api/posts/timeline/route';
import { getServerClient } from '@/utils/supabase/server';
import { NextRequest } from 'next/server';

vi.mock('@/lib/api/timeline-posts', () => ({ hydrateTimelineRows: vi.fn() }));
vi.mock('@/utils/supabase/server', () => ({ getServerClient: vi.fn() }));
const rpc = vi.fn();
const client = { rpc, auth: { getUser: vi.fn() } };
const typedClient = client as unknown as Awaited<ReturnType<typeof getServerClient>>;
const row = (id: string) => ({ id, created_at: '2026-10-11T12:00:00.123456+00:00' });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getServerClient).mockResolvedValue(typedClient);
  client.auth.getUser.mockResolvedValue({ data: { user: { id: 'viewer' } }, error: null });
  rpc.mockResolvedValue({ data: [], error: null });
  vi.mocked(hydrateTimelineRows).mockResolvedValue({ data: [], error: null });
});

it('requests an extra row and advances over filtered rows using full timestamp precision', async () => {
  rpc.mockResolvedValue({ data: [row('first'), row('second'), row('lookahead')], error: null });
  const result = await loadTimelinePage(typedClient, 'viewer', null, 2);
  expect(rpc).toHaveBeenCalledWith('get_timeline_posts_page', { p_limit: 3, p_before_created_at: null, p_before_id: null });
  expect(hydrateTimelineRows).toHaveBeenCalledWith(typedClient, 'viewer', [row('first'), row('second')]);
  expect(result).toEqual({ posts: [], nextCursor: { id: 'second', createdAt: row('second').created_at } });
});

it('does not advertise more data when there is no lookahead', async () => {
  rpc.mockResolvedValue({ data: [row('only')], error: null });
  expect((await loadTimelinePage(typedClient, 'viewer')).nextCursor).toBeNull();
});

it('fails closed when visibility cannot be verified', async () => {
  rpc.mockResolvedValue({ data: [row('private')], error: null });
  vi.mocked(hydrateTimelineRows).mockResolvedValue({ data: [], error: { message: 'RLS unavailable' } });
  await expect(loadTimelinePage(typedClient, 'viewer')).rejects.toThrow('verify timeline visibility');
});

it('rejects an unverified caller before querying posts', async () => {
  client.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
  const response = await GET(new NextRequest('http://localhost/api/posts/timeline'));
  expect(response.status).toBe(401);
  expect(rpc).not.toHaveBeenCalled();
});

it.each(['before=invalid', 'beforeId=bad', 'before=2026-10-11T00:00:00Z'])('rejects malformed or partial cursors: %s', async (query) => {
  expect((await GET(new NextRequest(`http://localhost/api/posts/timeline?${query}`))).status).toBe(400);
  expect(rpc).not.toHaveBeenCalled();
});

it('returns private responses and does not expose database failure details', async () => {
  rpc.mockResolvedValue({ data: null, error: { message: 'private schema details' } });
  const response = await GET(new NextRequest('http://localhost/api/posts/timeline'));
  expect(response.status).toBe(500);
  expect(response.headers.get('cache-control')).toBe('private, no-store');
  expect(await response.json()).toEqual({ error: 'Unable to load timeline' });
});

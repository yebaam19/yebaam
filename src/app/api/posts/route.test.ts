import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';
import { getServerClient } from '@/utils/supabase/server';
import { loadTimelinePosts } from '@/lib/api/timeline-posts';

vi.mock('@/utils/supabase/server', () => ({
  getServerClient: vi.fn(),
  getServerAccessToken: vi.fn(),
}));
vi.mock('@/lib/api/timeline-posts', () => ({ loadTimelinePosts: vi.fn() }));
vi.mock('@/lib/api/mirror-post-media', () => ({ mirrorMediaToProfileGallery: vi.fn() }));

const client = { auth: { getUser: vi.fn() } };
const request = (query = '') => new NextRequest(`https://example.test/api/posts?${query}`);

describe('timeline GET', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerClient).mockResolvedValue(client as unknown as Awaited<ReturnType<typeof getServerClient>>);
    client.auth.getUser.mockResolvedValue({ data: { user: { id: 'verified-viewer' } } });
    vi.mocked(loadTimelinePosts).mockResolvedValue({ data: [], error: null });
  });

  it('uses the verified caller, ignoring a supplied timeline userId', async () => {
    const response = await GET(request('scope=timeline&userId=other-user&limit=10&page=3'));
    expect(loadTimelinePosts).toHaveBeenCalledWith(client, 'verified-viewer', 10, 20);
    expect(await response.json()).toEqual({ success: true, data: [] });
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it('preserves the signed-out empty-result contract without an RPC', async () => {
    client.auth.getUser.mockResolvedValue({ data: { user: null } });
    const response = await GET(request());
    expect(await response.json()).toEqual({ success: true, data: [] });
    expect(loadTimelinePosts).not.toHaveBeenCalled();
  });

  it('defaults malformed pagination without sending fractional offsets to SQL', async () => {
    await GET(request('limit=1.5&page=Infinity'));
    expect(loadTimelinePosts).toHaveBeenCalledWith(client, 'verified-viewer', 20, 0);
  });

  it('returns a retryable private failure without exposing database details', async () => {
    vi.mocked(loadTimelinePosts).mockResolvedValue({ data: [], error: { message: 'internal SQL details' } });
    const response = await GET(request());
    expect(response.status).toBe(500);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ error: 'Unable to load timeline' });
  });
});

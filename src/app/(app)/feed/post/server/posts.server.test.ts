import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listTimelinePosts } from './posts.server';
import { getCachedAuthUser } from '@/features/auth/actions/auth.actions';
import { getServerClient } from '@/utils/supabase/server';
import { loadTimelinePosts } from '@/lib/api/timeline-posts';

vi.mock('react', () => ({ cache: (fn: unknown) => fn }));
vi.mock('@/features/auth/actions/auth.actions', () => ({ getCachedAuthUser: vi.fn() }));
vi.mock('@/utils/supabase/server', () => ({ getServerClient: vi.fn() }));
vi.mock('@/lib/api/timeline-posts', () => ({ loadTimelinePosts: vi.fn() }));

describe('initial timeline render', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses the same visibility-enforcing loader as paginated requests', async () => {
    const client = {} as Awaited<ReturnType<typeof getServerClient>>;
    vi.mocked(getCachedAuthUser).mockResolvedValue({ id: 'viewer' } as Awaited<ReturnType<typeof getCachedAuthUser>>);
    vi.mocked(getServerClient).mockResolvedValue(client);
    vi.mocked(loadTimelinePosts).mockResolvedValue({ data: [], error: null });
    expect(await listTimelinePosts(30)).toEqual([]);
    expect(loadTimelinePosts).toHaveBeenCalledWith(client, 'viewer', 30);
  });

  it('preserves the signed-out empty state without a database read', async () => {
    vi.mocked(getCachedAuthUser).mockResolvedValue(null);
    expect(await listTimelinePosts()).toEqual([]);
    expect(getServerClient).not.toHaveBeenCalled();
    expect(loadTimelinePosts).not.toHaveBeenCalled();
  });
});

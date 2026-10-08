import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/internal/community-asset-cleanup/route';

const mocks = vi.hoisted(() => ({ cleanup: vi.fn() }));
vi.mock('@/features/communities/server/asset-cleanup.server', () => ({ processAssetCleanup: mocks.cleanup }));
const secret = 'test-cleanup-secret-with-at-least-32-characters';
beforeEach(() => { vi.resetAllMocks(); vi.stubEnv('COMMUNITY_CLEANUP_SECRET', secret); });
afterEach(() => vi.unstubAllEnvs());
function request(token?: string) {
  return new NextRequest('http://localhost/api/internal/community-asset-cleanup', {
    method: 'POST', headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}
describe('internal cleanup authentication', () => {
  it.each([undefined, 'wrong', 'x'.repeat(secret.length)])('rejects invalid credentials before privileged access (%s)', async (token) => {
    expect((await POST(request(token))).status).toBe(401);
    expect(mocks.cleanup).not.toHaveBeenCalled();
  });
  it.each(['', 'short'])('fails closed when the secret is missing or too short (%s)', async (value) => {
    vi.stubEnv('COMMUNITY_CLEANUP_SECRET', value);
    expect((await POST(request())).status).toBe(503);
    expect(mocks.cleanup).not.toHaveBeenCalled();
  });
  it('returns aggregate results without exposing remote identifiers', async () => {
    mocks.cleanup.mockResolvedValue({ claimed: 5, completed: 4, retrying: 1 });
    const response = await POST(request(secret));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.json()).toEqual({ claimed: 5, completed: 4, retrying: 1 });
  });
  it('returns retryable failure without leaking database errors', async () => {
    mocks.cleanup.mockRejectedValue(new Error('database credentials'));
    const response = await POST(request(secret));
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('credentials');
  });
});

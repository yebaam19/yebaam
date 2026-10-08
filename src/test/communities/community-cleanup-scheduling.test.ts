import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { scheduleAssetCleanup } from '@/features/communities/server/schedule-asset-cleanup.server';
import { deleteImage } from '@/lib/cloudflare/images';
import { deleteStreamVideo } from '@/lib/cloudflare/stream';

const mocks = vi.hoisted(() => ({ after: vi.fn(), cleanup: vi.fn() }));
vi.mock('next/server', () => ({ after: mocks.after }));
vi.mock('@/features/communities/server/asset-cleanup.server', () => ({ processAssetCleanup: mocks.cleanup }));
beforeEach(() => { vi.resetAllMocks(); vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('cleanup scheduling after a committed mutation', () => {
  it('defers processing and does not turn background failure into a failed write', async () => {
    mocks.cleanup.mockRejectedValue(new Error('provider failed'));
    scheduleAssetCleanup();
    expect(mocks.cleanup).not.toHaveBeenCalled();
    await expect(mocks.after.mock.calls[0][0]()).resolves.toBeUndefined();
    expect(mocks.cleanup).toHaveBeenCalledOnce();
  });
  it('leaves the outbox for cron when scheduling is unavailable', () => {
    mocks.after.mockImplementation(() => { throw new Error('No request scope'); });
    expect(scheduleAssetCleanup).not.toThrow();
    expect(mocks.cleanup).not.toHaveBeenCalled();
  });
});

describe('idempotent Cloudflare retirement', () => {
  it.each(['image', 'video'])('accepts an already absent %s without repeating an error', async (kind) => {
    vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', 'test-account');
    vi.stubEnv('CLOUDFLARE_API_TOKEN', 'test-token');
    const fetch = vi.fn().mockResolvedValue(new Response('', { status: 404 }));
    vi.stubGlobal('fetch', fetch);
    const operation = kind === 'image' ? deleteImage('11111111-1111-4111-8111-111111111111') : deleteStreamVideo('a'.repeat(32));
    await expect(operation).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'DELETE', signal: expect.any(AbortSignal) }));
  });
  it('does not mistake provider authorization failure for absence', async () => {
    vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', 'test-account');
    vi.stubEnv('CLOUDFLARE_API_TOKEN', 'test-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 403 })));
    await expect(deleteStreamVideo('a'.repeat(32))).rejects.toThrow();
  });
});

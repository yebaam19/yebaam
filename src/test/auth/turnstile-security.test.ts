import { afterEach, expect, it, vi } from 'vitest';
import { verifyTurnstileToken } from '@/lib/turnstile';
afterEach(() => { vi.unstubAllEnvs(); });
it('rejects successful CAPTCHA tokens without the expected action', async () => {
  vi.stubEnv('TURNSTILE_SECRET_KEY', 'synthetic');
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
  vi.stubGlobal('fetch', fetchMock);
  expect(await verifyTurnstileToken('fake', { expectedAction: 'password-reset' })).toMatchObject({ ok: false });
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true, action: 'password-reset' }) });
  expect(await verifyTurnstileToken('fake', { expectedAction: 'password-reset' })).toEqual({ ok: true });
});

import { beforeEach, expect, it, vi } from 'vitest';
const { lookup, user, issue, captcha } = vi.hoisted(() => ({ lookup: vi.fn(), user: vi.fn(), issue: vi.fn(), captcha: vi.fn() }));
vi.mock('@/utils/supabase/server', () => ({ getServiceClient: () => ({
  auth: { admin: { getUserById: user } },
  from: () => { const q = { select: () => q, eq: () => q, order: () => q, limit: () => q, maybeSingle: lookup }; return q; },
}) }));
vi.mock('@/features/auth/actions/_signup-helpers', () => ({ issueOtpFor: issue }));
vi.mock('@/features/auth/actions/_otp-shared', () => ({ getRemoteIp: async () => '192.0.2.1' }));
vi.mock('@/lib/turnstile', () => ({ verifyTurnstileToken: captcha }));
import { resendOtpAction } from '@/features/auth/actions/otp-signup.actions';
beforeEach(() => { vi.resetAllMocks(); captcha.mockResolvedValue({ ok: true }); });
it('keeps resend available with the same acknowledgment for absent, confirmed and pending accounts', async () => {
  lookup.mockResolvedValueOnce({ data: null });
  const absent = await resendOtpAction({ email: 'synthetic@example.invalid' });
  lookup.mockResolvedValue({ data: { user_id: 'synthetic' } });
  user.mockResolvedValueOnce({ data: { user: { email_confirmed_at: 'synthetic' } } });
  expect(await resendOtpAction({ email: 'synthetic@example.invalid' })).toEqual(absent);
  user.mockResolvedValueOnce({ data: { user: { email_confirmed_at: null } } });
  expect(await resendOtpAction({ email: 'synthetic@example.invalid' })).toEqual(absent);
  expect(issue).toHaveBeenCalledOnce();
});
it('requires action-bound CAPTCHA before user lookup', async () => {
  captcha.mockResolvedValue({ ok: false, reason: 'CAPTCHA requerido' });
  expect(await resendOtpAction({ email: 'synthetic@example.invalid' })).toMatchObject({ ok: false });
  expect(captcha).toHaveBeenCalledWith(undefined, { remoteIp: '192.0.2.1', expectedAction: 'resend-otp' });
  expect(lookup).not.toHaveBeenCalled();
});

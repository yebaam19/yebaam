import { beforeEach, expect, it, vi } from 'vitest';
const { find, update, captcha, consume, reset } = vi.hoisted(() => ({
  find: vi.fn(), update: vi.fn(), captcha: vi.fn(), consume: vi.fn(), reset: vi.fn(),
}));
vi.mock('@/features/auth/actions/_otp-shared', () => ({
  findUserByEmail: find, generateCode: () => '123456', hashCode: (v: string) => `hash:${v}`,
  getRemoteIp: async () => '192.0.2.1', consumeOtpAttempt: consume, resetOtpAttempts: reset,
  OTP_TTL_MINUTES: 10, MAX_ATTEMPTS: 5,
}));
vi.mock('@/utils/supabase/server', () => ({ getServiceClient: () => ({
  auth: { admin: { updateUserById: update } },
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
}) }));
vi.mock('@/services/email/resend.service', () => ({ sendPasswordResetEmail: vi.fn() }));
vi.mock('@/lib/turnstile', () => ({ verifyTurnstileToken: captcha }));
vi.mock('@/lib/api/rate-limit', () => ({ checkRateLimit: () => ({ ok: true }) }));
import { requestPasswordResetAction, resetPasswordAction } from '@/features/auth/actions/password-recovery.actions';
beforeEach(() => {
  vi.resetAllMocks(); captcha.mockResolvedValue({ ok: true }); update.mockResolvedValue({ error: null });
  consume.mockResolvedValue({ available: true, lockedOut: false });
});
const input = { email: 'synthetic@example.invalid', otp: '123456', newPassword: 'Synthetic-Password123!' };
it('returns identical reset requests for existing and absent users', async () => {
  find.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'synthetic', app_metadata: {} });
  expect(await requestPasswordResetAction(input)).toEqual(await requestPasswordResetAction(input));
});
it('keeps wrong-code responses independent of account existence', async () => {
  find.mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'synthetic', app_metadata: {} });
  expect(await resetPasswordAction(input)).toEqual(await resetPasswordAction(input));
});
it('keeps successful password recovery', async () => {
  find.mockResolvedValue({ id: 'synthetic', app_metadata: { password_reset: {
    code_hash: 'hash:123456', expires_at: new Date(Date.now() + 60000).toISOString(), attempts: 0,
  } } });
  expect(await resetPasswordAction(input)).toMatchObject({ ok: true });
  expect(update).toHaveBeenCalledWith('synthetic', expect.objectContaining({ password: input.newPassword }));
  expect(reset).toHaveBeenCalled();
});
it('rejects a missing CAPTCHA before looking up the account', async () => {
  captcha.mockResolvedValue({ ok: false, reason: 'CAPTCHA requerido' });
  expect(await requestPasswordResetAction(input)).toMatchObject({ ok: false });
  expect(find).not.toHaveBeenCalled();
});

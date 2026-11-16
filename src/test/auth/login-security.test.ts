import { beforeEach, describe, expect, it, vi } from 'vitest';
const { signIn, signOut, getUser, maybeSingle } = vi.hoisted(() => ({
  signIn: vi.fn(), signOut: vi.fn(), getUser: vi.fn(), maybeSingle: vi.fn(),
}));
vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({
  auth: { signInWithPassword: signIn, signOut, getUser },
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }),
}) }));
vi.mock('@/features/auth/actions/otp-signup.actions', () => ({}));
import { AuthService } from '@/features/auth/services/auth.service';
const service = new AuthService();
beforeEach(() => { vi.resetAllMocks(); maybeSingle.mockResolvedValue({ data: null }); });
describe('local login boundary', () => {
  it.each(['Invalid login credentials', 'Email not confirmed', 'User not found'])('redacts %s', async (message) => {
    signIn.mockResolvedValue({ data: null, error: { message } });
    await expect(service.login({ email: 'synthetic@example.invalid', password: 'synthetic' }))
      .rejects.toThrow('No se pudo iniciar sesión. Revisa tus credenciales e inténtalo de nuevo.');
  });
  it('keeps valid login and forwards the CAPTCHA', async () => {
    signIn.mockResolvedValue({ data: { user: { id: 'synthetic-user' }, session: { access_token: 'fake', refresh_token: 'fake' } } });
    const result = await service.login({ email: 'synthetic@example.invalid', password: 'synthetic', captchaToken: 'fake-captcha' });
    expect(result.user.id).toBe('synthetic-user');
    expect(signIn).toHaveBeenCalledWith(expect.objectContaining({ options: { captchaToken: 'fake-captcha' } }));
  });
  it('calls SDK logout', async () => {
    signOut.mockResolvedValue({ error: null });
    await service.logout();
    expect(signOut).toHaveBeenCalledOnce();
  });
  it('does not restore an invalid session', async () => {
    vi.stubGlobal('window', {});
    getUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid JWT' } });
    expect(await service.getCurrentUser()).toBeNull();
    vi.stubGlobal('window', undefined);
  });
});

it('logs fixed validation/configuration categories without credentials', async () => {
  const log = vi.spyOn(console, 'warn').mockImplementation(() => {});
  for (const [code, category] of [['invalid_credentials', 'validation'], ['unexpected_failure', 'provider_or_configuration']]) {
    signIn.mockResolvedValue({ data: null, error: { code, message: 'sensitive-provider-detail' } });
    await service.login({ email: 'synthetic@example.invalid', password: 'synthetic-secret' }).catch(() => {});
    expect(log).toHaveBeenLastCalledWith('[auth] login_failed', { category });
  }
  expect(JSON.stringify(log.mock.calls)).not.toContain('synthetic-secret');
  expect(JSON.stringify(log.mock.calls)).not.toContain('sensitive-provider-detail');
  log.mockRestore();
});

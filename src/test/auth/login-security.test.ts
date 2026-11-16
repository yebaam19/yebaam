import { beforeEach, describe, expect, it, vi } from 'vitest';
const { signIn, signOut, getUser, maybeSingle, oauth } = vi.hoisted(() => ({
  oauth: vi.fn(), signIn: vi.fn(), signOut: vi.fn(), getUser: vi.fn(), maybeSingle: vi.fn(),
}));
vi.mock('@/utils/supabase/client', () => ({ createClient: () => ({
  auth: { signInWithOAuth: oauth, signInWithPassword: signIn, signOut, getUser },
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

it('Google uses a same-origin callback and preserves a legitimate profile destination', async () => {
  vi.stubGlobal('window', { location: { origin: 'http://localhost:3000' } });
  oauth.mockResolvedValue({ error: null });
  await service.loginWithGoogle('/ellis.cano?tab=mascotas');
  expect(oauth).toHaveBeenCalledWith({ provider: 'google', options: {
    redirectTo: 'http://localhost:3000/auth/callback?redirect=%2Fellis.cano%3Ftab%3Dmascotas',
  } });
  await service.loginWithGoogle('//evil.invalid');
  expect(oauth).toHaveBeenLastCalledWith({ provider: 'google', options: {
    redirectTo: 'http://localhost:3000/auth/callback?redirect=%2Ffeed',
  } });
  vi.stubGlobal('window', undefined);
});
it('OAuth completion rejects an absent provider user', async () => {
  vi.stubGlobal('window', {});
  getUser.mockResolvedValue({ data: { user: null } });
  expect(await service.completeOAuthLogin()).toBeNull();
  vi.stubGlobal('window', undefined);
});


describe('login destination warming', () => {
  const credentials = { email: 'synthetic@example.invalid', password: 'synthetic' };
  it('starts only after authentication and overlaps the pending profile read', async () => {
    let finishProfile!: (value: { data: { username: string } }) => void;
    maybeSingle.mockReturnValue(new Promise((resolve) => { finishProfile = resolve; }));
    signIn.mockResolvedValue({ data: { user: { id: 'synthetic-user' }, session: {} } });
    const ready = vi.fn();
    let completed = false;
    const result = service.login(credentials, ready).then((user) => { completed = true; return user; });
    expect(ready).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(maybeSingle).toHaveBeenCalledOnce());
    expect(ready).toHaveBeenCalledOnce();
    expect(ready).toHaveBeenCalledWith();
    expect(completed).toBe(false);
    finishProfile({ data: { username: 'real-profile-name' } });
    expect((await result).user.username).toBe('real-profile-name');
  });
  it('never warms a protected route for a rejected login', async () => {
    signIn.mockResolvedValue({ error: { code: 'invalid_credentials' } });
    const ready = vi.fn();
    await expect(service.login(credentials, ready)).rejects.toThrow();
    expect(ready).not.toHaveBeenCalled();
    expect(maybeSingle).not.toHaveBeenCalled();
  });
  it('does not turn a prefetch failure into a failed login', async () => {
    signIn.mockResolvedValue({ data: { user: { id: 'synthetic-user' }, session: {} } });
    const result = await service.login(credentials, () => { throw new Error('prefetch unavailable'); });
    expect(result.user.id).toBe('synthetic-user');
  });
});

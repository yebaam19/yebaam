import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

// --- Mocks ------------------------------------------------------------------
const pushMock = vi.fn();
const prefetchMock = vi.fn();
const loginMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, prefetch: prefetchMock }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'redirect' ? '//evil.com' : null),
  }),
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() },
}));

// Stub the Turnstile widget so the real Cloudflare script never loads.
vi.mock('@/components/auth/TurnstileWidget', () => ({
  TurnstileWidget: () => null,
}));

vi.mock('../store/auth.store', () => ({
  useAuthStore: () => ({ login: loginMock, isLoading: false, error: null }),
}));

import { LoginForm } from './login-form';

function submitLogin(email = 'user@example.com', password = 'Password123') {
  fireEvent.change(screen.getByLabelText('login.emailLabel'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('login.passwordLabel'), { target: { value: password } });
  fireEvent.click(screen.getByRole('button', { name: 'login.submit' }));
}

describe('LoginForm — login errors', () => {
  beforeEach(() => {
    // Disable Turnstile gating so submit reaches login() deterministically.
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '');
    pushMock.mockReset();
    prefetchMock.mockReset();
    loginMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('keeps failed login on the form without offering confirmation resend', async () => {
    loginMock.mockRejectedValueOnce(new Error('Error neutro'));
    render(<LoginForm />);
    submitLogin('user@example.com');
    await waitFor(() => expect(loginMock).toHaveBeenCalled());
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.queryByRole('link', { name: 'login.resendConfirmation' })).not.toBeInTheDocument();
  });

  it('does NOT redirect to /verify-email on a wrong-password error', async () => {
    loginMock.mockRejectedValueOnce(new Error('Invalid login credentials'));
    render(<LoginForm />);

    submitLogin('user@example.com');

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalled();
    });
    expect(pushMock).not.toHaveBeenCalledWith(expect.stringContaining('/verify-email'));
  });
});

describe('LoginForm — redirect sanitization', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '');
    pushMock.mockReset();
    prefetchMock.mockReset();
    loginMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('ignores ?redirect=//evil.com and lands on /feed after a successful login', async () => {
    loginMock.mockImplementationOnce(async (_credentials, ready) => { ready(); });
    render(<LoginForm />);

    submitLogin();

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/feed');
    });
    expect(pushMock).not.toHaveBeenCalledWith(expect.stringContaining('evil.com'));
    expect(prefetchMock).toHaveBeenCalledWith('/feed');
  });
});


it('prevents duplicate submits while authentication/profile is pending', () => {
  vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '');
  loginMock.mockReset().mockReturnValue(new Promise(() => {}));
  render(<LoginForm />);
  submitLogin();
  const button = screen.getByRole('button', { name: 'login.submitting' });
  expect(button).toBeDisabled();
  fireEvent.submit(button.closest('form')!);
  expect(loginMock).toHaveBeenCalledOnce();
  vi.unstubAllEnvs();
});


it('keeps feedback visible while the destination navigation is pending', async () => {
  vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '');
  loginMock.mockReset().mockResolvedValue(undefined);
  let finishNavigation!: () => void;
  pushMock.mockImplementationOnce(() => new Promise<void>((resolve) => { finishNavigation = resolve; }));
  render(<LoginForm />);
  submitLogin();
  await waitFor(() => expect(finishNavigation).toBeDefined());
  expect(screen.getByRole('button', { name: 'login.submitting' })).toBeDisabled();
  await act(async () => { finishNavigation(); });
  vi.unstubAllEnvs();
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

// --- Mocks ------------------------------------------------------------------
const pushMock = vi.fn();
const loginMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
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

describe('LoginForm — unverified-email recovery', () => {
  beforeEach(() => {
    // Disable Turnstile gating so submit reaches login() deterministically.
    vi.stubEnv('NEXT_PUBLIC_TURNSTILE_SITE_KEY', '');
    pushMock.mockReset();
    loginMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('offers confirmation resend to everyone without disclosing account state', async () => {
    loginMock.mockRejectedValueOnce(new Error('Error neutro'));
    render(<LoginForm />);
    submitLogin('user@example.com');
    await waitFor(() => expect(loginMock).toHaveBeenCalled());
    expect(pushMock).not.toHaveBeenCalled();
    const link = screen.getByRole('link', { name: 'login.resendConfirmation' });
    expect(link.getAttribute('href')).toContain('/verify-email?email=user%40example.com');
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
    loginMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('ignores ?redirect=//evil.com and lands on /feed after a successful login', async () => {
    loginMock.mockResolvedValueOnce(undefined);
    render(<LoginForm />);

    submitLogin();

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/feed');
    });
    expect(pushMock).not.toHaveBeenCalledWith(expect.stringContaining('evil.com'));
  });
});

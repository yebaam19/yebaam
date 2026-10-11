import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/features/auth/context/auth-context';
import { useAuthStore } from '@/features/auth/store/auth.store';

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), readProfile: vi.fn() }));
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: { getUser: mocks.getUser },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.readProfile }) }) }),
  }),
}));
vi.mock('@/features/auth/actions/otp-signup.actions', () => ({}));
vi.mock('@/socket/socket-client', () => ({ socketManager: {} }));
vi.mock('@/utils/supabase/realtime', () => ({}));
vi.mock('@/features/auth/hooks/useAuthSync', () => ({ useAuthSync: vi.fn() }));
vi.mock('@/components/ServerErrorPage', () => ({
  default: ({ onRetry }: { onRetry: () => void }) => <button onClick={onRetry}>Reintentar</button>,
}));

const unavailable = {
  data: { user: null },
  error: { name: 'AuthRetryableFetchError', status: 503, message: 'Service unavailable' },
};
const signedOut = {
  data: { user: null },
  error: { name: 'AuthSessionMissingError', status: 400, message: 'Auth session missing!' },
};

function Status() {
  const { isInitialized, isAuthenticated } = useAuth();
  return <p>{!isInitialized ? 'Comprobando' : isAuthenticated ? 'Con sesión' : 'Sin sesión'}</p>;
}

beforeEach(() => {
  vi.useFakeTimers();
  mocks.getUser.mockReset().mockResolvedValue(signedOut);
  mocks.readProfile.mockReset().mockResolvedValue({ data: null, error: null });
  useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false, error: null });
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it('propagates a returned SDK outage through the real service and store to the provider', async () => {
  mocks.getUser.mockResolvedValue(unavailable);
  render(<AuthProvider><Status /></AuthProvider>);
  await act(async () => {});

  for (const delayMs of [1000, 2000, 4000]) {
    expect(screen.getByText('Comprobando')).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(delayMs); });
  }

  expect(mocks.getUser).toHaveBeenCalledTimes(4);
  expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  expect(mocks.readProfile).not.toHaveBeenCalled();

  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Reintentar' })); });
  expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  expect(mocks.getUser).toHaveBeenCalledTimes(5);

  mocks.getUser.mockResolvedValue(signedOut);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Reintentar' })); });
  expect(screen.getByText('Sin sesión')).toBeInTheDocument();
});

it('stops retrying when a session lookup recovers and hydrates the user', async () => {
  mocks.getUser.mockResolvedValueOnce(unavailable).mockResolvedValue({
    data: { user: { id: 'viewer', email: 'viewer@example.test' } }, error: null,
  });
  render(<AuthProvider><Status /></AuthProvider>);
  await act(async () => { await vi.advanceTimersByTimeAsync(1000); });

  expect(screen.getByText('Con sesión')).toBeInTheDocument();
  expect(useAuthStore.getState().user?.id).toBe('viewer');
  await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
  expect(mocks.getUser).toHaveBeenCalledTimes(2);
  expect(mocks.readProfile).toHaveBeenCalledTimes(1);
});

it.each([
  signedOut,
  { data: { user: null }, error: { name: 'AuthApiError', status: 401, message: 'Invalid JWT' } },
])('treats missing or invalid sessions as signed out without retrying', async (response) => {
  mocks.getUser.mockResolvedValue(response);
  render(<AuthProvider><Status /></AuthProvider>);
  await act(async () => { await vi.advanceTimersByTimeAsync(10000); });

  expect(screen.getByText('Sin sesión')).toBeInTheDocument();
  expect(mocks.getUser).toHaveBeenCalledTimes(1);
});

it('keeps checkAuth non-throwing for existing callers during an outage', async () => {
  mocks.getUser.mockResolvedValue(unavailable);
  await expect(useAuthStore.getState().checkAuth()).resolves.toBeUndefined();
  expect(useAuthStore.getState()).toMatchObject({
    user: null, isAuthenticated: false, isLoading: false, error: null,
  });
});

it('propagates rejected transport calls when the provider requests retries', async () => {
  const failure = new TypeError('Failed to fetch');
  mocks.getUser.mockRejectedValue(failure);
  await expect(useAuthStore.getState().checkAuth({ throwOnConnectionError: true })).rejects.toBe(failure);
  expect(useAuthStore.getState().isLoading).toBe(false);
});

it('does not retry unrelated failures', async () => {
  mocks.getUser.mockRejectedValue(new Error('Invalid credentials'));
  await expect(useAuthStore.getState().checkAuth({ throwOnConnectionError: true })).resolves.toBeUndefined();
  expect(useAuthStore.getState().isAuthenticated).toBe(false);
});

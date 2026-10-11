import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '@/features/auth/context/auth-context';

const mocks = vi.hoisted(() => ({ checkAuth: vi.fn() }));
vi.mock('@/features/auth/store/auth.store', () => ({
  useAuthStore: () => ({ checkAuth: mocks.checkAuth }),
}));
vi.mock('@/features/auth/hooks/useAuthSync', () => ({ useAuthSync: vi.fn() }));
vi.mock('@/components/ServerErrorPage', () => ({
  default: ({ onRetry }: { onRetry: () => void }) => <button onClick={onRetry}>Reintentar</button>,
}));

function Status() {
  const { isInitialized } = useAuth();
  return <p>{isInitialized ? 'Inicializado' : 'Comprobando'}</p>;
}

beforeEach(() => {
  vi.useFakeTimers();
  mocks.checkAuth.mockReset().mockResolvedValue(undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it('initializes once without checking again on rerender', async () => {
  const view = render(<AuthProvider><Status /></AuthProvider>);
  await act(async () => {});
  expect(screen.getByText('Inicializado')).toBeInTheDocument();

  view.rerender(<AuthProvider><Status /></AuthProvider>);
  expect(mocks.checkAuth).toHaveBeenCalledTimes(1);
});

it('limits connection retries and supports a manual retry afterward', async () => {
  mocks.checkAuth.mockRejectedValue(new Error('Network error'));
  render(<AuthProvider><Status /></AuthProvider>);
  await act(async () => {});

  for (const delay of [1000, 2000, 4000]) {
    expect(screen.getByText('Comprobando')).toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(delay); });
  }

  expect(mocks.checkAuth).toHaveBeenCalledTimes(4);
  expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
  expect(mocks.checkAuth).toHaveBeenCalledTimes(4);

  mocks.checkAuth.mockResolvedValue(undefined);
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Reintentar' })); });
  expect(screen.getByText('Inicializado')).toBeInTheDocument();
  expect(mocks.checkAuth).toHaveBeenCalledTimes(5);
});

it('cancels a scheduled retry on unmount', async () => {
  mocks.checkAuth.mockRejectedValue(new Error('fetch failed'));
  const view = render(<AuthProvider><Status /></AuthProvider>);
  await act(async () => {});

  view.unmount();
  await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
  expect(mocks.checkAuth).toHaveBeenCalledTimes(1);
});

it('does not schedule a retry if a pending check rejects after unmount', async () => {
  let rejectCheck: (error: Error) => void = () => undefined;
  mocks.checkAuth.mockReturnValue(new Promise((_, reject) => { rejectCheck = reject; }));
  const view = render(<AuthProvider><Status /></AuthProvider>);
  view.unmount();

  await act(async () => { rejectCheck(new Error('Network error')); });
  await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
  expect(mocks.checkAuth).toHaveBeenCalledTimes(1);
});

it('handles a non-Error rejection without crashing or retrying', async () => {
  mocks.checkAuth.mockRejectedValue(null);
  render(<AuthProvider><Status /></AuthProvider>);
  await act(async () => {});
  expect(screen.getByText('Inicializado')).toBeInTheDocument();
  expect(mocks.checkAuth).toHaveBeenCalledTimes(1);
});

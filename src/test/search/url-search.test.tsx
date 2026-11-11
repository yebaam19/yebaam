import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useUrlSearch } from '@/lib/hooks/useUrlSearch';

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => window.location.pathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
beforeEach(() => {
  vi.useFakeTimers(); replace.mockReset();
  window.history.replaceState(null, '', '/cities?country=CO&page=2');
});
afterEach(() => vi.useRealTimers());

it('debounces typing, preserves filters, resets the page and deduplicates immediate submit', () => {
  const { result } = renderHook(() => useUrlSearch());
  act(() => result.current.changeQuery('Esta'));
  act(() => vi.advanceTimersByTime(100));
  act(() => result.current.changeQuery('Estados Unidos'));
  act(() => vi.advanceTimersByTime(300));
  expect(replace).toHaveBeenCalledTimes(1);
  const url = new URL(replace.mock.calls[0][0], window.location.origin);
  expect(url.searchParams.get('q')).toBe('Estados Unidos');
  expect(url.searchParams.get('country')).toBe('CO');
  expect(url.searchParams.has('page')).toBe(false);
  act(() => result.current.submit());
  expect(replace).toHaveBeenCalledTimes(1);
});

it('merges rapid filter changes with the latest text without restoring old filters', () => {
  const { result } = renderHook(() => useUrlSearch());
  act(() => result.current.changeQuery('tex'));
  act(() => result.current.setFilters({ country: 'US', state: null }));
  act(() => result.current.setFilters({ state: 'texas-id' }));
  act(() => vi.advanceTimersByTime(300));
  expect(replace).toHaveBeenCalledTimes(2);
  const url = new URL(replace.mock.calls[1][0], window.location.origin);
  expect(url.searchParams.get('country')).toBe('US');
  expect(url.searchParams.get('state')).toBe('texas-id');
  expect(url.searchParams.get('q')).toBe('tex');
});

it('cancels pending input on history navigation and restores the URL query', () => {
  const { result } = renderHook(() => useUrlSearch());
  act(() => result.current.changeQuery('outdated'));
  act(() => {
    window.history.replaceState(null, '', '/cities?country=ES&q=Madrid');
    window.dispatchEvent(new PopStateEvent('popstate'));
  });
  expect(result.current.query).toBe('Madrid');
  act(() => vi.advanceTimersByTime(400));
  expect(replace).not.toHaveBeenCalled();
});

it('does not navigate after unmount during the debounce window', () => {
  const { result, unmount } = renderHook(() => useUrlSearch());
  act(() => result.current.changeQuery('Miami'));
  unmount();
  act(() => vi.advanceTimersByTime(400));
  expect(replace).not.toHaveBeenCalled();
});

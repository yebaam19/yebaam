import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useDebouncedCallback, useThrottledCallback } from '@/lib/hooks/useScheduledCallback';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('coalesces edits and executes the latest committed callback without resetting on unrelated renders', () => {
  const spy = vi.fn();
  const { result, rerender } = renderHook(({ country }) =>
    useDebouncedCallback((query: string) => spy(query, country), 300), { initialProps: { country: 'US' } });
  act(() => result.current('a'));
  act(() => vi.advanceTimersByTime(100));
  act(() => result.current('austin'));
  rerender({ country: 'ES' });
  act(() => vi.advanceTimersByTime(299));
  expect(spy).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1));
  expect(spy).toHaveBeenCalledExactlyOnceWith('austin', 'ES');
});

it('supports immediate flush and cancels work on explicit cancel, delay changes and unmount', () => {
  const spy = vi.fn();
  const { result, rerender, unmount } = renderHook(({ delay }) => useDebouncedCallback(spy, delay), { initialProps: { delay: 300 } });
  act(() => { result.current('submit'); result.current.flush(); });
  expect(spy).toHaveBeenCalledExactlyOnceWith('submit');
  act(() => { result.current('cancel'); result.current.cancel(); });
  act(() => vi.advanceTimersByTime(300));
  act(() => result.current('old delay'));
  rerender({ delay: 500 });
  act(() => vi.advanceTimersByTime(500));
  act(() => result.current('unmounted'));
  unmount();
  act(() => vi.advanceTimersByTime(500));
  expect(spy).toHaveBeenCalledTimes(1);
});

it('throttles continuous events while delivering the latest trailing value', () => {
  const spy = vi.fn();
  const { result, unmount } = renderHook(() => useThrottledCallback(spy, 100));
  act(() => { result.current(1); result.current(2); result.current(3); });
  expect(spy).toHaveBeenCalledExactlyOnceWith(1);
  act(() => vi.advanceTimersByTime(100));
  expect(spy).toHaveBeenLastCalledWith(3);
  expect(spy).toHaveBeenCalledTimes(2);
  act(() => { result.current(4); result.current(5); });
  expect(spy).toHaveBeenCalledTimes(3);
  unmount();
  act(() => vi.advanceTimersByTime(100));
  expect(spy).toHaveBeenCalledTimes(3);
  expect(spy).not.toHaveBeenCalledWith(5);
});

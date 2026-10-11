import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useSearch } from '@/features/search/hooks/useSearch';
import type { AggregatedSearchResults } from '@/features/search/interfaces/search.interfaces';

const { fetchResults } = vi.hoisted(() => ({ fetchResults: vi.fn() }));
vi.mock('@/features/search/services/search.service', () => ({ fetchSearchResults: fetchResults }));
const empty: AggregatedSearchResults = {
  users: [], pages: [], posts: [], articles: [], events: [], auditions: [],
};

beforeEach(() => { vi.useFakeTimers(); fetchResults.mockReset(); });
afterEach(() => vi.useRealTimers());

it('debounces requests, aborts replaced queries, and ignores late results', async () => {
  const pending: Array<{ resolve: (value: AggregatedSearchResults) => void; signal: AbortSignal }> = [];
  fetchResults.mockImplementation((_q, _type, signal) => new Promise((resolve) => pending.push({ resolve, signal })));
  const { result } = renderHook(() => useSearch());
  act(() => result.current.search('primera'));
  expect(fetchResults).not.toHaveBeenCalled();
  await act(async () => vi.advanceTimersByTime(300));
  expect(result.current.loading).toBe(true);
  act(() => result.current.search('segunda'));
  await act(async () => vi.advanceTimersByTime(300));
  expect(pending[0].signal.aborted).toBe(true);
  await act(async () => pending[1].resolve(empty));
  expect(result.current.loading).toBe(false);
  expect(result.current.results).toEqual(empty);
  await act(async () => pending[0].resolve({ ...empty, users: [{ id: 'old' }] } as AggregatedSearchResults));
  expect(result.current.results).toEqual(empty);
  act(() => result.current.clear());
  expect(result.current.results).toBeNull();
  expect(result.current.loading).toBe(false);
});

it('settles errors and clears them when input falls below the search threshold', async () => {
  fetchResults.mockRejectedValue(new Error('Sin conexión'));
  const { result } = renderHook(() => useSearch());
  act(() => result.current.search('consulta'));
  await act(async () => vi.advanceTimersByTime(300));
  expect(result.current.error?.message).toBe('Sin conexión');
  expect(result.current.loading).toBe(false);
  act(() => result.current.setQuery('c'));
  expect(result.current.error).toBeNull();
  expect(result.current.results).toBeNull();
  expect(result.current.loading).toBe(false);
});

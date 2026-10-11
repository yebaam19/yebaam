import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedMusicSearch } from '@/features/music-archive/hooks/useDebouncedMusicSearch';

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('debounced music search', () => {
  it('discards an old response after the query changes, and clears below the minimum', async () => {
    vi.useFakeTimers();
    let resolveOld!: (value: { ok: true; data: string[] }) => void;
    const search = vi.fn()
      .mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }))
      .mockResolvedValueOnce({ ok: true, data: ['new'] });
    const { result, rerender } = renderHook(({ query }) => useDebouncedMusicSearch<string>(query, search), {
      initialProps: { query: 'old' },
    });
    await act(() => vi.advanceTimersByTimeAsync(300));
    rerender({ query: 'new' });
    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(result.current.results).toEqual(['new']);
    await act(async () => { resolveOld({ ok: true, data: ['old'] }); });
    expect(result.current.results).toEqual(['new']);
    rerender({ query: 'a' });
    expect(result.current).toMatchObject({ results: [], loading: false, hasQuery: false });
  });
  it('coalesces edits and cancels searches when unmounted during debounce', async () => {
    vi.useFakeTimers();
    const search = vi.fn().mockResolvedValue({ ok: true, data: [] });
    const { rerender, unmount } = renderHook(({ query }) => useDebouncedMusicSearch(query, search), {
      initialProps: { query: 'one' },
    });
    rerender({ query: 'two' });
    await act(() => vi.advanceTimersByTimeAsync(299));
    expect(search).not.toHaveBeenCalled();
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(search).not.toHaveBeenCalled();
  });
});

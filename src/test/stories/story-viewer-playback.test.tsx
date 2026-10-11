import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStoryViewer } from '@/app/(app)/stories/hooks/useStoryViewer';

const mocks = vi.hoisted(() => {
  const story = (id: string) => ({ id, type: 'image' as const, duration: 15 });
  return {
    router: { push: vi.fn() },
    state: {
      friendsStories: [
        { userId: 'first', stories: [story('first-1'), story('first-2')] },
        { userId: 'second', stories: [story('second-1')] },
      ],
      myStories: [story('mine')],
      viewStory: vi.fn(), isLoading: false,
      fetchMyStories: vi.fn(async () => {}), fetchFriendsStories: vi.fn(async () => {}),
    },
  };
});
vi.mock('next/navigation', () => ({ useRouter: () => mocks.router }));
vi.mock('@/app/(app)/stories/hooks/useStorySocket', () => ({ useStorySocket: vi.fn() }));
vi.mock('@/app/(app)/stories/store', () => ({
  useStoryStore: Object.assign(() => mocks.state, { getState: () => mocks.state }),
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});
afterEach(() => vi.useRealTimers());

describe('story viewer playback', () => {
  it('starts at the deep-linked user and navigates exactly once after the final story', () => {
    const { result, unmount } = renderHook(() => useStoryViewer('second'));
    expect(result.current.currentStory.id).toBe('second-1');
    expect(mocks.state.viewStory).toHaveBeenCalledWith('second-1');
    act(() => vi.advanceTimersByTime(15000));
    expect(mocks.router.push).toHaveBeenCalledExactlyOnceWith('/feed');
    act(() => vi.advanceTimersByTime(15000));
    expect(mocks.router.push).toHaveBeenCalledTimes(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('preserves elapsed progress while paused and resets on automatic and manual navigation', () => {
    const { result } = renderHook(() => useStoryViewer('first'));
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.progress).toBeCloseTo(100 / 3);
    act(() => result.current.setIsPaused(true));
    act(() => vi.advanceTimersByTime(20000));
    expect(result.current.currentStory.id).toBe('first-1');
    expect(result.current.progress).toBeCloseTo(100 / 3);
    act(() => result.current.setIsPaused(false));
    act(() => vi.advanceTimersByTime(10000));
    expect(result.current.currentStory.id).toBe('first-2');
    expect(result.current.progress).toBe(0);
    act(() => vi.advanceTimersByTime(1000));
    act(() => result.current.handleNext());
    expect(result.current.currentStory.id).toBe('second-1');
    expect(result.current.progress).toBe(0);
    act(() => result.current.handlePrevious());
    expect(result.current.currentStory.id).toBe('first-1');
    expect(result.current.progress).toBe(0);
  });

  it('keeps the selected friend when view receipts refresh the store list', () => {
    const { result, rerender } = renderHook(() => useStoryViewer('first'));
    act(() => result.current.handleNext());
    act(() => result.current.handleNext());
    mocks.state.friendsStories = mocks.state.friendsStories.map((user) => ({ ...user }));
    rerender();
    expect(result.current.currentUser?.userId).toBe('second');
  });
});

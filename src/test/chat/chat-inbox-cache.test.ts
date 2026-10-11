import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useChatStore } from '@/features/chat/store/chat.store';
import { chatService } from '@/features/chat/services/chat.service';

vi.mock('@/features/auth/store/auth.store', () => ({ useAuthStore: create(() => ({ user: null })) }));
vi.mock('@/features/chat/services/chat.service', () => ({ chatService: { getConversations: vi.fn() } }));
const load = vi.mocked(chatService.getConversations);
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-11T12:00:00Z'));
  useAuthStore.setState({ user: null });
  useAuthStore.setState({ user: { id: 'viewer' } as never });
  load.mockResolvedValue([]);
});
afterEach(() => vi.useRealTimers());
describe('inbox request reuse', () => {
  it('reuses even an empty inbox during repeated mounts and refreshes when stale', async () => {
    await useChatStore.getState().loadConversations();
    await useChatStore.getState().loadConversations();
    expect(load).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(15_001);
    await useChatStore.getState().loadConversations();
    expect(load).toHaveBeenCalledTimes(2);
  });
  it('permits an explicit refresh for a newly discovered conversation', async () => {
    await useChatStore.getState().loadConversations();
    await useChatStore.getState().loadConversations(true);
    expect(load).toHaveBeenCalledTimes(2);
  });
  it('coalesces concurrent loads', async () => {
    let done!: (value: never[]) => void;
    load.mockReturnValue(new Promise((resolve) => { done = resolve; }));
    const first = useChatStore.getState().loadConversations();
    const second = useChatStore.getState().loadConversations();
    expect(load).toHaveBeenCalledTimes(1);
    done([]);
    await Promise.all([first, second]);
  });
  it('discards old-account responses and clears conversations on logout', async () => {
    let done!: (value: never[]) => void;
    load.mockReturnValueOnce(new Promise((resolve) => { done = resolve; }));
    const first = useChatStore.getState().loadConversations();
    useAuthStore.setState({ user: { id: 'other' } as never });
    await useChatStore.getState().loadConversations();
    done([{ id: 'private-thread' }] as never[]);
    await first;
    expect(useChatStore.getState().conversations).toEqual([]);
    useAuthStore.setState({ user: null });
    await useChatStore.getState().loadConversations();
    expect(load).toHaveBeenCalledTimes(2);
  });
});

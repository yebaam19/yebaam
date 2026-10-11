import { renderHook, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useMessengerSidebar } from '@/components/chat/hooks/useMessengerSidebar';

const mocks = vi.hoisted(() => ({
  conversations: [{ id: 'room', participantIds: ['me', 'peer'], type: 'direct', name: 'Peer', avatar: null, lastMessage: null, unreadCount: 0 }],
  profiles: vi.fn(), noop: vi.fn(),
}));
vi.mock('@/features/chat/hooks/useChat', () => ({ useChat: () => ({ conversations: mocks.conversations, isLoadingConversations: false }) }));
vi.mock('@/features/auth/store/auth.store', () => ({ useAuthStore: () => ({ user: { id: 'me' } }) }));
vi.mock('@/features/chat/store/chat.store', () => ({ useChatStore: (select: (state: unknown) => unknown) => select({ resetUnreadCount: mocks.noop }) }));
vi.mock('@/features/presence/store/presence.store', () => ({ usePresenceStore: (select: (state: unknown) => unknown) => select({ isUserOnline: () => false }) }));
vi.mock('@/lib/utils/date-fns-locale', () => ({ useDateFnsLocale: () => undefined }));
vi.mock('@/utils/supabase/client', () => ({ supabase: { from: () => ({ select: () => ({ in: mocks.profiles }) }) } }));
it('fetches profiles when membership changes, not on every message or read receipt', async () => {
  mocks.profiles.mockResolvedValue({ data: [{ id: 'peer', username: 'peer' }] });
  const { rerender } = renderHook(() => useMessengerSidebar());
  await waitFor(() => expect(mocks.profiles).toHaveBeenCalledTimes(1));
  mocks.conversations = [{ ...mocks.conversations[0], unreadCount: 2 }];
  rerender();
  expect(mocks.profiles).toHaveBeenCalledTimes(1);
  mocks.conversations = [{ ...mocks.conversations[0], participantIds: ['me', 'peer', 'new-peer'] }];
  rerender();
  await waitFor(() => expect(mocks.profiles).toHaveBeenCalledTimes(2));
  expect(mocks.profiles).toHaveBeenLastCalledWith('id', ['new-peer', 'peer']);
});

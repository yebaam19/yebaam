import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useChatSocket } from '@/features/chat/hooks/useChatSocket';
import type { DbMessageRow } from '@/features/chat/lib/messageRows';
import type { MessageReceivedEvent } from '@/features/chat/types';

const mocks = vi.hoisted(() => ({
  auth: { user: { id: 'viewer' } },
  chat: { conversations: [{ id: 'allowed' }] },
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
  decrypt: vi.fn(),
}));
vi.mock('@/features/auth/store/auth.store', () => ({
  useAuthStore: (select: (state: typeof mocks.auth) => unknown) => select(mocks.auth),
}));
vi.mock('@/features/chat/store/chat.store', () => ({
  useChatStore: (select: (state: typeof mocks.chat) => unknown) => select(mocks.chat),
}));
vi.mock('@/utils/supabase/realtime', () => ({
  subscribeToTable: mocks.subscribe,
  unsubscribe: mocks.unsubscribe,
}));
vi.mock('@/features/chat/lib/messageCipher', () => ({
  isEncryptedContent: (content: string) => content.startsWith('encrypted:'),
  fetchDecryptedContent: mocks.decrypt,
}));

const row: DbMessageRow = {
  id: 'message', conversation_id: 'allowed', sender_id: 'peer', content: 'hello',
  media: null, status: 'sent', reply_to_id: null, is_deleted: false,
  created_at: '2026-10-11T12:00:00Z', updated_at: '2026-10-11T12:00:00Z',
};
type Subscription = { table: string; onChange: (payload: { new: DbMessageRow }) => void };
function messageSubscription(): Subscription {
  return mocks.subscribe.mock.calls.map(([options]) => options as Subscription)
    .find((options) => options.table === 'messages')!;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.chat.conversations = [{ id: 'allowed' }];
  mocks.subscribe.mockImplementation((options: Subscription) => ({ table: options.table }));
});

describe('chat realtime lifecycle', () => {
  it('delivers to the committed callback and updates membership without duplicate subscriptions', () => {
    const initial = vi.fn<(event: MessageReceivedEvent) => void>();
    const latest = vi.fn<(event: MessageReceivedEvent) => void>();
    const { rerender, unmount } = renderHook(
      ({ receive }) => useChatSocket({ onMessageReceived: receive }),
      { initialProps: { receive: initial } },
    );
    const subscription = messageSubscription();
    act(() => subscription.onChange({ new: row }));
    expect(initial).toHaveBeenCalledTimes(1);

    mocks.chat.conversations = [{ id: 'other' }];
    rerender({ receive: latest });
    act(() => subscription.onChange({ new: row }));
    expect(latest).not.toHaveBeenCalled();
    act(() => subscription.onChange({ new: { ...row, conversation_id: 'other' } }));
    expect(latest).toHaveBeenCalledTimes(1);
    expect(initial).toHaveBeenCalledTimes(1);
    expect(mocks.subscribe).toHaveBeenCalledTimes(2);
    unmount();
    expect(mocks.unsubscribe).toHaveBeenCalledTimes(2);
  });

  it('only delivers encrypted text after the membership-gated decryption succeeds', async () => {
    const receive = vi.fn();
    mocks.decrypt.mockResolvedValueOnce(null).mockResolvedValueOnce('plain text');
    renderHook(() => useChatSocket({ onMessageReceived: receive }));
    const subscription = messageSubscription();
    await act(async () => subscription.onChange({ new: { ...row, content: 'encrypted:value' } }));
    expect(receive).not.toHaveBeenCalled();
    await act(async () => subscription.onChange({ new: { ...row, content: 'encrypted:value' } }));
    expect(mocks.decrypt).toHaveBeenCalledWith('allowed', 'message');
    expect(receive.mock.calls[0][0].message.content).toBe('plain text');
  });
});

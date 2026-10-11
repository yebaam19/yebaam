import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { create } from 'zustand';
import { useOutgoingMessages } from '@/features/chat/hooks/useOutgoingMessages';
import { enqueueMessage, retryMessage, useOutgoingMessagesStore } from '@/features/chat/store/outgoing-messages.store';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { chatService } from '@/features/chat/services/chat.service';
import type { ChatMessage, Message } from '@/features/chat/types';

vi.mock('@/features/auth/store/auth.store', () => ({ useAuthStore: create(() => ({ user: { id: 'me' } })) }));
vi.mock('@/features/chat/services/chat.service', () => ({ chatService: { sendMessage: vi.fn() } }));
const send = vi.mocked(chatService.sendMessage);
const received: ChatMessage[] = [];
function deferred() {
  let resolve!: (message: Message) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Message>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
beforeEach(() => {
  vi.clearAllMocks();
  useOutgoingMessagesStore.setState({ messages: [] });
  useAuthStore.setState({ user: { id: 'me' } as never });
});

describe('immediate chat delivery', () => {
  it('accepts several messages before any network response and keeps them across closing the window', async () => {
    const pending = deferred();
    send.mockReturnValue(pending.promise);
    const hook = renderHook(() => useOutgoingMessages('room', received));
    await act(async () => {
      expect(await hook.result.current.sendMessage('one')).toBe(true);
      expect(await hook.result.current.sendMessage('two')).toBe(true);
    });
    expect(hook.result.current.messages.map((m) => m.content)).toEqual(['one', 'two']);
    expect(new Set(hook.result.current.messages.map((m) => m.id)).size).toBe(2);
    expect(hook.result.current.messages.every((m) => m.status === 'sending')).toBe(true);
    hook.unmount();
    const reopened = renderHook(() => useOutgoingMessages('room', received));
    expect(reopened.result.current.messages).toHaveLength(2);
  });

  it('retains failed content and reuses the original id even after a lost acknowledgement', async () => {
    const first = deferred();
    send.mockReturnValueOnce(first.promise);
    const hook = renderHook(() => useOutgoingMessages('room', received));
    await act(async () => { await hook.result.current.sendMessage('keep this'); });
    const original = hook.result.current.messages[0];
    await act(async () => first.reject(new Error('lost response')));
    expect(hook.result.current.messages[0].status).toBe('failed');
    const retry = deferred();
    send.mockReturnValue(retry.promise);
    act(() => { retryMessage(original.id); retryMessage(original.id); });
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][4]).toBe(original.id);
    await act(async () => retry.resolve({ ...original, status: 'sent' } as Message));
    expect(hook.result.current.messages).toHaveLength(1);
    expect(hook.result.current.messages[0].status).toBe('sent');
  });

  it('deduplicates realtime arriving before HTTP and preserves the read status', async () => {
    const pending = deferred();
    send.mockReturnValue(pending.promise);
    const hook = renderHook(({ rows }) => useOutgoingMessages('room', rows), { initialProps: { rows: received } });
    await act(async () => { await hook.result.current.sendMessage('hello'); });
    const original = hook.result.current.messages[0];
    hook.rerender({ rows: [{ ...original, status: 'read', isTemporary: false }] });
    await act(async () => pending.resolve({ ...original, status: 'sent' } as Message));
    expect(hook.result.current.messages).toHaveLength(1);
    expect(hook.result.current.messages[0].status).toBe('read');
    expect(useOutgoingMessagesStore.getState().messages).toHaveLength(0);
  });

  it('moves confirmed sends into editable history and releases the outbox entry', async () => {
    const pending = deferred();
    send.mockReturnValue(pending.promise);
    const hook = renderHook(() => {
      const [history, setHistory] = useState<ChatMessage[]>([]);
      return { ...useOutgoingMessages('room', history, setHistory), history, setHistory };
    });
    await act(async () => { await hook.result.current.sendMessage('original'); });
    const original = hook.result.current.messages[0];
    await act(async () => pending.resolve({ ...original, status: 'sent' } as Message));
    expect(hook.result.current.history).toHaveLength(1);
    expect(useOutgoingMessagesStore.getState().messages).toHaveLength(0);
    act(() => hook.result.current.setHistory((rows) => rows.map((row) => ({ ...row, content: 'edited' }))));
    expect(hook.result.current.messages[0].content).toBe('edited');
  });

  it('does not mix threads or retain private drafts after an account change', async () => {
    const pending = deferred();
    send.mockReturnValue(pending.promise);
    const hook = renderHook(({ id }) => useOutgoingMessages(id, received), { initialProps: { id: 'room' } });
    await act(async () => { await hook.result.current.sendMessage('private'); });
    const original = hook.result.current.messages[0];
    hook.rerender({ id: 'another-room' });
    expect(hook.result.current.messages).toEqual([]);
    act(() => useAuthStore.setState({ user: { id: 'other' } as never }));
    await act(async () => pending.resolve({ ...original, status: 'sent' } as Message));
    await waitFor(() => expect(useOutgoingMessagesStore.getState().messages).toEqual([]));
    expect(enqueueMessage(null, 'invalid')).toBe(false);
  });
});

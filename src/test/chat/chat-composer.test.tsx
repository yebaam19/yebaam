import { act, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useChatBubbleInput } from '@/components/chat/ChatBubble/ChatBubbleInput/useChatBubbleInput';
import type { ChangeEvent, KeyboardEvent } from 'react';

vi.mock('next-intl', () => ({ useTranslations: () => (key: string) => key }));
vi.mock('@/features/chat/hooks/useUploadChatMedia', () => ({
  useUploadChatMedia: () => ({ uploadMedia: vi.fn(), isUploading: false, uploadProgress: 0 }),
  MediaType: { IMAGE: 'image', AUDIO: 'audio', FILE: 'file' }, toMessageMedia: vi.fn(),
}));
const change = (value: string) => ({ target: { value } }) as ChangeEvent<HTMLTextAreaElement>;
it('clears accepted messages, releases the composer and keeps the next draft', async () => {
  const send = vi.fn().mockResolvedValue(true);
  const hook = renderHook(() => useChatBubbleInput({ onSendMessage: send, onTypingChange: vi.fn(), onStopTyping: vi.fn() }));
  act(() => hook.result.current.handleInputChange(change('first')));
  await act(async () => hook.result.current.handleSubmit({ preventDefault: vi.fn() } as never));
  expect(hook.result.current.message).toBe('');
  expect(hook.result.current.isSending).toBe(false);
  act(() => hook.result.current.handleInputChange(change('next draft')));
  expect(hook.result.current.message).toBe('next draft');
  expect(send).toHaveBeenCalledWith('first', undefined);
});
it('keeps the draft when no conversation is ready', async () => {
  const hook = renderHook(() => useChatBubbleInput({ onSendMessage: async () => false, onTypingChange: vi.fn(), onStopTyping: vi.fn() }));
  act(() => hook.result.current.handleInputChange(change('retain')));
  await act(async () => hook.result.current.handleSubmit({ preventDefault: vi.fn() } as never));
  expect(hook.result.current.message).toBe('retain');
  expect(hook.result.current.isSending).toBe(false);
});
it('does not send Enter while an IME composition is active', () => {
  const send = vi.fn();
  const hook = renderHook(() => useChatBubbleInput({ onSendMessage: send, onTypingChange: vi.fn(), onStopTyping: vi.fn() }));
  act(() => hook.result.current.handleInputChange(change('文字')));
  act(() => hook.result.current.handleKeyDown({ key: 'Enter', nativeEvent: { isComposing: true }, preventDefault: vi.fn() } as unknown as KeyboardEvent<HTMLTextAreaElement>));
  expect(send).not.toHaveBeenCalled();
});

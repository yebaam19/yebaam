import { create } from 'zustand';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { chatService } from '../services/chat.service';
import type { ChatMessage, MessageMedia } from '../types';

/** Memory only: survives closing a window, never survives logout or reload. */
export const useOutgoingMessagesStore = create<{ messages: ChatMessage[] }>(() => ({ messages: [] }));

useAuthStore.subscribe((state, previous) => {
  if (state.user?.id !== previous.user?.id) useOutgoingMessagesStore.setState({ messages: [] });
});

const inFlight = new Set<string>();

async function deliver(message: ChatMessage) {
  if (inFlight.has(message.id) || useAuthStore.getState().user?.id !== message.senderId) return;
  inFlight.add(message.id);
  const replace = (next: ChatMessage) => useOutgoingMessagesStore.setState((state) => ({
    messages: state.messages.map((item) => item.id === message.id ? next : item),
  }));
  replace({ ...message, status: 'sending' });
  try {
    const sent = await chatService.sendMessage(
      message.conversationId, message.content, undefined, message.media ?? undefined, message.id,
    );
    replace({ ...sent, createdAt: message.createdAt, isTemporary: false });
  } catch {
    replace({ ...message, status: 'failed' });
  } finally {
    inFlight.delete(message.id);
  }
}

/** Acceptance is immediate; delivery and failures belong to the message, not the draft. */
export function enqueueMessage(conversationId: string | null, content?: string, media?: MessageMedia): boolean {
  const senderId = useAuthStore.getState().user?.id;
  const trimmed = content?.trim() ?? '';
  if (!conversationId || !senderId || (!trimmed && !media)) return false;
  const message: ChatMessage = {
    id: crypto.randomUUID(), conversationId, senderId, content: trimmed, media: media ?? null,
    createdAt: new Date().toISOString(), status: 'sending', isTemporary: true,
  };
  useOutgoingMessagesStore.setState((state) => ({ messages: [...state.messages, message] }));
  void deliver(message);
  return true;
}

export function retryMessage(id: string) {
  const message = useOutgoingMessagesStore.getState().messages.find((item) => item.id === id);
  if (message?.status === 'failed') void deliver(message);
}

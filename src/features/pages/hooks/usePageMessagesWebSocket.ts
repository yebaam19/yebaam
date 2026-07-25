import type { PageMessage } from '../interfaces/page-message.interface';

interface UsePageMessagesWebSocketOptions {
  pageId?: string;
  conversationId?: string;
  onNewMessage?: (message: PageMessage) => void;
  onMessagesRead?: (data: { conversationId: string; readByUserId: string }) => void;
  onTyping?: (data: { userId: string; userName: string; isTyping: boolean }) => void;
}

/**
 * Page-inbox realtime channel — currently inert.
 *
 * This hook used to open a `socket.io-client` connection to
 * `${NEXT_PUBLIC_API_URL}/pages/messages`, authenticated with a
 * `localStorage.token` that the Supabase auth migration stopped writing. It
 * therefore bailed before connecting on every render, and that backend is gone
 * regardless. Kept as a no-op with the same signature so `PageMessengerChatView`
 * renders unchanged (it already degrades to polling/refetch when
 * `isConnected` is false). Reimplement on Supabase Realtime — see
 * `subscribeToTable` in `@/utils/supabase/realtime`.
 */
export function usePageMessagesWebSocket(_options: UsePageMessagesWebSocketOptions = {}) {
  return {
    isConnected: false,
    socket: null,
    subscribeToConversation: (_convId: string) => {},
    unsubscribeFromConversation: (_convId: string) => {},
    emitTyping: (_convId: string, _userName: string, _isTyping: boolean) => {},
  };
}

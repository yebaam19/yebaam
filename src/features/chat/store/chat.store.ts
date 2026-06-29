import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Conversation, ConversationType } from '../types';
import { chatService } from '../services/chat.service';
import { conversationCache } from '../lib/conversation-cache';
import { useAuthStore } from '@/features/auth/store/auth.store';

export interface OpenBubble {
  /** Unique tray key. For direct chats it's the peer user id; for groups it's the conversation id. */
  contactId: string;
  contactName: string;
  contactAvatar: string;
  isOnline: boolean;
  /** Explicit conversation id — set for group bubbles (no single peer to resolve from). */
  conversationId?: string;
  /** Defaults to direct when omitted. */
  type?: ConversationType;
}

const MAX_OPEN_BUBBLES = 3;

// Shared across all useChat() consumers (MessengerDropdown + open ChatBubbles)
// so concurrent initial mounts collapse into ONE /api/conversations request
// instead of firing the ~2s endpoint multiple times in parallel.
let loadConversationsInFlight: Promise<void> | null = null;

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoadingConversations: boolean;
  loadConversations: () => Promise<void>;
  setActiveConversation: (conversationId: string | null) => void;
  updateConversation: (conversation: Conversation) => void;
  addConversation: (conversation: Conversation) => void;

  getTotalUnreadCount: () => number;
  resetUnreadCount: (conversationId: string) => void;
  incrementUnreadCount: (conversationId: string) => void;

  openBubbles: OpenBubble[];
  openBubble: (contact: OpenBubble) => void;
  closeBubble: (contactId: string) => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      isLoadingConversations: false,
      loadConversations: async () => {
        if (loadConversationsInFlight) return loadConversationsInFlight;
        loadConversationsInFlight = (async () => {
        set({ isLoadingConversations: true });
        try {
          const conversations = await chatService.getConversations();

          // Prime the conversation-id cache: opening a chat for a known peer can
          // then skip the resolve round-trips and go straight to fetching/showing
          // messages (Messenger-style fast open).
          const meId = useAuthStore.getState().user?.id;
          if (meId) {
            for (const conv of conversations) {
              if (conv.type !== ConversationType.DIRECT) continue;
              const peerId = conv.participantIds?.find((id) => id !== meId);
              if (peerId) conversationCache.setConvId(peerId, conv.id);
            }
          }

          // Ordenar por última actividad
          conversations.sort((a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );

          set({ conversations, isLoadingConversations: false });
        } catch (error) {
          console.error(' [CHAT STORE] Error loading conversations:', error);
          set({ isLoadingConversations: false });
        }
        })();
        try {
          await loadConversationsInFlight;
        } finally {
          loadConversationsInFlight = null;
        }
      },
      setActiveConversation: (conversationId) => {
        set({ activeConversationId: conversationId });
      },
      updateConversation: (updatedConversation) => {
        set((state) => {
          const updatedConversations = state.conversations.map((conv) =>
            conv.id === updatedConversation.id ? updatedConversation : conv
          );
          
          // Re-ordenar
          updatedConversations.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          
          return { conversations: updatedConversations };
        });
      },

      addConversation: (newConversation) => {
        set((state) => {
          const exists = state.conversations.some(c => c.id === newConversation.id);
          if (exists) {
        
            return state; 
          }
          
          const updatedConversations = [newConversation, ...state.conversations];
          
          // Ordenar
          updatedConversations.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          
          return { conversations: updatedConversations };
        });
      },
      getTotalUnreadCount: () => {
        const { conversations } = get();
        return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
      },
      resetUnreadCount: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
          ),
        }));
      },
      incrementUnreadCount: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? { ...conv, unreadCount: conv.unreadCount + 1 }
              : conv
          ),
        }));
      },

      openBubbles: [],
      openBubble: (contact) => {
        set((state) => {
          if (state.openBubbles.some((b) => b.contactId === contact.contactId)) {
            return state;
          }
          const next =
            state.openBubbles.length >= MAX_OPEN_BUBBLES
              ? [...state.openBubbles.slice(1), contact]
              : [...state.openBubbles, contact];
          return { openBubbles: next };
        });
      },
      closeBubble: (contactId) => {
        set((state) => ({
          openBubbles: state.openBubbles.filter((b) => b.contactId !== contactId),
        }));
      },
    }),
    { name: 'ChatStore' }
  )
);

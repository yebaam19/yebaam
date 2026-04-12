import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Conversation } from '../types';
import { chatService } from '../services/chat.service';

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
}

export const useChatStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      isLoadingConversations: false,
      loadConversations: async () => {

        set({ isLoadingConversations: true });
        try {
          const conversations = await chatService.getConversations();
  
          
          // Ordenar por última actividad
          conversations.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
         
          set({ conversations, isLoadingConversations: false });
        } catch (error) {
          console.error(' [CHAT STORE] Error loading conversations:', error);
          set({ isLoadingConversations: false });
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
    }),
    { name: 'ChatStore' }
  )
);

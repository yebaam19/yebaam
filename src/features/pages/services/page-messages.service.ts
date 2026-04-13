import { getAxiosInstance } from '@/lib/legacy-api/client';
import type {
  PageMessage,
  SendMessageDto,
  GetMessagesResponse,
  GetMessagesQuery,
} from '../interfaces/page-message.interface';
import type {
  PageConversation,
  GetConversationsResponse,
  GetConversationsQuery,
} from '../interfaces/page-conversation.interface';

const API_BASE = '/api/pages';

/**
 * Servicio para gestión de mensajes de páginas
 * Maneja la comunicación HTTP con el backend
 */
export const pageMessagesService = {
  /**
   * Obtener conversaciones de una página (inbox)
   */
  async getPageConversations(
    pageId: string,
    query?: GetConversationsQuery,
  ): Promise<GetConversationsResponse> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(
      `${API_BASE}/${pageId}/conversations`,
      { params: query },
    );
    return data;
  },

  /**
   * Obtener mensajes de una conversación específica
   */
  async getConversationMessages(
    pageId: string,
    conversationId: string,
    query?: GetMessagesQuery,
  ): Promise<GetMessagesResponse> {
    const axios = getAxiosInstance();
    const { data } = await axios.get(
      `${API_BASE}/${pageId}/messages/${conversationId}`,
      { params: query },
    );
    return data;
  },

  /**
   * Enviar mensaje a una página (como usuario)
   */
  async sendMessageToPage(
    pageId: string,
    message: SendMessageDto,
  ): Promise<PageMessage> {
    const axios = getAxiosInstance();
    const { data } = await axios.post(
      `${API_BASE}/${pageId}/messages`,
      message,
    );
    return data;
  },

  /**
   * Enviar mensaje como página (responder a usuario)
   * Solo el owner de la página puede hacer esto
   */
  async sendMessageAsPage(
    pageId: string,
    message: SendMessageDto,
  ): Promise<PageMessage> {
    const axios = getAxiosInstance();
    const { data } = await axios.post(
      `${API_BASE}/${pageId}/messages/send-as-page`,
      message,
    );
    return data;
  },

  /**
   * Marcar mensajes de una conversación como leídos
   */
  async markMessagesAsRead(
    pageId: string,
    conversationId: string,
  ): Promise<{ success: boolean }> {
    const axios = getAxiosInstance();
    const { data } = await axios.patch(
      `${API_BASE}/${pageId}/messages/${conversationId}/read`,
    );
    return data;
  },
};

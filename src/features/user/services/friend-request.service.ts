import { getAxiosInstance } from '@/lib/axios/axiosInstance';

const api = getAxiosInstance();

export interface FriendSuggestion {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  mutualFriends: number;
  location?: string | { city?: string; country?: string };
  reason: string;
}

export interface FriendRequest {
  requestId: string;
  fromUserId?: string; // Solo en requests recibidas
  toUserId?: string;   // Solo en requests enviadas
  message?: string;
  sentAt: string;
  status: 'pending' | 'accepted' | 'rejected';
  
  // El backend devuelve 'profile' para ambos casos:
  // - Para recibidas: profile del sender
  // - Para enviadas: profile del recipient
  profile?: {
    id?: string;
    username: string;
    firstName: string;
    lastName: string;
    displayName?: string;
    avatar?: string;
    location?: string;
  };
  
  // Deprecated: Mantener para compatibilidad
  senderProfile?: {
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  recipientProfile?: {
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface GetFriendRequestsResponse {
  received: FriendRequest[];
  sent: FriendRequest[];
  total: number;
}

export interface SendFriendRequestResponse {
  success: boolean;
  requestId: string;
  message: string;
}

export interface FriendRequestActionResponse {
  success: boolean;
  message: string;
  friendId?: string;
}

/**
 * Servicio para gestionar solicitudes de amistad
 */
export const friendRequestService = {
  /**
   * Obtener solicitudes de amistad recibidas y enviadas
   */
  async getFriendRequests(status?: 'pending' | 'accepted' | 'rejected'): Promise<GetFriendRequestsResponse> {
    // El backend retorna ambas (recibidas y enviadas) en un solo endpoint
    const response = await api.get('api/friendships/requests/pending');
    
    // El backend retorna: { data: { received: [...], sent: [...], totalReceived, totalSent } }
    const data = response.data.data || response.data;
    
    const received = data.received || [];
    const sent = data.sent || [];
    
    return {
      received,
      sent,
      total: received.length + sent.length,
    };
  },

  /**
   * Enviar solicitud de amistad
   */
  async sendFriendRequest(recipientId: string): Promise<SendFriendRequestResponse> {
 
    
    try {
      const response = await api.post('/friendships/send', { addresseeId: recipientId });
      console.log('[sendFriendRequest] Success:', response.data);
      return response.data;
    } catch (error: any) {

      console.error(' [sendFriendRequest] Error response:', error.response);
 
      throw error;
    }
  },

  /**
   * Aceptar solicitud de amistad
   */
  async acceptFriendRequest(requestId: string): Promise<FriendRequestActionResponse> {
    try {
      console.log('[acceptFriendRequest] Enviando solicitud con requestId:', requestId);
      console.log('[acceptFriendRequest] URL completa:', `/api/friendships/requests/${requestId}/accept`);
      const response = await api.patch(`/api/friendships/requests/${requestId}/accept`);
      console.log('[acceptFriendRequest]  Respuesta exitosa:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[acceptFriendRequest]  Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        requestId,
      });
      throw error;
    }
  },

  /**
   * Rechazar solicitud de amistad
   */
  async rejectFriendRequest(requestId: string): Promise<FriendRequestActionResponse> {
    const response = await api.patch(`/api/friendships/requests/${requestId}/reject`);
    return response.data;
  },

  /**
   * Cancelar solicitud de amistad enviada
   */
  async cancelFriendRequest(requestId: string): Promise<FriendRequestActionResponse> {
    const response = await api.delete(`/friendships/${requestId}/cancel`);
    return response.data;
  },

  /**
   * Obtener sugerencias de amigos (4 usuarios por defecto)
   */
  async getFriendSuggestions(limit: number = 4): Promise<FriendSuggestion[]> {
    const response = await api.get(`/api/friendships/suggestions?limit=${limit}`);
    return response.data.data; // Acceder a data.data porque el backend retorna {message, data}
  },
};

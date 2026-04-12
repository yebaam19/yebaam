import { getAxiosInstance } from '@/lib/axios/axiosInstance';

const api = getAxiosInstance();

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface FriendRequest {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendRequestStatus;
  message?: string;
  sentAt: string;
  respondedAt?: string;
  // Perfil del usuario (emisor o destinatario según el contexto)
  profile?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  // Aliases por compatibilidad
  senderProfile?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  recipientProfile?: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

export interface Friend {
  friendId: string;
  friendshipId?: string; // ID de la relación de amistad
  friendSince: string;
  closeFriend: boolean;
  restricted: boolean;
  nickname?: string;
  // Datos del perfil
  firstName?: string;
  lastName?: string;
  username: string;
  avatar?: string;
}

export interface FriendsListResponse {
  friends: Friend[];
  count: number;
  closeFriendsCount: number;
}

export interface PendingRequestsResponse {
  requests: FriendRequest[];
  count: number;
}

export interface AllPendingRequestsResponse {
  received: FriendRequest[];
  sent: FriendRequest[];
  totalReceived: number;
  totalSent: number;
}

export interface SendFriendRequestDto {
  addresseeId: string; // Cambio: Backend espera 'addresseeId' no 'toUserId'
  message?: string;
}

export interface UpdateFriendConfigDto {
  closeFriend?: boolean;
  restricted?: boolean;
  nickname?: string;
}

export interface FriendSuggestion {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  mutualFriends: number;
  location?: string;
  bio?: string;
  reason: string;
}

export interface FriendSuggestionsResponse {
  suggestions: FriendSuggestion[];
}

export const friendshipsService = {
  /**
   * Enviar solicitud de amistad
   */
  async sendFriendRequest(data: SendFriendRequestDto): Promise<FriendRequest> {
    try {
      const response = await api.post('/api/friendships/send', data);
      return response.data.data || response.data;
    } catch (error: any) {
      // Manejar errores específicos del backend
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.message;

        // Error 409 = Conflict (ya existe solicitud)
        if (status === 409) {
          throw new Error(message || 'Ya existe una solicitud pendiente con este usuario');
        }

        // Error 400 = Bad Request (validación)
        if (status === 400) {
          throw new Error(message || 'Solicitud inválida');
        }

        throw new Error(message || 'Error al enviar solicitud de amistad');
      }

      throw error;
    }
  },

  /**
   * Aceptar solicitud de amistad
   */
  async acceptFriendRequest(requestId: string): Promise<FriendRequest> {
    const response = await api.patch(`/api/friendships/requests/${requestId}/accept`);
    return response.data;
  },

  /**
   * Rechazar solicitud de amistad
   */
  async rejectFriendRequest(requestId: string): Promise<FriendRequest> {
    const response = await api.patch(`/api/friendships/requests/${requestId}/reject`);
    return response.data;
  },

  /**
   * Cancelar solicitud de amistad enviada
   */
  async cancelFriendRequest(requestId: string): Promise<{ success: boolean; message: string; }> {
    const response = await api.delete(`/api/friendships/requests/${requestId}/cancel`);
    return response.data;
  },

  /**
   * Obtener perfil del solicitante/destinatario de una solicitud de amistad
   * Si eres el destinatario, obtienes el perfil del remitente
   * Si eres el remitente, obtienes el perfil del destinatario
   */
  async getRequesterProfile(friendshipId: string): Promise<{
    friendshipId: string;
    requesterId: string;
    addresseeId: string;
    message?: string;
    sentAt: string;
    status: string;
    profile: {
      id: string;
      username: string;
      firstName: string;
      lastName: string;
      avatar?: string;
    };
    profileType: 'requester' | 'addressee';
  }> {
    const response = await api.get(`/api/friendships/requests/${friendshipId}/requester-profile`);
    return response.data.data;
  },

  /**
   * Obtener lista de amigos
   */
  async getFriends(): Promise<FriendsListResponse> {
    const response = await api.get('/api/friendships/friends');

    // El backend devuelve { success: true, data: [...], total: X }
    const rawData = response.data.data || [];
    const total = response.data.total || 0;

    // Mapear datos del backend al formato esperado por el frontend
    const friends: Friend[] = rawData.map((item: any) => {
      return {
        friendId: item.friendId || item.userId, // Backend puede devolver friendId o userId
        friendshipId: item.friendshipId, // ID de la relación de amistad
        friendSince: item.friendSince,
        closeFriend: item.closeFriend || false,
        restricted: item.restricted || false,
        nickname: item.nickname,
        firstName: item.firstName,
        lastName: item.lastName,
        username: item.username || `User-${item.userId?.slice(0, 8)}`, // Fallback para username
        avatar: item.avatar || item.avatarUrl,
      };
    });

    console.log('[Service] Mapped friends:', friends);

    return {
      friends,
      count: total,
      closeFriendsCount: friends.filter((f) => f.closeFriend).length,
    };
  },

  /**
   * Obtener TODAS las solicitudes pendientes (recibidas y enviadas)
   */
  async getAllPendingRequests(): Promise<AllPendingRequestsResponse> {
    const response = await api.get('/api/friendships/requests/pending');

    const data = response.data.data || response.data;

    const mapRequest = (req: any): FriendRequest => ({
      id: req.friendshipId || req.id,
      requesterId: req.requesterId,
      addresseeId: req.addresseeId,
      status: req.status || ('pending' as FriendRequestStatus),
      message: req.message,
      sentAt: req.sentAt || req.createdAt,
      profile: req.profile,
      recipientProfile: req.recipientProfile,
    });

    const mapped = {
      received: (data.received || []).map(mapRequest),
      sent: (data.sent || []).map(mapRequest),
      totalReceived: data.totalReceived || 0,
      totalSent: data.totalSent || 0,
    };

    console.log('[Service] Mapped result:', mapped);
    return mapped;
  },

  /**
   * Obtener solo solicitudes recibidas
   * (Wrapper para compatibilidad, usa getAllPendingRequests internamente)
   */
  async getPendingRequests(): Promise<PendingRequestsResponse> {
    const allRequests = await this.getAllPendingRequests();

    return {
      requests: allRequests.received,
      count: allRequests.totalReceived,
    };
  },

  /**
   * Obtener solo solicitudes enviadas
   * (Wrapper para compatibilidad, usa getAllPendingRequests internamente)
   */
  async getSentRequests(): Promise<PendingRequestsResponse> {
    const allRequests = await this.getAllPendingRequests();

    return {
      requests: allRequests.sent,
      count: allRequests.totalSent,
    };
  },

  /**
   * Eliminar un amigo
   * @param friendshipId - ID de la relación de amistad (no el userId)
   */
  async removeFriend(friendshipId: string): Promise<{ success: boolean; message: string; }> {
    const response = await api.delete(`/api/friendships/friends/${friendshipId}/unfriend`);
    return response.data;
  },

  /**
   * Actualizar configuración de un amigo (close friend, restricted, nickname)
   */
  async updateFriendConfig(friendId: string, config: UpdateFriendConfigDto): Promise<Friend> {
    const response = await api.patch(`/api/friendships/${friendId}/config`, config);
    return response.data;
  },

  /**
   * Obtener sugerencias de amigos
   */
  async getFriendSuggestions(limit: number = 10): Promise<FriendSuggestion[]> {
    const response = await api.get('/api/friendships/suggestions', {
      params: { limit },
    });

    // Mapear userId -> id para compatibilidad con la interfaz
    const suggestions = response.data.data || [];
    return suggestions.map((s: any) => ({
      id: s.userId || s.id,
      username: s.username,
      firstName: s.firstName,
      lastName: s.lastName,
      avatar: s.avatarUrl || s.avatar,
      mutualFriends: s.mutualFriendsCount || s.mutualFriends || 0,
      location: s.location,
      bio: s.bio,
      reason: s.reason || 'Usuario sugerido',
    }));
  },

  /**
   * Obtener amigos que están online (desde Redis)
   */
  async getOnlineFriends(): Promise<string[]> {
    const response = await api.get('/api/friendships/online');
    return response.data.data?.onlineFriendIds || [];
  },

  // TODO: Descomentar cuando el backend implemente el endpoint GET /api/friendships/status/{userId}
  // que devuelva el estado de amistad entre el usuario autenticado y otro usuario
  // /**
  //  * Verificar el estado de amistad con un usuario específico
  //  * @param userId - ID del usuario a verificar
  //  */
  // async getFriendshipStatus(userId: string): Promise<{
  //   status: 'NONE' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
  //   isRequester: boolean;
  //   friendshipId?: string;
  //   friendCount: number;
  // }> {
  //   try {
  //     const response = await api.get(`/api/friendships/status/${userId}`);
  //     return response.data.data || response.data;
  //   } catch (error: any) {
  //     // Si no existe relación, devolver estado por defecto
  //     if (error.response?.status === 404) {
  //       return {
  //         status: 'NONE',
  //         isRequester: false,
  //         friendCount: 0,
  //       };
  //     }
  //     throw error;
  //   }
  // },
};

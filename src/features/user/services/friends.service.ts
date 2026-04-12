import { getAxiosInstance } from '@/lib/axios/axiosInstance';

const api = getAxiosInstance();

export interface Friend {
  friendId: string;
  friendshipId?: string; // ID de la relación de amistad
  username: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  friendSince: string;
  closeFriend: boolean;
  mutualFriends?: number;
  location?: string | { city?: string; country?: string };
}

export interface GetFriendsResponse {
  friends: Friend[];
  total: number;
  closeFriends: Friend[];
}

/**
 * Servicio para gestionar amigos
 */
export const friendsService = {
  /**
   * Obtener lista de amigos
   */
  async getFriends(): Promise<GetFriendsResponse> {
    const response = await api.get('/user/friends');
    return response.data;
  },

  /**
   * Obtener amigos cercanos
   */
  async getCloseFriends(): Promise<Friend[]> {
    const response = await api.get('/user/friends/close');
    return response.data;
  },

  /**
   * Marcar/desmarcar como amigo cercano
   */
  async toggleCloseFriend(friendId: string): Promise<{ success: boolean; closeFriend: boolean }> {
    const response = await api.post(`/user/friends/${friendId}/close`);
    return response.data;
  },

  /**
   * Eliminar amigo
   * @param friendshipId - ID de la relación de amistad (no el userId)
   */
  async removeFriend(friendshipId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/api/friendships/friends/${friendshipId}/unfriend`);
    return response.data;
  },
};

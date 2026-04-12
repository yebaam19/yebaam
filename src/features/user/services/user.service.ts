import { getAxiosInstance } from '@/lib/axios/axiosInstance';

export interface UserBasicInfo {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

/**
 * Servicio para obtener información de usuarios
 */
class UserService {
  /**
   * Obtiene información básica de un usuario por su ID
   * @param userId - ID del usuario
   * @returns UserBasicInfo o null si no existe
   */
  async getUserById(userId: string): Promise<UserBasicInfo | null> {
    try {
      const api = getAxiosInstance();
      const response = await api.get<UserBasicInfo>(
        `/current-user/profile/${userId}`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.warn(`User with ID ${userId} not found`);
        return null;
      }
      console.error('Error fetching user info:', error);
      throw error;
    }
  }

  /**
   * Obtiene información básica de múltiples usuarios en una sola petición
   * @param userIds - Array de IDs de usuarios
   * @returns Array de UserBasicInfo (solo usuarios encontrados)
   */
  async getUsersBatch(userIds: string[]): Promise<UserBasicInfo[]> {
    try {
      if (!userIds || userIds.length === 0) {
        return [];
      }

      const api = getAxiosInstance();
      const response = await api.post<UserBasicInfo[]>(
        '/api/current-user/profiles/batch',
        { userIds }
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching users batch:', error);
      return [];
    }
  }

  /**
   * Obtiene información de usuarios y la convierte en un Map para acceso rápido
   * @param userIds - Array de IDs de usuarios
   * @returns Map<userId, UserBasicInfo>
   */
  async getUsersMap(userIds: string[]): Promise<Map<string, UserBasicInfo>> {
    const users = await this.getUsersBatch(userIds);
    const usersMap = new Map<string, UserBasicInfo>();
    
    users.forEach(user => {
      usersMap.set(user.id, user);
    });
    
    return usersMap;
  }
}

export const userService = new UserService();

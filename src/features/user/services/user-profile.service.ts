import { getAxiosInstance } from '@/lib/axios/axiosInstance';

/**
 * Interfaces para el perfil de usuario
 */
export interface UserLocation {
  country?: string;
  state?: string;
  city?: string;
}

export interface UserPrivacy {
  profileVisibility: 'public' | 'friends' | 'private';
  showEmail: boolean;
  showPhoneNumber: boolean;
  showBirthday: boolean;
  showLocation: boolean;
  allowFriendRequests: boolean;
  allowMessages: boolean;
  showOnlineStatus: boolean;
  whoCanPost: 'everyone' | 'friends' | 'only_me';
  whoCanSeeMyPosts: 'public' | 'friends' | 'only_me';
}

export interface UserStats {
  friendsCount: number;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  photosCount: number;
  videosCount: number;
  checkinsCount: number;
}

export interface UserProfile {
  userId: string;
  username: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  bio?: string;
  avatarUrl?: string;
  coverPhotoUrl?: string;
  location?: UserLocation;
  privacy: UserPrivacy;
  stats: UserStats;
  isActive: boolean;
  isVerified: boolean;
  isCelebrity: boolean;
  friends: string[];
  followers: string[];
  following: string[];
  workExperience: any[];
  education: any[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Servicio para manejar perfiles de usuario
 */
class UserProfileService {
  private readonly axios = getAxiosInstance();

  /**
   * Obtiene el perfil completo del usuario autenticado
   */
  async getMyProfile(): Promise<UserProfile> {
    try {
      console.log('[UserProfileService] Fetching my profile...');
      const response = await this.axios.get<UserProfile>('/api/current-user/profile');
      console.log('[UserProfileService] Profile fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('[UserProfileService] Error fetching my profile:', error);
      throw this.handleError(error, 'Error al obtener tu perfil');
    }
  }

  /**
   * Obtiene el perfil de un usuario por username
   */
  async getUserProfileByUsername(username: string): Promise<UserProfile> {
    try {
      console.log('[UserProfileService] Fetching profile for:', username);
      const response = await this.axios.get<UserProfile>(`/api/users/${username}/profile`);
      console.log('[UserProfileService] Profile fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('[UserProfileService] Error fetching profile:', error);
      throw this.handleError(error, `Error al obtener el perfil de ${username}`);
    }
  }

  /**
   * Actualiza el perfil del usuario autenticado
   */
  async updateMyProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    try {
      console.log('[UserProfileService] Updating my profile:', data);
      const response = await this.axios.patch<UserProfile>('/api/current-user/profile', data);
      console.log('[UserProfileService] Profile updated:', response.data);
      return response.data;
    } catch (error) {
      console.error('[UserProfileService] Error updating profile:', error);
      throw this.handleError(error, 'Error al actualizar tu perfil');
    }
  }

  /**
   * Maneja errores de HTTP
   */
  private handleError(error: any, defaultMessage: string): Error {
    if (error instanceof Error && !error.message.includes('AxiosError')) {
      return error;
    }

    const backendMessage = error?.response?.data?.message;
    if (backendMessage) {
      return new Error(backendMessage);
    }

    return new Error(defaultMessage);
  }
}

/**
 * Instancia singleton del servicio
 */
export const userProfileService = new UserProfileService();

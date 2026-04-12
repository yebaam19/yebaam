

import { getAxiosInstance } from '@/lib/axios/axiosInstance'
import type {
  ProfileStatsResponse,
  UpdateInterestsDTO,
  UpdatePersonalInfoDTO,
  UpdateProfileDTO,
  UpdateSocialLinksDTO,
  UploadImageResponse,
  UserProfile,
} from '../interfaces/profile.interfaces'

class ProfileService {
  private readonly axios = getAxiosInstance()

  /**
   * Obtiene el perfil de un usuario por username
   * Requiere autenticación - el token se envía automáticamente via interceptor
   */
  async getProfileByUsername(username: string): Promise<UserProfile> {
    try {
      const response = await this.axios.get<UserProfile>(`/api/users/${username}/profile`)
      return response.data
    } catch (error) {
      console.error('[ProfileService] Error getting profile:', error)
      throw error
    }
  }

  /**
   * Obtiene el perfil del usuario autenticado
   */
  async getMyProfile(): Promise<UserProfile> {
    try {
   
      const response = await this.axios.get<UserProfile>('/api/profile')
      return response.data
    } catch (error) {
      console.error('[ProfileService] Error getting my profile:', error)
      throw error
    }
  }

  /**
   * Actualiza nombres y apellidos del usuario
   */
  async updateProfile(data: UpdateProfileDTO): Promise<UserProfile> {
    try {
      const response = await this.axios.patch<UserProfile>('/api/current-user/profile', data)
      return response.data
    } catch (error) {
      console.error('[ProfileService] Error updating profile:', error)
      throw error
    }
  }

  /**
   * Actualiza información personal del usuario
   * Nota: Usa el mismo endpoint que updateProfile
   */
  async updatePersonalInfo(data: UpdatePersonalInfoDTO): Promise<UserProfile> {
    try {
      const response = await this.axios.patch<UserProfile>('/api/current-user/profile', data)
      return response.data
    } catch (error) {
      console.error('[ProfileService] Error updating personal info:', error)
      throw error
    }
  }

  /**
   * Actualiza enlaces sociales del usuario
   * Nota: Usa el mismo endpoint que updateProfile
   */
  async updateSocialLinks(data: UpdateSocialLinksDTO): Promise<UserProfile> {
    try {
      const response = await this.axios.patch<UserProfile>('/api/current-user/profile', data)
      return response.data
    } catch (error) {
      console.error('[ProfileService] Error updating social links:', error)
      throw error
    }
  }

  /**
   * Actualiza los intereses del usuario
   */
  async updateInterests(data: UpdateInterestsDTO): Promise<UserProfile> {
    try {
      const response = await this.axios.patch<UserProfile>('/users/me/interests', data)
      return response.data
    } catch (error) {
      console.error('[ProfileService] Error updating interests:', error)
      throw error
    }
  }

  async uploadImage(file: File, type: 'avatar' | 'cover' | 'idDocument'): Promise<UploadImageResponse> {
    try {

      console.log('[ProfileService] Archivo:', {
        name: file.name,
        size: file.size,
        type: file.type
      })

      // 1. Generar presigned URL
      let imageType: 'avatar' | 'coverPhoto' | 'idDocument';
      if (type === 'avatar') {
        imageType = 'avatar';
      } else if (type === 'cover') {
        imageType = 'coverPhoto';
      } else {
        imageType = 'idDocument';
      }


      const presignedResponse = await this.axios.post<{
        uploadUrl: string
        cloudFrontUrl: string
        s3Key: string
        expiresIn: number
      }>('/api/profile/generate-image-upload-url', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        imageType,
      })

      const { uploadUrl, cloudFrontUrl } = presignedResponse.data
      
 

      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      console.log('[ProfileService] Respuesta de S3:', uploadResponse.status, uploadResponse.statusText)

      if (!uploadResponse.ok) {
        throw new Error(`Error al subir a S3: ${uploadResponse.status} ${uploadResponse.statusText}`)
      }



      return {
        url: cloudFrontUrl,
      }
    } catch (error) {
      console.error('[ProfileService] Error uploading image:', error)
      throw error
    }
  }

  /**
   * Obtiene las estadísticas del perfil
   */
  async getProfileStats(userId: string): Promise<ProfileStatsResponse> {
    try {
      const response = await this.axios.get<ProfileStatsResponse>(`/users/${userId}/stats`)
      return response.data
    } catch (error) {
      console.error('[ProfileService] Error getting profile stats:', error)
      throw error
    }
  }

  /**
   * Obtiene los posts de un usuario
   */
  async getUserPosts(userId: string, cursor?: string) {
    try {
      const response = await this.axios.get(`/users/${userId}/posts`, {
        params: { cursor },
      })
      return response.data
    } catch (error) {
      console.error('[ProfileService] Error getting user posts:', error)
      throw error
    }
  }

  /**
   * Obtiene las fotos de un usuario
   */
  async getUserPhotos(userId: string, cursor?: string) {
    try {
      const response = await this.axios.get(`/users/${userId}/photos`, {
        params: { cursor },
      })
      return response.data
    } catch (error) {
      console.error('[ProfileService] Error getting user photos:', error)
      throw error
    }
  }

  /**
   * Obtiene los videos de un usuario
   */
  async getUserVideos(userId: string, cursor?: string) {
    try {
      const response = await this.axios.get(`/users/${userId}/videos`, {
        params: { cursor },
      })
      return response.data
    } catch (error) {
      console.error('[ProfileService] Error getting user videos:', error)
      throw error
    }
  }
}

export const profileService = new ProfileService()

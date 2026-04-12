/**
 * Profile Media Service
 * 
 * Servicio para gestionar fotos, videos y álbumes del perfil
 */

import { getAxiosInstance } from '@/lib/axios/axiosInstance'

// Types
export interface ProfilePhoto {
  id: string
  userId: string
  albumId?: string
  url: string
  s3Key: string
  caption?: string
  tags?: string[]
  width?: number
  height?: number
  likes: number
  likesCount: number
  commentsCount: number
  visibility: 'public' | 'friends' | 'only_me'
  uploadedAt: Date
}

export interface ProfileVideo {
  id: string
  userId: string
  albumId?: string
  url: string
  s3Key: string
  thumbnailUrl?: string
  caption?: string
  tags?: string[]
  duration?: number
  width?: number
  height?: number
  likes: number
  likesCount: number
  commentsCount: number
  viewsCount: number
  visibility: 'public' | 'friends' | 'only_me'
  uploadedAt: Date
}

export interface ProfileAlbum {
  id: string
  userId: string
  name: string
  description?: string
  coverPhotoId?: string
  coverPhotoUrl?: string
  privacy: 'public' | 'friends' | 'only_me'
  photosCount: number
  videosCount: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateAlbumDTO {
  name: string
  description?: string
  privacy: 'public' | 'friends' | 'only_me'
}

export interface UpdateAlbumDTO {
  name?: string
  description?: string
  privacy?: 'public' | 'friends' | 'only_me'
  coverPhotoId?: string
}

export interface UploadPhotoDTO {
  s3Key: string
  url: string
  caption?: string
  albumId?: string
  width?: number
  height?: number
  size: number
  mimeType: string
  visibility?: 'public' | 'friends' | 'only_me'
}

export interface UploadVideoDTO {
  s3Key: string
  url: string
  thumbnailUrl?: string
  caption?: string
  albumId?: string
  duration?: number
  width?: number
  height?: number
  size: number
  mimeType: string
  visibility?: 'public' | 'friends' | 'only_me'
}

export interface GenerateUploadUrlResponse {
  uploadUrl: string
  cloudFrontUrl: string
  s3Key: string
  expiresIn: number
}

class ProfileMediaService {
  private readonly axios = getAxiosInstance()

  // ========================================================================
  // PHOTOS
  // ========================================================================

  /**
   * Genera una URL presignada para subir una foto
   */
  async generatePhotoUploadUrl(
    fileName: string,
    fileType: string,
    fileSize: number,
    albumId?: string
  ): Promise<GenerateUploadUrlResponse> {
    try {
      const response = await this.axios.post<GenerateUploadUrlResponse>(
        '/api/profile/photos/generate-upload-url',
        {
          fileName,
          fileType,
          fileSize,
          albumId,
        }
      )
      return response.data
    } catch (error) {
      console.error('[ProfileMediaService] Error generating photo upload URL:', error)
      throw error
    }
  }

  /**
   * Confirma la subida de una foto y crea el registro en BD
   */
  async uploadPhoto(data: UploadPhotoDTO): Promise<ProfilePhoto> {
    try {
      const response = await this.axios.post<ProfilePhoto>('/api/profile/photos', data)
      return response.data
    } catch (error) {
      console.error('[ProfileMediaService] Error uploading photo:', error)
      throw error
    }
  }

  /**
   * Obtiene las fotos del usuario autenticado
   */
  async getMyPhotos(albumId?: string, cursor?: string): Promise<{ data: ProfilePhoto[]; nextCursor?: string }> {
    try {
      const response = await this.axios.get('/api/profile/photos', {
        params: { albumId, cursor },
      })
      return response.data
    } catch (error) {
      console.error('[ProfileMediaService] Error getting my photos:', error)
      throw error
    }
  }

  /**
   * Elimina una foto
   */
  async deletePhoto(photoId: string): Promise<void> {
    try {
      await this.axios.delete(`/api/profile/photos/${photoId}`)
    } catch (error) {
      console.error('[ProfileMediaService] Error deleting photo:', error)
      throw error
    }
  }

  // ========================================================================
  // VIDEOS
  // ========================================================================

  /**
   * Genera una URL presignada para subir un video
   */
  async generateVideoUploadUrl(
    fileName: string,
    fileType: string,
    fileSize: number,
    albumId?: string
  ): Promise<GenerateUploadUrlResponse> {
    try {
      const response = await this.axios.post<GenerateUploadUrlResponse>(
        '/api/profile/videos/generate-upload-url',
        {
          fileName,
          fileType,
          fileSize,
          albumId,
        }
      )
      return response.data
    } catch (error) {
      console.error('[ProfileMediaService] Error generating video upload URL:', error)
      throw error
    }
  }

  /**
   * Confirma la subida de un video y crea el registro en BD
   */
  async uploadVideo(data: UploadVideoDTO): Promise<ProfileVideo> {
    try {
      const response = await this.axios.post<ProfileVideo>('/api/profile/videos', data)
      return response.data
    } catch (error) {
      console.error('[ProfileMediaService] Error uploading video:', error)
      throw error
    }
  }

  /**
   * Obtiene los videos del usuario autenticado
   */
  async getMyVideos(albumId?: string, cursor?: string): Promise<{ data: ProfileVideo[]; nextCursor?: string }> {
    try {
      const response = await this.axios.get('/api/profile/videos', {
        params: { albumId, cursor },
      })
      return response.data
    } catch (error) {
      console.error('[ProfileMediaService] Error getting my videos:', error)
      throw error
    }
  }

  /**
   * Elimina un video
   */
  async deleteVideo(videoId: string): Promise<void> {
    try {
      await this.axios.delete(`/api/profile/videos/${videoId}`)
    } catch (error) {
      console.error('[ProfileMediaService] Error deleting video:', error)
      throw error
    }
  }

  // ========================================================================
  // ALBUMS
  // ========================================================================

  /**
   * Crea un nuevo álbum
   */
  async createAlbum(data: CreateAlbumDTO): Promise<ProfileAlbum> {
    try {
      const response = await this.axios.post<ProfileAlbum>('/api/profile/albums', data)
      return response.data
    } catch (error) {
      console.error('[ProfileMediaService] Error creating album:', error)
      throw error
    }
  }

  /**
   * Obtiene los álbumes del usuario autenticado
   */
  async getMyAlbums(cursor?: string): Promise<{ data: ProfileAlbum[]; nextCursor?: string }> {
    try {
      const response = await this.axios.get('/api/profile/albums', {
        params: { cursor },
      })
      return response.data
    } catch (error) {
      console.error('[ProfileMediaService] Error getting my albums:', error)
      throw error
    }
  }

  /**
   * Obtiene un álbum por ID
   */
  async getAlbumById(albumId: string): Promise<ProfileAlbum> {
    try {
      const response = await this.axios.get<ProfileAlbum>(`/api/profile/albums/${albumId}`)
      return response.data
    } catch (error) {
      console.error('[ProfileMediaService] Error getting album:', error)
      throw error
    }
  }

  /**
   * Actualiza un álbum
   */
  async updateAlbum(albumId: string, data: UpdateAlbumDTO): Promise<ProfileAlbum> {
    try {
      const response = await this.axios.patch<ProfileAlbum>(`/api/profile/albums/${albumId}`, data)
      return response.data
    } catch (error) {
      console.error('[ProfileMediaService] Error updating album:', error)
      throw error
    }
  }

  /**
   * Elimina un álbum
   */
  async deleteAlbum(albumId: string): Promise<void> {
    try {
      await this.axios.delete(`/api/profile/albums/${albumId}`)
    } catch (error) {
      console.error('[ProfileMediaService] Error deleting album:', error)
      throw error
    }
  }

  // ========================================================================
  // UPLOAD HELPERS
  // ========================================================================

  /**
   * Sube un archivo a S3 usando la URL presignada
   */
  async uploadToS3(file: File, uploadUrl: string): Promise<void> {
    try {
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })

      if (!response.ok) {
        throw new Error(`Error al subir a S3: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('[ProfileMediaService] Error uploading to S3:', error)
      throw error
    }
  }
}

export const profileMediaService = new ProfileMediaService()

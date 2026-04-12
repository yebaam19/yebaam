/**
 * Profile Media Store
 * 
 * Zustand store para gestionar el estado de fotos, videos y álbumes
 */

import { create } from 'zustand'
import {
  profileMediaService,
  type ProfilePhoto,
  type ProfileVideo,
  type ProfileAlbum,
  type CreateAlbumDTO,
  type UpdateAlbumDTO,
  type UploadPhotoDTO,
  type UploadVideoDTO,
} from '../services/profile-media.service'

interface UploadProgress {
  photoId?: string
  videoId?: string
  fileName: string
  progress: number
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
}

interface ProfileMediaState {
  // Photos
  photos: ProfilePhoto[]
  isLoadingPhotos: boolean
  photosError: string | null

  // Videos
  videos: ProfileVideo[]
  isLoadingVideos: boolean
  videosError: string | null

  // Albums
  albums: ProfileAlbum[]
  currentAlbum: ProfileAlbum | null
  isLoadingAlbums: boolean
  albumsError: string | null

  // Upload state
  uploadQueue: UploadProgress[]
  isUploading: boolean

  // Actions - Photos
  fetchMyPhotos: (albumId?: string) => Promise<void>
  uploadPhoto: (file: File, data: { caption?: string; albumId?: string; visibility?: 'public' | 'friends' | 'only_me' }) => Promise<ProfilePhoto>
  deletePhoto: (photoId: string) => Promise<void>

  // Actions - Videos
  fetchMyVideos: (albumId?: string) => Promise<void>
  uploadVideo: (file: File, data: { caption?: string; albumId?: string; visibility?: 'public' | 'friends' | 'only_me' }) => Promise<ProfileVideo>
  deleteVideo: (videoId: string) => Promise<void>

  // Actions - Albums
  fetchMyAlbums: () => Promise<void>
  fetchAlbumById: (albumId: string) => Promise<void>
  createAlbum: (data: CreateAlbumDTO) => Promise<ProfileAlbum>
  updateAlbum: (albumId: string, data: UpdateAlbumDTO) => Promise<ProfileAlbum>
  deleteAlbum: (albumId: string) => Promise<void>

  // Upload queue management
  addToUploadQueue: (item: UploadProgress) => void
  updateUploadProgress: (fileName: string, progress: number) => void
  updateUploadStatus: (fileName: string, status: UploadProgress['status'], error?: string) => void
  removeFromUploadQueue: (fileName: string) => void
  clearUploadQueue: () => void

  // Reset
  reset: () => void
}

export const useProfileMediaStore = create<ProfileMediaState>((set, get) => ({
  // Initial state
  photos: [],
  isLoadingPhotos: false,
  photosError: null,

  videos: [],
  isLoadingVideos: false,
  videosError: null,

  albums: [],
  currentAlbum: null,
  isLoadingAlbums: false,
  albumsError: null,

  uploadQueue: [],
  isUploading: false,

  // ========================================================================
  // PHOTOS
  // ========================================================================

  fetchMyPhotos: async (albumId?: string) => {
    set({ isLoadingPhotos: true, photosError: null })
    try {
      const response = await profileMediaService.getMyPhotos(albumId)
      set({ photos: response.data, isLoadingPhotos: false })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al cargar fotos'
      set({ photosError: errorMsg, isLoadingPhotos: false })
      throw error
    }
  },

  uploadPhoto: async (file: File, data) => {
    const uploadItem: UploadProgress = {
      fileName: file.name,
      progress: 0,
      status: 'pending',
    }

    try {
      // Agregar a la cola
      get().addToUploadQueue(uploadItem)
      set({ isUploading: true })

      // 1. Generar URL presignada
      get().updateUploadStatus(file.name, 'uploading')
      const { uploadUrl, cloudFrontUrl, s3Key } = await profileMediaService.generatePhotoUploadUrl(
        file.name,
        file.type,
        file.size,
        data.albumId
      )

      // 2. Obtener dimensiones de la imagen
      const dimensions = await getImageDimensions(file)

      // 3. Subir a S3
      await profileMediaService.uploadToS3(file, uploadUrl)
      get().updateUploadProgress(file.name, 100)

      // 4. Confirmar subida en backend
      get().updateUploadStatus(file.name, 'processing')
      const uploadData: UploadPhotoDTO = {
        s3Key,
        url: cloudFrontUrl,
        caption: data.caption,
        albumId: data.albumId,
        width: dimensions.width,
        height: dimensions.height,
        size: file.size,
        mimeType: file.type,
        visibility: data.visibility || 'public',
      }

      const photo = await profileMediaService.uploadPhoto(uploadData)

      // 5. Actualizar estado
      set((state) => ({
        photos: [photo, ...state.photos],
        isUploading: state.uploadQueue.length > 1,
      }))

      get().updateUploadStatus(file.name, 'completed')
      setTimeout(() => get().removeFromUploadQueue(file.name), 2000)

      // 6. Actualizar contador del álbum si aplica
      if (data.albumId) {
        set((state) => ({
          albums: state.albums.map((album) =>
            album.id === data.albumId ? { ...album, photosCount: album.photosCount + 1 } : album
          ),
        }))
      }

      return photo
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al subir foto'
      get().updateUploadStatus(file.name, 'error', errorMsg)
      set({ isUploading: false })
      throw error
    }
  },

  deletePhoto: async (photoId: string) => {
    try {
      await profileMediaService.deletePhoto(photoId)
      set((state) => ({
        photos: state.photos.filter((p) => p.id !== photoId),
      }))

      // Actualizar contador del álbum si aplica
      const photo = get().photos.find((p) => p.id === photoId)
      if (photo?.albumId) {
        set((state) => ({
          albums: state.albums.map((album) =>
            album.id === photo.albumId ? { ...album, photosCount: Math.max(0, album.photosCount - 1) } : album
          ),
        }))
      }
    } catch (error) {
      console.error('[ProfileMediaStore] Error deleting photo:', error)
      throw error
    }
  },

  // ========================================================================
  // VIDEOS
  // ========================================================================

  fetchMyVideos: async (albumId?: string) => {
    set({ isLoadingVideos: true, videosError: null })
    try {
      const response = await profileMediaService.getMyVideos(albumId)
      set({ videos: response.data, isLoadingVideos: false })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al cargar videos'
      set({ videosError: errorMsg, isLoadingVideos: false })
      throw error
    }
  },

  uploadVideo: async (file: File, data) => {
    const uploadItem: UploadProgress = {
      fileName: file.name,
      progress: 0,
      status: 'pending',
    }

    try {
      // Agregar a la cola
      get().addToUploadQueue(uploadItem)
      set({ isUploading: true })

      // 1. Generar URL presignada
      get().updateUploadStatus(file.name, 'uploading')
      const { uploadUrl, cloudFrontUrl, s3Key } = await profileMediaService.generateVideoUploadUrl(
        file.name,
        file.type,
        file.size,
        data.albumId
      )

      // 2. Obtener dimensiones y duración del video
      const videoMetadata = await getVideoMetadata(file)

      // 3. Subir a S3
      await profileMediaService.uploadToS3(file, uploadUrl)
      get().updateUploadProgress(file.name, 100)

      // 4. Confirmar subida en backend
      get().updateUploadStatus(file.name, 'processing')
      const uploadData: UploadVideoDTO = {
        s3Key,
        url: cloudFrontUrl,
        caption: data.caption,
        albumId: data.albumId,
        duration: videoMetadata.duration,
        width: videoMetadata.width,
        height: videoMetadata.height,
        size: file.size,
        mimeType: file.type,
        visibility: data.visibility || 'public',
      }

      const video = await profileMediaService.uploadVideo(uploadData)

      // 5. Actualizar estado
      set((state) => ({
        videos: [video, ...state.videos],
        isUploading: state.uploadQueue.length > 1,
      }))

      get().updateUploadStatus(file.name, 'completed')
      setTimeout(() => get().removeFromUploadQueue(file.name), 2000)

      // 6. Actualizar contador del álbum si aplica
      if (data.albumId) {
        set((state) => ({
          albums: state.albums.map((album) =>
            album.id === data.albumId ? { ...album, videosCount: album.videosCount + 1 } : album
          ),
        }))
      }

      return video
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al subir video'
      get().updateUploadStatus(file.name, 'error', errorMsg)
      set({ isUploading: false })
      throw error
    }
  },

  deleteVideo: async (videoId: string) => {
    try {
      await profileMediaService.deleteVideo(videoId)
      set((state) => ({
        videos: state.videos.filter((v) => v.id !== videoId),
      }))

      // Actualizar contador del álbum si aplica
      const video = get().videos.find((v) => v.id === videoId)
      if (video?.albumId) {
        set((state) => ({
          albums: state.albums.map((album) =>
            album.id === video.albumId ? { ...album, videosCount: Math.max(0, album.videosCount - 1) } : album
          ),
        }))
      }
    } catch (error) {
      console.error('[ProfileMediaStore] Error deleting video:', error)
      throw error
    }
  },

  // ========================================================================
  // ALBUMS
  // ========================================================================

  fetchMyAlbums: async () => {
    set({ isLoadingAlbums: true, albumsError: null })
    try {
      const response = await profileMediaService.getMyAlbums()
      set({ albums: response.data, isLoadingAlbums: false })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al cargar álbumes'
      set({ albumsError: errorMsg, isLoadingAlbums: false })
      throw error
    }
  },

  fetchAlbumById: async (albumId: string) => {
    set({ isLoadingAlbums: true, albumsError: null })
    try {
      const album = await profileMediaService.getAlbumById(albumId)
      set({ currentAlbum: album, isLoadingAlbums: false })
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al cargar álbum'
      set({ albumsError: errorMsg, isLoadingAlbums: false })
      throw error
    }
  },

  createAlbum: async (data: CreateAlbumDTO) => {
    try {
      const album = await profileMediaService.createAlbum(data)
      set((state) => ({
        albums: [album, ...state.albums],
      }))
      return album
    } catch (error) {
      console.error('[ProfileMediaStore] Error creating album:', error)
      throw error
    }
  },

  updateAlbum: async (albumId: string, data: UpdateAlbumDTO) => {
    try {
      const updatedAlbum = await profileMediaService.updateAlbum(albumId, data)
      set((state) => ({
        albums: state.albums.map((album) => (album.id === albumId ? updatedAlbum : album)),
        currentAlbum: state.currentAlbum?.id === albumId ? updatedAlbum : state.currentAlbum,
      }))
      return updatedAlbum
    } catch (error) {
      console.error('[ProfileMediaStore] Error updating album:', error)
      throw error
    }
  },

  deleteAlbum: async (albumId: string) => {
    try {
      await profileMediaService.deleteAlbum(albumId)
      set((state) => ({
        albums: state.albums.filter((a) => a.id !== albumId),
        currentAlbum: state.currentAlbum?.id === albumId ? null : state.currentAlbum,
      }))
    } catch (error) {
      console.error('[ProfileMediaStore] Error deleting album:', error)
      throw error
    }
  },

  // ========================================================================
  // UPLOAD QUEUE
  // ========================================================================

  addToUploadQueue: (item: UploadProgress) => {
    set((state) => ({
      uploadQueue: [...state.uploadQueue, item],
    }))
  },

  updateUploadProgress: (fileName: string, progress: number) => {
    set((state) => ({
      uploadQueue: state.uploadQueue.map((item) =>
        item.fileName === fileName ? { ...item, progress } : item
      ),
    }))
  },

  updateUploadStatus: (fileName: string, status: UploadProgress['status'], error?: string) => {
    set((state) => ({
      uploadQueue: state.uploadQueue.map((item) =>
        item.fileName === fileName ? { ...item, status, error } : item
      ),
    }))
  },

  removeFromUploadQueue: (fileName: string) => {
    set((state) => ({
      uploadQueue: state.uploadQueue.filter((item) => item.fileName !== fileName),
    }))
  },

  clearUploadQueue: () => {
    set({ uploadQueue: [] })
  },

  // ========================================================================
  // RESET
  // ========================================================================

  reset: () => {
    set({
      photos: [],
      isLoadingPhotos: false,
      photosError: null,
      videos: [],
      isLoadingVideos: false,
      videosError: null,
      albums: [],
      currentAlbum: null,
      isLoadingAlbums: false,
      albumsError: null,
      uploadQueue: [],
      isUploading: false,
    })
  },
}))

// ========================================================================
// HELPER FUNCTIONS
// ========================================================================

/**
 * Obtiene las dimensiones de una imagen
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
      URL.revokeObjectURL(img.src)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Obtiene metadatos de un video
 */
function getVideoMetadata(
  file: File
): Promise<{ duration: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      resolve({
        duration: Math.round(video.duration),
        width: video.videoWidth,
        height: video.videoHeight,
      })
      URL.revokeObjectURL(video.src)
    }

    video.onerror = reject
    video.src = URL.createObjectURL(file)
  })
}

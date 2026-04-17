import { useState } from 'react'
import { uploadService } from '@/lib/service/upload.service'

interface UploadState {
  isUploading: boolean
  progress: number
  error: string | null
}

/**
 * Hook para subir imágenes del servicio profesional (cover, logo) a Cloudflare Images.
 */
export function useUploadServiceImages() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  })

  const uploadImage = async (file: File): Promise<string> => {
    setUploadState({ isUploading: true, progress: 0, error: null })

    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Solo se permiten archivos de imagen')
      }
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        throw new Error('La imagen no puede ser mayor a 5MB')
      }

      const { url } = await uploadService.uploadImage(file, (progress) => {
        setUploadState((prev) => ({ ...prev, progress }))
      })

      setUploadState({ isUploading: false, progress: 100, error: null })
      return url
    } catch (error: any) {
      const errorMessage = error.message || 'Error al subir la imagen'
      setUploadState({ isUploading: false, progress: 0, error: errorMessage })
      throw error
    }
  }

  /**
   * Resetea el estado del upload
   */
  const reset = () => {
    setUploadState({ isUploading: false, progress: 0, error: null })
  }

  return {
    uploadImage,
    isUploading: uploadState.isUploading,
    progress: uploadState.progress,
    error: uploadState.error,
    reset,
  }
}

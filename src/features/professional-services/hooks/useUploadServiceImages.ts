import { useState } from 'react'
import { UploadService, UploadResult } from '@/lib/service/upload.service'

interface UploadState {
  isUploading: boolean
  progress: number
  error: string | null
}

/**
 * Hook para subir imágenes del servicio profesional (cover, logo)
 */
export function useUploadServiceImages() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
  })

  const uploadService = new UploadService()

  /**
   * Sube una imagen y retorna la URL de CloudFront
   */
  const uploadImage = async (file: File): Promise<string> => {
    setUploadState({ isUploading: true, progress: 0, error: null })

    try {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        throw new Error('Solo se permiten archivos de imagen')
      }

      // Validar tamaño (máximo 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new Error('La imagen no puede ser mayor a 5MB')
      }

      // 1. Obtener URL pre-firmada del backend
      const uploadUrlData = await uploadService.getUploadUrl({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      })

      // 2. Subir archivo a S3 usando la URL pre-firmada
      await uploadService.uploadFileToUrl(file, uploadUrlData.uploadUrl, (progress) => {
        setUploadState((prev) => ({ ...prev, progress }))
      })

      // 3. Retornar la URL pública de CloudFront
      setUploadState({ isUploading: false, progress: 100, error: null })
      return uploadUrlData.cloudFrontUrl
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

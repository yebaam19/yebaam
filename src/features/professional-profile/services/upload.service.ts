/**
 * Upload Service
 * 
 * Servicio para subir archivos a S3 usando presigned URLs
 */

import { getAxiosInstance } from '@/lib/http/legacy-client'

interface GenerateUploadUrlRequest {
  fileName: string
  fileType: string
  fileSize: number
  imageType: 'avatar' | 'cover'
}

interface GenerateUploadUrlResponse {
  uploadUrl: string
  cloudFrontUrl: string
  s3Key: string
}

class UploadService {
  private readonly axios = getAxiosInstance()

  /**
   * Generar presigned URL para subir imagen de perfil profesional
   */
  async generateProfileImageUploadUrl(data: GenerateUploadUrlRequest): Promise<GenerateUploadUrlResponse> {
    try {
      const response = await this.axios.post<GenerateUploadUrlResponse>(
        '/api/profile/generate-image-upload-url',
        data
      )
      return response.data
    } catch (error) {
      console.error('[UploadService] Error generating upload URL:', error)
      throw error
    }
  }

  /**
   * Subir archivo directamente a S3 usando presigned URL
   */
  async uploadToS3(uploadUrl: string, file: File): Promise<void> {
    try {
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })
    } catch (error) {
      console.error('[UploadService] Error uploading to S3:', error)
      throw error
    }
  }

  /**
   * Proceso completo: generar URL y subir archivo
   */
  async uploadProfileImage(file: File, imageType: 'avatar' | 'cover'): Promise<string> {
    try {
      // 1. Generar presigned URL
      const { uploadUrl, cloudFrontUrl } = await this.generateProfileImageUploadUrl({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        imageType,
      })

      // 2. Subir archivo a S3
      await this.uploadToS3(uploadUrl, file)

      // 3. Retornar URL de CloudFront
      return cloudFrontUrl
    } catch (error) {
      console.error('[UploadService] Error in upload process:', error)
      throw error
    }
  }
}

export const uploadService = new UploadService()

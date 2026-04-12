/**
 * Upload Service
 *
 * Servicio para subir archivos a Cloudinary
 */

interface CloudinaryUploadResponse {
  secure_url: string
  public_id: string
  resource_type: string
  format: string
  width?: number
  height?: number
  bytes: number
}

class UploadService {
  private cloudinaryUrl = `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`
  private uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'yeebaam_services'

  /**
   * Sube un archivo a Cloudinary
   */
  async uploadFile(file: File): Promise<string> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', this.uploadPreset)
      
      // Determinar el tipo de recurso
      const resourceType = file.type.startsWith('video/') ? 'video' : 'image'
      formData.append('resource_type', resourceType)

      const response = await fetch(
        this.cloudinaryUrl.replace('/upload', `/${resourceType}/upload`),
        {
          method: 'POST',
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const data: CloudinaryUploadResponse = await response.json()
      return data.secure_url
    } catch (error) {
      console.error('Error uploading file to Cloudinary:', error)
      throw new Error('Error al subir el archivo. Por favor intenta de nuevo.')
    }
  }

  /**
   * Sube múltiples archivos a Cloudinary
   */
  async uploadFiles(
    files: File[],
    onProgress?: (uploaded: number, total: number) => void
  ): Promise<string[]> {
    const urls: string[] = []

    for (let i = 0; i < files.length; i++) {
      const url = await this.uploadFile(files[i])
      urls.push(url)
      
      if (onProgress) {
        onProgress(i + 1, files.length)
      }
    }

    return urls
  }

  /**
   * Genera URL de thumbnail de Cloudinary
   */
  generateThumbnail(url: string, width: number = 300, height: number = 300): string {
    // Si no es una URL de Cloudinary, retornar la URL original
    if (!url.includes('cloudinary.com')) {
      return url
    }

    // Insertar transformaciones en la URL de Cloudinary
    const parts = url.split('/upload/')
    if (parts.length !== 2) return url

    return `${parts[0]}/upload/c_fill,w_${width},h_${height},q_auto,f_auto/${parts[1]}`
  }
}

export const uploadService = new UploadService()

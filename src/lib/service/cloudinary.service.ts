/**
 * Cloudinary Service
 * 
 * Servicio para subir archivos (imágenes/videos) a Cloudinary
 */

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  resourceType: 'image' | 'video';
  size: number;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  transformation?: string;
  onProgress?: (progress: number) => void;
}

class CloudinaryService {
  private cloudName: string;
  private uploadPreset: string;

  constructor() {
    // TODO: Configurar estas variables de entorno
    this.cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';
    this.uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || '';
  }

  /**
   * Sube un archivo a Cloudinary
   * 
   * @param file - Archivo a subir (imagen o video)
   * @param options - Opciones de configuración
   * @returns Información del archivo subido
   */
  async uploadFile(
    file: File,
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult> {
    if (!this.cloudName || !this.uploadPreset) {
      throw new Error('Cloudinary no está configurado. Agrega las variables de entorno.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    
    if (options.folder) {
      formData.append('folder', options.folder);
    }

    const resourceType = file.type.startsWith('video/') ? 'video' : 'image';
    const url = `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`;

    try {
      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        // Progreso de subida
        if (options.onProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              options.onProgress!(progress);
            }
          });
        }

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            resolve({
              url: response.secure_url,
              publicId: response.public_id,
              format: response.format,
              width: response.width,
              height: response.height,
              resourceType,
              size: response.bytes,
            });
          } else {
            reject(new Error('Error al subir el archivo'));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Error de red al subir el archivo'));
        });

        xhr.open('POST', url);
        xhr.send(formData);
      });
    } catch (error) {
      console.error('[CloudinaryService] Error al subir archivo:', error);
      throw error;
    }
  }

  /**
   * Sube múltiples archivos a Cloudinary
   * 
   * @param files - Array de archivos a subir
   * @param options - Opciones de configuración
   * @returns Array con información de los archivos subidos
   */
  async uploadMultipleFiles(
    files: File[],
    options: CloudinaryUploadOptions = {}
  ): Promise<CloudinaryUploadResult[]> {
    const uploadPromises = files.map((file, index) => {
      const fileOptions: CloudinaryUploadOptions = {
        ...options,
        onProgress: options.onProgress
          ? (progress) => options.onProgress!(progress)
          : undefined,
      };

      return this.uploadFile(file, fileOptions);
    });

    return Promise.all(uploadPromises);
  }

  /**
   * Elimina un archivo de Cloudinary
   * 
   * @param publicId - Public ID del archivo en Cloudinary
   * 
   * TODO: Implementar endpoint en el backend para eliminar archivos
   * por seguridad (requiere API secret)
   */
  async deleteFile(publicId: string): Promise<void> {
    console.log('[CloudinaryService] Delete file:', publicId);
    // Esta funcionalidad debe implementarse en el backend por seguridad
    // ya que requiere la API Secret de Cloudinary
  }

  /**
   * Genera una URL con transformaciones
   * 
   * @param publicId - Public ID del archivo
   * @param transformation - String de transformación de Cloudinary
   * @returns URL transformada
   */
  getTransformedUrl(publicId: string, transformation: string): string {
    return `https://res.cloudinary.com/${this.cloudName}/image/upload/${transformation}/${publicId}`;
  }

  /**
   * Verifica si Cloudinary está configurado correctamente
   */
  isConfigured(): boolean {
    return !!(this.cloudName && this.uploadPreset);
  }
}

export const cloudinaryService = new CloudinaryService();

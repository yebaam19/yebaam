/**
 * Upload Service
 * 
 * Servicio para obtener URLs pre-firmadas de S3 y subir archivos
 */

import { getAxiosInstance } from '@/lib/legacy-api/client';

/**
 * DTO para solicitar URL de subida (S3)
 */
export interface UploadUrlRequestDTO {
  fileName: string;
  fileType: string;
  fileSize: number;
  postId?: string;
}

/**
 * Respuesta del backend con URL de subida (S3)
 */
export interface UploadUrlResponse {
  uploadUrl: string;      // URL pre-firmada para hacer PUT
  s3Key: string;          // Key del archivo en S3
  expiresIn: number;      // Segundos hasta expiración
  cloudFrontUrl: string;  // URL pública de CloudFront
}

/**
 * Resultado de la subida de un archivo
 */
export interface UploadResult {
  url: string;           // CloudFront URL
  s3Key: string;         // S3 Key
  fileName: string;
  fileType: string;
  fileSize: number;
  type: 'image' | 'video'; // Tipo simplificado para el backend
}

export class UploadService {
  /**
   * Obtiene una URL pre-firmada del backend para subir un archivo a S3
   */
  async getUploadUrl(data: UploadUrlRequestDTO): Promise<UploadUrlResponse> {
    try {
      console.log('🔗 [UploadService] Solicitando presigned URL:', data);
      const axios = getAxiosInstance();
      const response = await axios.post('/api/create-post/generate-upload-urls', {
        files: [data]
      });
      
      console.log(' [UploadService] Presigned URL recibida:', response.data);
      
      // El backend devuelve { urls: [...], total: n }
      // Tomamos el primer elemento del array
      return (response.data as { urls: UploadUrlResponse[] }).urls[0];
    } catch (error: any) {

      throw new Error(error.response?.data?.message || 'Error al obtener URL de subida');
    }
  }

  /**
   * Sube un archivo usando la URL pre-firmada de S3
   */
  async uploadFileToUrl(
    file: File,
    uploadUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Progreso de subida
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error('Error al subir el archivo a S3'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Error de red al subir el archivo'));
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  }

  /**
   * Proceso completo: obtiene URL de S3 y sube el archivo
   */
  async uploadFile(
    file: File,
    postId?: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      console.log(' [UploadService] Iniciando upload de archivo:', {
        name: file.name,
        type: file.type,
        size: file.size,
        postId
      });

      // 1. Obtener URL pre-firmada del backend
      const uploadData: UploadUrlRequestDTO = {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        postId,
      };

      const { uploadUrl, s3Key, cloudFrontUrl } = await this.getUploadUrl(uploadData);

      console.log('📡 [UploadService] Subiendo a S3...', { s3Key, cloudFrontUrl });

      // 2. Subir archivo a S3 usando la URL pre-firmada
      await this.uploadFileToUrl(file, uploadUrl, onProgress);

      console.log(' [UploadService] Archivo subido exitosamente');

      // 3. Determinar tipo (image o video)
      const type: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';

      // 4. Retornar información del archivo subido
      const result: UploadResult = {
        url: cloudFrontUrl,  // URL de CloudFront
        s3Key,               // Key en S3
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        type,
      };

      console.log('📦 [UploadService] Resultado final:', result);

      return result;
    } catch (error) {
      console.error(' [UploadService] Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Sube múltiples archivos a S3
   */
  async uploadMultipleFiles(
    files: File[],
    postId?: string,
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file, index) => {
      return this.uploadFile(
        file,
        postId,
        onProgress ? (progress) => onProgress(index, progress) : undefined
      );
    });

    return Promise.all(uploadPromises);
  }
}

export const uploadService = new UploadService();

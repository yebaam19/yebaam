/**
 * Profile Upload Service
 * 
 * Servicio para subir fotos de perfil y portada a S3
 */

import { getAxiosInstance } from '@/lib/axios/axiosInstance';

export interface ProfileUploadUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadType: 'avatar' | 'cover';
}

export interface ProfileUploadUrlResponse {
  uploadUrl: string;
  s3Key: string;
  cloudFrontUrl: string;
  expiresIn: number;
}

export class ProfileUploadService {
  /**
   * Obtiene una URL pre-firmada para subir foto de perfil/portada
   */
  async getUploadUrl(data: ProfileUploadUrlRequest): Promise<ProfileUploadUrlResponse> {
    try {
      const axios = getAxiosInstance();
      const response = await axios.post('/api/current-user/profile/generate-upload-url', data);
      return response.data;
    } catch (error: any) {
      console.error('[ProfileUploadService] Error getting upload URL:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener URL de subida');
    }
  }

  /**
   * Sube un archivo usando la URL pre-firmada de S3
   */
  async uploadFileToS3(
    file: File,
    uploadUrl: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

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
   * Proceso completo: obtiene URL y sube la foto
   */
  async uploadProfilePhoto(
    file: File,
    uploadType: 'avatar' | 'cover',
    onProgress?: (progress: number) => void
  ): Promise<{ url: string; s3Key: string }> {
    try {
      // 1. Obtener URL pre-firmada
      const { uploadUrl, s3Key, cloudFrontUrl } = await this.getUploadUrl({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadType,
      });

      // 2. Subir archivo a S3
      await this.uploadFileToS3(file, uploadUrl, onProgress);

      // 3. Retornar URL de CloudFront y S3 Key
      return {
        url: cloudFrontUrl,
        s3Key,
      };
    } catch (error) {
      console.error('[ProfileUploadService] Error uploading photo:', error);
      throw error;
    }
  }
}

export const profileUploadService = new ProfileUploadService();

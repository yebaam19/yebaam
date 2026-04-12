/**
 * S3 Upload Service
 * 
 * Servicio para subir archivos directamente a AWS S3 usando presigned URLs
 * Similar al flujo de Stories - evita pasar archivos por el backend
 * 
 * Flujo:
 * 1. Solicitar presigned URL al backend
 * 2. Subir archivo directamente a S3 usando la presigned URL
 * 3. Registrar el media en la base de datos con la URL final de CloudFront
 */

import axios from 'axios';

interface PresignedUrlResponse {
  uploadUrl: string;
  s3Key: string;
  expiresIn: number;
  cloudFrontUrl: string;
}

interface UploadOptions {
  fileName: string;
  fileType: string;
  fileSize: number;
  serviceId: string;
}

class S3UploadService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  /**
   * Sube un archivo a S3 para un servicio profesional
   * 
   * @param file - Archivo a subir
   * @param serviceId - ID del servicio profesional
   * @returns URL pública de CloudFront
   */
  async uploadServiceMedia(file: File, serviceId: string): Promise<string> {
    try {
      // 1. Obtener presigned URL del backend
      const presignedData = await this.getPresignedUrl({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        serviceId,
      });

      // 2. Subir archivo directamente a S3
      await this.uploadToS3(file, presignedData.uploadUrl);

      // 3. Retornar la URL pública de CloudFront
      return presignedData.cloudFrontUrl;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Sube múltiples archivos en paralelo
   * 
   * @param files - Array de archivos
   * @param serviceId - ID del servicio
   * @returns Array de URLs públicas
   */
  async uploadMultipleFiles(
    files: File[],
    serviceId: string
  ): Promise<string[]> {
    const uploadPromises = files.map((file) =>
      this.uploadServiceMedia(file, serviceId)
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Solicita una presigned URL al backend
   */
  private async getPresignedUrl(
    options: UploadOptions
  ): Promise<PresignedUrlResponse> {
    const token = localStorage.getItem('token');

    const response = await axios.post(
      `${this.apiUrl}/api/professional-services/${options.serviceId}/media/upload-url`,
      {
        fileName: options.fileName,
        fileType: options.fileType,
        fileSize: options.fileSize,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  }

  /**
   * Sube el archivo directamente a S3 usando la presigned URL
   */
  private async uploadToS3(file: File, uploadUrl: string): Promise<void> {
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
    });
  }

  /**
   * Genera un thumbnail para videos (opcional)
   * Esto se puede implementar en el frontend usando canvas
   */
  async generateVideoThumbnail(file: File): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!file.type.startsWith('video/')) {
        resolve(null);
        return;
      }

      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;

      video.onloadedmetadata = () => {
        // Capturar frame en el segundo 1
        video.currentTime = 1;
      };

      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.8);
      };

      video.onerror = () => {
        resolve(null);
      };

      video.src = URL.createObjectURL(file);
    });
  }
}

export const s3UploadService = new S3UploadService();

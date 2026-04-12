import { getAxiosInstance } from '@/lib/axios/axiosInstance';
import {
  BusinessPhoto,
  CreateBusinessPhotoDto,
  UploadPhotoInput,
} from '../interfaces/business-photo.interface';

class BusinessPhotosService {
  private readonly baseUrl = '/api/businesses';

  private get api() {
    return getAxiosInstance();
  }

  /**
   * Get photos for a business
   */
  async getBusinessPhotos(businessId: string): Promise<BusinessPhoto[]> {
    const response = await this.api.get<BusinessPhoto[]>(
      `${this.baseUrl}/${businessId}/photos`
    );
    return response.data;
  }

  /**
   * Get photos count for a business
   */
  async getPhotosCount(businessId: string): Promise<number> {
    const response = await this.api.get<{ count: number }>(
      `${this.baseUrl}/${businessId}/photos/count`
    );
    return response.data.count;
  }

  /**
   * Upload a photo to a business
   */
  async uploadPhoto(
    businessId: string,
    input: UploadPhotoInput
  ): Promise<BusinessPhoto> {
    const { file, caption, tags } = input;

    // Step 1: Generate presigned URL
    const uploadUrlResponse = await this.api.post<{
      uploadUrl: string;
      cloudFrontUrl: string;
      s3Key: string;
      expiresIn: number;
    }>(`${this.baseUrl}/upload/generate-photo-url`, {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      businessId,
    });

    const { uploadUrl, cloudFrontUrl, s3Key } = uploadUrlResponse.data;

    console.log('[BusinessPhotosService] Presigned URL generated:', {
      uploadUrl,
      cloudFrontUrl,
      s3Key,
    });

    // Step 2: Upload to S3
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    console.log('[BusinessPhotosService] File uploaded to S3');

    // Step 3: Determine aspect ratio
    const aspectRatio = await this.determineAspectRatio(file);

    // Step 4: Create photo record
    const photoDto: CreateBusinessPhotoDto = {
      url: cloudFrontUrl,
      s3Key,
      caption,
      tags,
      aspectRatio,
      size: file.size,
      mimeType: file.type,
    };

    const response = await this.api.post<BusinessPhoto>(
      `${this.baseUrl}/${businessId}/photos`,
      photoDto
    );

    console.log('[BusinessPhotosService] Photo record created:', response.data);

    return response.data;
  }

  /**
   * Upload multiple photos
   */
  async uploadMultiplePhotos(
    businessId: string,
    inputs: UploadPhotoInput[]
  ): Promise<BusinessPhoto[]> {
    const uploadPromises = inputs.map((input) =>
      this.uploadPhoto(businessId, input)
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a photo
   */
  async deletePhoto(businessId: string, photoId: string): Promise<void> {
    await this.api.delete(`${this.baseUrl}/${businessId}/photos/${photoId}`);
  }

  /**
   * Determine aspect ratio of image
   */
  private async determineAspectRatio(
    file: File
  ): Promise<'square' | 'portrait' | 'landscape' | 'panorama'> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        const { width, height } = img;
        URL.revokeObjectURL(url);

        const ratio = width / height;

        if (ratio > 1.5) {
          resolve('panorama');
        } else if (ratio > 1.1) {
          resolve('landscape');
        } else if (ratio < 0.9) {
          resolve('portrait');
        } else {
          resolve('square');
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve('square'); // Default fallback
      };

      img.src = url;
    });
  }
}

export const businessPhotosService = new BusinessPhotosService();

import { getAxiosInstance } from '@/lib/http/legacy-client';
import {
  PagePhoto,
  CreatePagePhotoDto,
  UploadPhotoInput,
} from '../interfaces/page-photo.interface';

class PagePhotosService {
  private readonly baseUrl = '/api/pages';

  private get api() {
    return getAxiosInstance();
  }

  /**
   * Get photos for a page
   */
  async getPagePhotos(pageId: string): Promise<PagePhoto[]> {
    const response = await this.api.get<PagePhoto[]>(
      `${this.baseUrl}/${pageId}/photos`
    );
    return response.data;
  }

  /**
   * Get photos count for a page
   */
  async getPhotosCount(pageId: string): Promise<number> {
    const response = await this.api.get<{ count: number }>(
      `${this.baseUrl}/${pageId}/photos/count`
    );
    return response.data.count;
  }

  /**
   * Upload a photo to a page
   */
  async uploadPhoto(
    pageId: string,
    input: UploadPhotoInput
  ): Promise<PagePhoto> {
    const { file, caption } = input;

    // Step 1: Generate presigned URL
    const uploadUrlResponse = await this.api.post<{
      uploadUrl: string;
      fileUrl: string;
      s3Key: string;
    }[]>('/create-post/generate-upload-urls', {
      files: [
        {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        },
      ],
    });

    const { uploadUrl, fileUrl, s3Key } = uploadUrlResponse.data[0];

    // Step 2: Upload to S3
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    // Step 3: Determine aspect ratio
    const aspectRatio = await this.determineAspectRatio(file);

    // Step 4: Create photo record
    const photoDto: CreatePagePhotoDto = {
      url: fileUrl,
      s3Key,
      caption,
      aspectRatio,
      size: file.size,
      mimeType: file.type,
    };

    const response = await this.api.post<PagePhoto>(
      `${this.baseUrl}/${pageId}/photos`,
      photoDto
    );

    return response.data;
  }

  /**
   * Delete a photo
   */
  async deletePhoto(pageId: string, photoId: string): Promise<void> {
    await this.api.delete(`${this.baseUrl}/${pageId}/photos/${photoId}`);
  }

  /**
   * Determine aspect ratio of image
   */
  private async determineAspectRatio(
    file: File
  ): Promise<'vertical' | 'horizontal' | 'square'> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        const { width, height } = img;
        URL.revokeObjectURL(url);

        const ratio = width / height;

        if (ratio > 1.1) {
          resolve('horizontal');
        } else if (ratio < 0.9) {
          resolve('vertical');
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

export const pagePhotosService = new PagePhotosService();

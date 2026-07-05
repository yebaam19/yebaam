import { getAxiosInstance } from '@/lib/http/legacy-client';
import { uploadService } from '@/lib/service/upload.service';
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

  async getPagePhotos(pageId: string): Promise<PagePhoto[]> {
    const response = await this.api.get<PagePhoto[]>(
      `${this.baseUrl}/${pageId}/photos`
    );
    return response.data;
  }

  async getPhotosCount(pageId: string): Promise<number> {
    const response = await this.api.get<{ count: number }>(
      `${this.baseUrl}/${pageId}/photos/count`
    );
    return response.data.count;
  }

  async uploadPhoto(
    pageId: string,
    input: UploadPhotoInput
  ): Promise<PagePhoto> {
    const { file, caption } = input;

    const { id } = await uploadService.uploadImage(file);
    const aspectRatio = await this.determineAspectRatio(file);

    // House rule: persist the bare Cloudflare Images id, never the delivery
    // URL. The `url` column carries the id going forward (legacy rows keep
    // their full URL); readers resolve both via resolveImageRef().
    const photoDto: CreatePagePhotoDto = {
      url: id,
      s3Key: id,
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

  async deletePhoto(pageId: string, photoId: string): Promise<void> {
    await this.api.delete(`${this.baseUrl}/${pageId}/photos/${photoId}`);
  }

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
        resolve('square');
      };

      img.src = url;
    });
  }
}

export const pagePhotosService = new PagePhotosService();

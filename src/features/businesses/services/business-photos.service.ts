import {
  BusinessPhoto,
  UploadPhotoInput,
} from '../interfaces/business-photo.interface';

type UploadRouteResponse = {
  success?: boolean;
  data?: {
    url: string;
    key: string;
    bucket: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  };
  error?: string;
};

async function postFileToUploadRoute(file: File): Promise<UploadRouteResponse['data']> {
  const form = new FormData();
  form.append('file', file);
  form.append('bucket', 'posts');
  form.append('folder', 'business');

  const response = await fetch('/api/upload', {
    method: 'POST',
    credentials: 'same-origin',
    body: form,
  });
  const payload = (await response.json().catch(() => ({}))) as UploadRouteResponse;
  if (!response.ok || !payload.data) {
    throw new Error(payload.error || 'Failed to upload business photo');
  }
  return payload.data;
}

async function determineAspectRatio(file: File): Promise<'square' | 'portrait' | 'landscape' | 'panorama'> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || typeof Image === 'undefined') {
      resolve('square');
      return;
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = img.width / img.height;
      URL.revokeObjectURL(url);
      if (ratio > 1.5) resolve('panorama');
      else if (ratio > 1.1) resolve('landscape');
      else if (ratio < 0.9) resolve('portrait');
      else resolve('square');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve('square');
    };
    img.src = url;
  });
}

class BusinessPhotosService {
  private readonly baseUrl = '/api/businesses';

  async getBusinessPhotos(businessId: string): Promise<BusinessPhoto[]> {
    const response = await fetch(`${this.baseUrl}/${businessId}/photos`, {
      credentials: 'same-origin',
    });
    if (!response.ok) return [];
    const data = (await response.json().catch(() => [])) as BusinessPhoto[] | {
      data?: BusinessPhoto[];
    };
    return Array.isArray(data) ? data : data.data ?? [];
  }

  async getPhotosCount(businessId: string): Promise<number> {
    const response = await fetch(`${this.baseUrl}/${businessId}/photos/count`, {
      credentials: 'same-origin',
    });
    if (!response.ok) return 0;
    const data = (await response.json().catch(() => ({ count: 0 }))) as { count?: number };
    return data.count ?? 0;
  }

  async uploadPhoto(
    businessId: string,
    input: UploadPhotoInput,
  ): Promise<BusinessPhoto> {
    const { file, caption, tags } = input;
    const uploaded = await postFileToUploadRoute(file);
    if (!uploaded) throw new Error('Upload failed');

    const aspectRatio = await determineAspectRatio(file);
    const response = await fetch(`${this.baseUrl}/${businessId}/photos`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: uploaded.url,
        type: 'IMAGE',
        caption,
        alt: Array.isArray(tags) ? tags.join(',') : undefined,
        aspectRatio,
        size: file.size,
        mimeType: file.type,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as BusinessPhoto & {
      error?: string;
    };
    if (!response.ok) {
      throw new Error(payload.error ?? 'Failed to save photo record');
    }
    return payload;
  }

  async uploadMultiplePhotos(
    businessId: string,
    inputs: UploadPhotoInput[],
  ): Promise<BusinessPhoto[]> {
    return Promise.all(inputs.map((input) => this.uploadPhoto(businessId, input)));
  }

  async deletePhoto(businessId: string, photoId: string): Promise<void> {
    const response = await fetch(
      `${this.baseUrl}/${businessId}/photos/${photoId}`,
      { method: 'DELETE', credentials: 'same-origin' },
    );
    if (!response.ok && response.status !== 404) {
      const payload = await response.json().catch(() => ({}));
      throw new Error((payload as { error?: string }).error ?? 'Failed to delete photo');
    }
  }
}

export const businessPhotosService = new BusinessPhotosService();

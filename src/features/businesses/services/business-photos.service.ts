import {
  BusinessPhoto,
  UploadPhotoInput,
} from '../interfaces/business-photo.interface';

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
    _businessId: string,
    _input: UploadPhotoInput,
  ): Promise<BusinessPhoto> {
    throw new Error(
      'Business photo upload is not yet wired to InsForge. Pending schema for businesses tables.',
    );
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

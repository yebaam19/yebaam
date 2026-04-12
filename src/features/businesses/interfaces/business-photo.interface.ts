export interface BusinessPhoto {
  id: string;
  businessId: string;
  uploadedBy: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  url: string;
  s3Key: string;
  caption: string;
  tags: string[];
  aspectRatio: 'square' | 'portrait' | 'landscape' | 'panorama';
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface CreateBusinessPhotoDto {
  url: string;
  s3Key: string;
  caption?: string;
  tags?: string[];
  aspectRatio?: string;
  size?: number;
  mimeType?: string;
}

export interface UploadPhotoInput {
  file: File;
  caption?: string;
  tags?: string[];
}

export interface PagePhoto {
  id: string;
  pageId: string;
  uploadedBy: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  url: string;
  s3Key: string;
  caption?: string;
  aspectRatio: 'vertical' | 'horizontal' | 'square';
  size: number;
  mimeType: string;
  likesCount: number;
  commentsCount: number;
  uploadedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePagePhotoDto {
  url: string;
  s3Key: string;
  caption?: string;
  aspectRatio?: 'vertical' | 'horizontal' | 'square';
  size?: number;
  mimeType?: string;
}

export interface UploadPhotoInput {
  file: File;
  caption?: string;
}

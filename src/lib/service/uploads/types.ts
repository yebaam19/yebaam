export interface UploadResult {
  url: string;
  s3Key: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  type: 'image' | 'video';
  /** Populated for videos uploaded to Cloudflare Stream. */
  streamUid?: string;
  /** Populated for videos; thumbnail image URL returned by Cloudflare Stream. */
  thumbnailUrl?: string;
  /** Populated for videos; duration in seconds. */
  duration?: number;
}

export interface CloudflareImageUploadResult {
  id: string;
  url: string;
}

export interface CloudflareStreamUploadResult {
  uid: string;
  readyToStream: boolean;
  duration: number;
  thumbnail: string;
}

export interface R2AudioUploadResult {
  key: string;
  durationSeconds: number;
  sizeBytes: number;
  contentType: string;
}

export interface R2DocumentUploadResult {
  key: string;
  sizeBytes: number;
  contentType: string;
}

export interface CommunityDocumentUploadOptions {
  communityId: string;
  /** Stable for retries of the same file, new for a replacement. */
  uploadId: string;
}


export type MultipartUpload = (url: string, file: File, onProgress?: (progress: number) => void) => Promise<void>;
export type R2Upload = (url: string, body: File | Blob, contentType: string, onProgress?: (progress: number) => void) => Promise<void>;

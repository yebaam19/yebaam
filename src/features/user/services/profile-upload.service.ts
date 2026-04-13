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

type UploadRouteResponse = {
  success: boolean;
  data: {
    url: string;
    key: string;
    bucket: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  };
  error?: string;
};

function bucketFor(uploadType: 'avatar' | 'cover'): string {
  return uploadType === 'avatar' ? 'avatars' : 'covers';
}

async function postToUploadRoute(
  file: File,
  bucket: string,
  folder: string,
  onProgress?: (progress: number) => void,
): Promise<UploadRouteResponse['data']> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    form.append('bucket', bucket);
    if (folder) form.append('folder', folder);

    const xhr = new XMLHttpRequest();
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }
    xhr.addEventListener('load', () => {
      try {
        const payload = JSON.parse(xhr.responseText || '{}') as UploadRouteResponse;
        if (xhr.status >= 200 && xhr.status < 300 && payload.data) {
          resolve(payload.data);
        } else {
          reject(new Error(payload.error || 'Error al subir la foto'));
        }
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Error parsing upload response'));
      }
    });
    xhr.addEventListener('error', () => reject(new Error('Error de red al subir el archivo')));
    xhr.open('POST', '/api/upload');
    xhr.send(form);
  });
}

export class ProfileUploadService {
  async getUploadUrl(_data: ProfileUploadUrlRequest): Promise<ProfileUploadUrlResponse> {
    throw new Error(
      'Presigned URL uploads are no longer supported. Use profileUploadService.uploadProfilePhoto(file, uploadType).',
    );
  }

  async uploadFileToS3(
    _file: File,
    _uploadUrl: string,
    _onProgress?: (progress: number) => void,
  ): Promise<void> {
    throw new Error(
      'Direct S3 PUT is no longer supported. Use profileUploadService.uploadProfilePhoto(file, uploadType).',
    );
  }

  async uploadProfilePhoto(
    file: File,
    uploadType: 'avatar' | 'cover',
    onProgress?: (progress: number) => void,
  ): Promise<{ url: string; s3Key: string }> {
    const bucket = bucketFor(uploadType);
    const data = await postToUploadRoute(file, bucket, uploadType, onProgress);
    return { url: data.url, s3Key: data.key };
  }
}

export const profileUploadService = new ProfileUploadService();

export interface UploadUrlRequestDTO {
  fileName: string;
  fileType: string;
  fileSize: number;
  postId?: string;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  s3Key: string;
  expiresIn: number;
  cloudFrontUrl: string;
}

export interface UploadResult {
  url: string;
  s3Key: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  type: 'image' | 'video';
}

type UploadResponsePayload = {
  success: boolean;
  data: {
    url: string;
    key: string;
    bucket: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  };
};

async function uploadViaRoute(
  file: File,
  bucket: string,
  folder: string,
  onProgress?: (progress: number) => void,
): Promise<UploadResponsePayload['data']> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('file', file);
    form.append('bucket', bucket);
    if (folder) form.append('folder', folder);

    const xhr = new XMLHttpRequest();
    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.addEventListener('load', () => {
      try {
        const payload = JSON.parse(xhr.responseText || '{}') as Partial<UploadResponsePayload> & {
          error?: string;
        };
        if (xhr.status >= 200 && xhr.status < 300 && payload.data) {
          resolve(payload.data);
        } else {
          reject(new Error(payload.error || 'Error al subir el archivo'));
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

export class UploadService {
  async getUploadUrl(_data: UploadUrlRequestDTO): Promise<UploadUrlResponse> {
    throw new Error(
      'Presigned URL uploads are no longer supported. Use uploadService.uploadFile(file) which posts to /api/upload.',
    );
  }

  async uploadFileToUrl(
    _file: File,
    _uploadUrl: string,
    _onProgress?: (progress: number) => void,
  ): Promise<void> {
    throw new Error(
      'Direct S3 PUT is no longer supported. Use uploadService.uploadFile(file) which posts to /api/upload.',
    );
  }

  async uploadFile(
    file: File,
    postId?: string,
    onProgress?: (progress: number) => void,
  ): Promise<UploadResult> {
    const folder = postId ? `posts/${postId}` : 'posts';
    const data = await uploadViaRoute(file, 'posts', folder, onProgress);
    const type: 'image' | 'video' = file.type.startsWith('video/') ? 'video' : 'image';
    return {
      url: data.url,
      s3Key: data.key,
      fileName: data.fileName,
      fileType: data.fileType,
      fileSize: data.fileSize,
      type,
    };
  }

  async uploadMultipleFiles(
    files: File[],
    postId?: string,
    onProgress?: (fileIndex: number, progress: number) => void,
  ): Promise<UploadResult[]> {
    return Promise.all(
      files.map((file, index) =>
        this.uploadFile(file, postId, onProgress ? (p) => onProgress(index, p) : undefined),
      ),
    );
  }
}

export const uploadService = new UploadService();

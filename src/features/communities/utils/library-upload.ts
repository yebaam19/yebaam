import { uploadService } from '@/lib/service/upload.service';
import { documentContentType } from '@/lib/upload-documents';
import { MAX_DOCUMENT_BYTES, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from '@/lib/upload-limits';
import type { AssetKind, LibraryAsset } from '../types/communityLibrary.types';
import { finalizeLibraryAsset } from '../actions/library/content.actions';

export interface LibraryUpload {
  id: string; file: File; contentType: string; mediaId?: string;
  progress: number; state: 'queued' | 'uploading' | 'processing' | 'saving' | 'saved' | 'error'; error?: string;
}

export function libraryFileType(file: File, kind: AssetKind): string | null {
  if (!file.size || file.name.length > 255) return null;
  if (kind === 'document') return file.size <= MAX_DOCUMENT_BYTES ? documentContentType(file.name, file.type) : null;
  const allowed = kind === 'image'
    ? ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
    : ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-matroska'];
  return allowed.includes(file.type) && file.size <= (kind === 'image' ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES) ? file.type : null;
}

// The caller retains each row, including its remote ID, across finalization retries.
export async function uploadLibraryItem(communityId: string, kind: AssetKind, item: LibraryUpload,
  patch: (value: Partial<LibraryUpload>) => void, replacement?: LibraryAsset) {
  let mediaId = item.mediaId;
  if (!mediaId) {
    patch({ state: 'uploading', error: undefined });
    const onProgress = (progress: number) => patch({ progress });
    const source = `community-library:${communityId}`;
    if (kind === 'image') mediaId = (await uploadService.uploadImage(item.file, onProgress, { source })).id;
    else if (kind === 'video') {
      mediaId = (await uploadService.uploadVideo(item.file, { source, onProgress,
        onUploaded: (uid) => patch({ mediaId: uid, state: 'processing' }),
        onTranscode: () => patch({ state: 'processing' }),
      })).uid;
    } else {
      await uploadService.uploadDocument(item.file, onProgress, { communityId, uploadId: item.id });
      mediaId = item.id;
    }
    patch({ mediaId });
  }
  patch({ state: 'saving', error: undefined });
  const result = await finalizeLibraryAsset({ communityId, id: item.id, kind, mediaId, title: item.file.name.slice(0, 200),
    fileName: item.file.name, contentType: item.contentType, replaceId: replacement?.id, expectedVersion: replacement?.version });
  if (!result.ok) throw new Error(result.error);
  patch({ state: 'saved', progress: 100 });
}

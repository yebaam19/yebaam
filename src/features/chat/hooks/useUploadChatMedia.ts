import { useState } from 'react';
import { uploadService, detectAudioDuration } from '@/lib/service/upload.service';
import { MediaType, type MessageMedia } from '../types';
import { chatDocMime, normalizeChatAudioMime, uploadToChatR2 } from '../lib/chatR2Upload';

// Re-exported so composers keep a single import site for upload + type.
export { MediaType };

interface UploadChatMediaParams {
  file: File;
  mediaType: MediaType;
}

/** Discriminated per media type: images/videos live on Cloudflare (id/uid),
 *  audio and documents live on R2 under chat-scoped keys. */
export type ChatMediaResult =
  | { type: MediaType.IMAGE; cfImageId: string; url: string; size: number; filename: string }
  | { type: MediaType.VIDEO; cfStreamUid: string; url: string; size: number; filename: string }
  | {
      type: MediaType.AUDIO;
      r2Key: string;
      mime: string;
      durationSeconds: number;
      size: number;
      filename: string;
    }
  | { type: MediaType.FILE; r2Key: string; mime: string; size: number; filename: string };

/** Single source of truth for the persisted `messages.media` shape (media refs
 *  live OUTSIDE the encrypted content column): audio→r2_key+duration,
 *  file→r2_key+filename, image/video→Cloudflare id/uid. Both composers map
 *  through here so the shapes can't drift. */
export function toMessageMedia(result: ChatMediaResult): MessageMedia {
  switch (result.type) {
    case MediaType.IMAGE:
      return {
        type: MediaType.IMAGE,
        cf_image_id: result.cfImageId,
        size: result.size,
        filename: result.filename,
      };
    case MediaType.VIDEO:
      return {
        type: MediaType.VIDEO,
        cf_stream_uid: result.cfStreamUid,
        size: result.size,
        filename: result.filename,
      };
    case MediaType.AUDIO:
      return {
        type: MediaType.AUDIO,
        r2_key: result.r2Key,
        mime: result.mime,
        // A failed best-effort probe yields 0 — omit so the label stays hidden.
        duration: Math.round(result.durationSeconds) || undefined,
        size: result.size,
        filename: result.filename,
      };
    case MediaType.FILE:
      return {
        type: MediaType.FILE,
        r2_key: result.r2Key,
        mime: result.mime,
        size: result.size,
        filename: result.filename,
      };
  }
}

export function useUploadChatMedia() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadMedia = async (
    params: UploadChatMediaParams
  ): Promise<ChatMediaResult | null> => {
    const { file, mediaType } = params;
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      if (mediaType === MediaType.IMAGE) {
        const { id, url } = await uploadService.uploadImage(file, (p) =>
          setUploadProgress(p),
        );
        return {
          type: MediaType.IMAGE,
          cfImageId: id,
          url,
          size: file.size,
          filename: file.name,
        };
      }

      if (mediaType === MediaType.VIDEO) {
        const { uid } = await uploadService.uploadVideo(file, {
          onProgress: (p) => setUploadProgress(p),
        });
        return {
          type: MediaType.VIDEO,
          cfStreamUid: uid,
          url: `https://iframe.videodelivery.net/${uid}`,
          size: file.size,
          filename: file.name,
        };
      }

      if (mediaType === MediaType.AUDIO) {
        // Chat-scoped signing (`chat-audio/…` keys): the conversation playback
        // route rejects anything outside that prefix, so the music-archive
        // uploadAudio flow (`tracks/…`) must not be used here.
        const mime = normalizeChatAudioMime(file.type);
        if (!mime) throw new Error('Unsupported audio type for chat upload');
        // Best-effort probe (always settles); the duration only feeds the label.
        const durationSeconds = await detectAudioDuration(file);
        const { key, mime: storedMime } = await uploadToChatR2(
          '/api/chat/audio-url',
          { contentType: mime },
          file,
          mime,
          (p) => setUploadProgress(p),
        );
        return {
          type: MediaType.AUDIO,
          r2Key: key,
          mime: storedMime,
          durationSeconds,
          size: file.size,
          filename: file.name,
        };
      }

      if (mediaType === MediaType.FILE) {
        const mime = chatDocMime(file.name);
        if (!mime) throw new Error('Unsupported file type for chat upload');
        const { key, mime: storedMime } = await uploadToChatR2(
          '/api/chat/file-url',
          { contentType: mime, size: file.size },
          file,
          mime,
          (p) => setUploadProgress(p),
        );
        return {
          type: MediaType.FILE,
          r2Key: key,
          mime: storedMime,
          size: file.size,
          filename: file.name,
        };
      }

      throw new Error(`Unsupported media type for chat upload: ${mediaType}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error al subir el archivo';
      setError(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadMedia,
    isUploading,
    uploadProgress,
    error,
  };
}

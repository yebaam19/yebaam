import { useState } from 'react';

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
}

interface UploadChatMediaParams {
  file: File;
  mediaType: MediaType;
}

interface ChatMediaResult {
  url: string;
  s3Key: string;
  type: MediaType;
  size: number;
  filename: string;
}

/**
 * Chat media upload hook — STUB.
 *
 * The old S3 presigned-URL flow is gone. Chat itself has not been migrated
 * to InsForge yet (no `messages` / `conversations` tables), so uploads
 * deliberately throw a migration error. Once chat is migrated, this hook
 * should call `insforge.storage.from('chat-media').uploadAuto(file)`.
 */
export function useUploadChatMedia() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadMedia = async (
    _params: UploadChatMediaParams
  ): Promise<ChatMediaResult | null> => {
    setIsUploading(false);
    setUploadProgress(0);
    const message =
      'Chat media upload is not yet migrated to InsForge. Create a chat-media bucket and wire this hook to insforge.storage.';
    setError(message);
    console.warn('[useUploadChatMedia]', message);
    return null;
  };

  return {
    uploadMedia,
    isUploading,
    uploadProgress,
    error,
  };
}

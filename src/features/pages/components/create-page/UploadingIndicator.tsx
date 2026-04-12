import { FC } from 'react';

interface UploadingIndicatorProps {
  uploadingAvatar: boolean;
  uploadingCover: boolean;
}

export const UploadingIndicator: FC<UploadingIndicatorProps> = ({
  uploadingAvatar,
  uploadingCover,
}) => {
  if (!uploadingAvatar && !uploadingCover) {
    return null;
  }

  const message = uploadingAvatar && uploadingCover
    ? 'Subiendo imágenes...'
    : uploadingAvatar
    ? 'Subiendo imagen de perfil...'
    : 'Subiendo imagen de portada...';

  return (
    <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
      <p className="text-sm text-blue-600 dark:text-blue-400">{message}</p>
    </div>
  );
};

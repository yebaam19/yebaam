import { FC } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ImageUploadPreviewProps {
  preview: string | null;
  onRemove: () => void;
  onClick: () => void;
  type: 'cover' | 'profile';
  isUploading?: boolean;
}

export const ImageUploadPreview: FC<ImageUploadPreviewProps> = ({
  preview,
  onRemove,
  onClick,
  type,
  isUploading = false,
}) => {
  if (type === 'cover') {
    return preview ? (
      <div className="relative w-full h-48 rounded-lg overflow-hidden group">
        <img
          src={preview}
          alt="Cover preview"
          className="w-full h-full object-cover"
        />
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
          disabled={isUploading}
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    ) : (
      <button
        onClick={onClick}
        disabled={isUploading}
        className="w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-blue-500 dark:hover:border-blue-400 transition-colors disabled:opacity-50"
      >
        <PhotoIcon className="w-12 h-12 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Haz clic para seleccionar una imagen
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          Recomendado: 1200x480px
        </p>
      </button>
    );
  }

  // Profile type
  return preview ? (
    <div className="relative w-32 h-32 rounded-full overflow-hidden group mx-auto">
      <img
        src={preview}
        alt="Avatar preview"
        className="w-full h-full object-cover"
      />
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
        disabled={isUploading}
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  ) : (
    <button
      onClick={onClick}
      disabled={isUploading}
      className="w-32 h-32 mx-auto border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-full flex flex-col items-center justify-center gap-1 hover:border-blue-500 dark:hover:border-blue-400 transition-colors disabled:opacity-50"
    >
      <PhotoIcon className="w-8 h-8 text-gray-400" />
      <p className="text-xs text-gray-600 dark:text-gray-400">
        Seleccionar
      </p>
    </button>
  );
};

'use client';

import { PhotoIcon, UserGroupIcon, MapPinIcon, GifIcon } from '@heroicons/react/24/outline';
import PostFeelingSelector from './PostFeelingSelector';
import type { PostFeeling } from '../interfaces/post.interfaces';

interface PostEnhancementsPickerProps {
  onFeelingSelect: (feeling: PostFeeling) => void;
  onPhotoClick?: () => void;
  disabled?: boolean;
}

export default function PostEnhancementsPicker({
  onFeelingSelect,
  onPhotoClick,
  disabled = false,
}: PostEnhancementsPickerProps) {
  return (
    <div className="p-3">
      <p className="mb-2 text-sm font-semibold text-neutral-900 dark:text-white">
        Opciones adicionales
      </p>
      <div className="flex items-center gap-1">
        {/* Photo/Video Upload */}
        {onPhotoClick && (
          <button
            type="button"
            onClick={onPhotoClick}
            disabled={disabled}
            className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Foto/video"
          >
            <PhotoIcon className="h-6 w-6 text-green-600" />
          </button>
        )}
        
        {/* Feeling/Activity Selector */}
        <PostFeelingSelector onSelect={onFeelingSelect} disabled={disabled} />
        
        {/* Tag People (Coming Soon) */}
        <button
          type="button"
          disabled={true}
          className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Etiquetar personas (Próximamente)"
        >
          <UserGroupIcon className="h-6 w-6 text-blue-600" />
        </button>
        
        {/* Location (Coming Soon) */}
        <button
          type="button"
          disabled={true}
          className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Ubicación (Próximamente)"
        >
          <MapPinIcon className="h-6 w-6 text-red-600" />
        </button>
        
        {/* GIF (Coming Soon) */}
        <button
          type="button"
          disabled={true}
          className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed"
          title="GIF (Próximamente)"
        >
          <GifIcon className="h-6 w-6 text-purple-600" />
        </button>
      </div>
    </div>
  );
}

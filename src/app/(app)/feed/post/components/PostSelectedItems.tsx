'use client';

import { XMarkIcon, MapPinIcon } from '@/components/icons/heroicons-shim';
import type { PostFeeling, PostLocation, PostGif } from '../interfaces/post.interfaces';

interface PostSelectedItemsProps {
  feeling?: PostFeeling | null;
  location?: PostLocation | null;
  gif?: PostGif | null;
  onRemoveFeeling?: () => void;
  onRemoveLocation?: () => void;
  onRemoveGif?: () => void;
}

export default function PostSelectedItems({
  feeling,
  location,
  gif,
  onRemoveFeeling,
  onRemoveLocation,
  onRemoveGif,
}: PostSelectedItemsProps) {
  return (
    <div className="space-y-3">
      {/* Selected Feeling/Activity */}
      {feeling && (
        <div className="mx-6 flex items-center gap-2 rounded-lg bg-neutral-100 px-3 py-2 dark:bg-neutral-800">
          <span className="text-lg">{feeling.emoji}</span>
          <span className="text-sm text-neutral-700 dark:text-neutral-300">
            {feeling.prefix} <span className="font-semibold">{feeling.label}</span>
          </span>
          {onRemoveFeeling && (
            <button
              type="button"
              onClick={onRemoveFeeling}
              className="ml-auto text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Selected Location */}
      {location && (
        <div className="mx-6 flex items-center gap-2 rounded-lg bg-neutral-100 px-3 py-2 dark:bg-neutral-800">
          <MapPinIcon className="h-5 w-5 text-red-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
              {location.name}
            </p>
            {location.address && (
              <p className="text-xs text-neutral-500">{location.address}</p>
            )}
          </div>
          {onRemoveLocation && (
            <button
              type="button"
              onClick={onRemoveLocation}
              className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Selected GIF */}
      {gif && (
        <div className="mx-6 relative rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
          <img 
            src={gif.url} 
            alt={gif.title || 'GIF'}
            className="w-full h-auto"
            decoding="async"
            loading="lazy"
          />
          {onRemoveGif && (
            <button
              type="button"
              onClick={onRemoveGif}
              className="absolute right-2 top-2 rounded-full bg-neutral-900/80 p-1.5 text-white hover:bg-neutral-900"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

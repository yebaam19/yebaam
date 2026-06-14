'use client';

import Image from 'next/image';
import { VideoCameraIcon, XMarkIcon } from '@/components/icons/heroicons-shim';

export type PendingMedia =
  | { kind: 'image'; cfImageId: string; previewUrl: string }
  | { kind: 'video'; cfVideoUid: string; thumbnail?: string };

interface MediaPreviewGridProps {
  media: PendingMedia[];
  onRemove: (index: number) => void;
}

export function MediaPreviewGrid({ media, onRemove }: MediaPreviewGridProps) {
  if (media.length === 0) return null;
  return (
    <div className="grid grid-cols-3 gap-2">
      {media.map((m, idx) => (
        <div
          key={idx}
          className="relative aspect-square overflow-hidden rounded-md bg-gray-100 dark:bg-gray-900"
        >
          {m.kind === 'image' ? (
            <Image
              src={m.previewUrl}
              alt=""
              fill
              sizes="120px"
              className="object-cover"
              unoptimized
            />
          ) : m.thumbnail ? (
            <Image
              src={m.thumbnail}
              alt=""
              fill
              sizes="120px"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <VideoCameraIcon className="h-8 w-8" />
            </div>
          )}
          <button
            type="button"
            onClick={() => onRemove(idx)}
            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
            aria-label="Quitar"
          >
            <XMarkIcon className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

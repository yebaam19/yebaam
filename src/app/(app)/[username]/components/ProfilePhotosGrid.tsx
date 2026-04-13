'use client';

import { PhotoIcon } from '@/components/icons/heroicons-shim';
import Link from 'next/link';

interface Photo {
  id: string;
  url: string;
  alt?: string;
}

interface ProfilePhotosGridProps {
  username: string;
  photos: Photo[];
  totalPhotos: number;
}

export default function ProfilePhotosGrid({
  username,
  photos,
  totalPhotos,
}: ProfilePhotosGridProps) {
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
          Fotos
        </h2>
        {totalPhotos > 9 && (
          <Link
            href={`/${username}/photos`}
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-500 dark:hover:text-primary-400 font-semibold transition-colors hover:underline"
          >
            Ver todas ({totalPhotos})
          </Link>
        )}
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2.5">
          {photos.slice(0, 9).map((photo) => (
            <Link
              key={photo.id}
              href={`/${username}/photos/${photo.id}`}
              className="aspect-square bg-neutral-200 dark:bg-neutral-800 rounded-2xl overflow-hidden group relative"
            >
              <img
                src={photo.url}
                alt={photo.alt || 'Photo'}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <PhotoIcon className="w-10 h-10 text-neutral-400 dark:text-neutral-600" />
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
            No hay fotos para mostrar
          </p>
        </div>
      )}
    </div>
  );
}

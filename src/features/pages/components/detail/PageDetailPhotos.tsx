import { FC } from 'react';
import { PhotoIcon } from '@/components/icons/heroicons-shim';
import Image from 'next/image';

interface PageDetailPhotosProps {
  pageId: string;
}

// Mock photos
const mockPhotos = [
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1481833761820-0509d3217039?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop',
];

export const PageDetailPhotos: FC<PageDetailPhotosProps> = ({ pageId }) => {
  // TODO: Fetch real photos from API
  
  if (mockPhotos.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
          <PhotoIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Sin fotos aún
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Esta página aún no ha compartido ninguna foto.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Fotos ({mockPhotos.length})
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {mockPhotos.map((photo, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 hover:opacity-90 transition-opacity cursor-pointer group"
          >
            <Image
              src={photo}
              alt={`Photo ${index + 1}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
};

'use client';

import { FolderIcon, PlusIcon } from '@/components/icons/heroicons-shim';
import { ProfileAlbum } from '@/features/profile/services/profile-media.service';
import Image from 'next/image';

interface AlbumsGridProps {
  albums: ProfileAlbum[];
  onCreateAlbum: () => void;
  onSelectAlbum: (albumId: string) => void;
}

export default function AlbumsGrid({ albums, onCreateAlbum, onSelectAlbum }: AlbumsGridProps) {
  return (
    <div>
      {albums.length === 0 ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <FolderIcon className="w-10 h-10 text-gray-400 dark:text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No tienes álbumes
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Crea tu primer álbum para organizar tus videos
          </p>
          <button
            onClick={onCreateAlbum}
            className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Crear álbum
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {albums.map((album) => (
            <button
              key={album.id}
              onClick={() => onSelectAlbum(album.id)}
              className="group relative aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 hover:shadow-xl transition-all duration-300 cursor-pointer"
            >
              {album.coverPhotoUrl ? (
                <Image
                  src={album.coverPhotoUrl}
                  alt={album.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  className="object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                  <FolderIcon className="w-16 h-16 text-purple-400 dark:text-purple-600" />
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent flex flex-col justify-end p-4">
                <h3 className="text-white font-semibold text-lg mb-1">
                  {album.name}
                </h3>
                <p className="text-white/80 text-sm">
                  {album.videosCount} {album.videosCount === 1 ? 'video' : 'videos'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

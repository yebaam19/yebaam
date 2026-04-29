import { FC, useState } from 'react';
import { PlusIcon, PhotoIcon, TrashIcon } from '@/components/icons/heroicons-shim';
import { usePagePhotos, useDeletePagePhoto } from '../../hooks/usePagePhotos';
import { PagePhoto } from '../../interfaces/page-photo.interface';
import { UploadPhotoModal } from './UploadPhotoModal';
import Image from 'next/image';

interface PageDetailPhotosProps {
  pageId: string;
  isOwner?: boolean;
}

export const PageDetailPhotos: FC<PageDetailPhotosProps> = ({
  pageId,
  isOwner = false,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<PagePhoto | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const { data, isLoading } = usePagePhotos(pageId);
  const photos: PagePhoto[] = data ?? [];
  const deletePhotoMutation = useDeletePagePhoto(pageId);

  const handlePhotoClick = (photo: PagePhoto) => {
    setSelectedPhoto(photo);
  };

  const handleDeletePhoto = async (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (confirm('¿Estás seguro de eliminar esta foto?')) {
      await deletePhotoMutation.mutateAsync(photoId);
    }
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          {isOwner && (
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // Empty State
  if (photos.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Fotos
          </h2>
          {isOwner && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Subir foto
            </button>
          )}
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <PhotoIcon className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {isOwner ? 'No has subido fotos aún' : 'No hay fotos'}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
            {isOwner
              ? 'Comparte momentos especiales de tu negocio. Sube fotos de tus productos, servicios o equipo.'
              : 'Esta página aún no ha compartido fotos.'}
          </p>
          {isOwner && (
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              <PlusIcon className="w-5 h-5" />
              Subir primera foto
            </button>
          )}
        </div>
      </div>
    );
  }

  // Photos Grid
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Fotos
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
          </p>
        </div>
        {isOwner && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Subir foto
          </button>
        )}
      </div>

      {/* Photos Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            onClick={() => handlePhotoClick(photo)}
            className="group relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
          >
            {/* Photo */}
            <Image
              src={photo.url}
              alt={photo.caption || 'Foto de página'}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-sm line-clamp-2">
                    {photo.caption}
                  </p>
                </div>
              )}

              {/* Delete Button (only for owner) */}
              {isOwner && (
                <button
                  onClick={(e) => handleDeletePhoto(photo.id, e)}
                  disabled={deletePhotoMutation.isPending}
                  className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  title="Eliminar foto"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Caption Badge */}
            {photo.caption && (
              <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/70 backdrop-blur-sm rounded px-2 py-1">
                  <p className="text-white text-xs line-clamp-1">
                    {photo.caption}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      <UploadPhotoModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        pageId={pageId}
      />

      {/* TODO: Add PhotoViewerModal */}
    </div>
  );
};

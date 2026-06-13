'use client';

import { VideoCameraIcon, FolderIcon, PlusIcon } from '@/components/icons/heroicons-shim';

interface VideosHeaderProps {
  videosCount: number;
  onCreateAlbum: () => void;
  onUploadVideo: () => void;
}

export default function VideosHeader({ videosCount, onCreateAlbum, onUploadVideo }: VideosHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
          <VideoCameraIcon className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Mis Videos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {videosCount} {videosCount === 1 ? 'video' : 'videos'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={onCreateAlbum}
          className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors"
        >
          <FolderIcon className="w-5 h-5 inline mr-2" />
          Nuevo álbum
        </button>
        <button
          onClick={onUploadVideo}
          className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-purple-500/30"
        >
          <PlusIcon className="w-5 h-5" />
          Subir videos
        </button>
      </div>
    </div>
  );
}

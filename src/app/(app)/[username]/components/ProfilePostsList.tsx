'use client';

import { PhotoIcon, PlusIcon } from '@/components/icons/heroicons-shim';

interface ProfilePostsListProps {
  username: string;
  displayName: string;
  isOwnProfile: boolean;
}

export default function ProfilePostsList({
  username,
  displayName,
  isOwnProfile,
}: ProfilePostsListProps) {
  // TODO: Integrar con el backend para obtener posts reales
  const posts: any[] = [];

  return (
    <div className="space-y-5">
      {/* Create Post Card - Solo si es tu perfil */}
      {isOwnProfile && (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <button className="flex-1 px-5 py-3.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-2xl text-left text-neutral-500 dark:text-neutral-400 font-medium transition-all hover:scale-[1.01]">
              ¿Qué estás pensando, {displayName.split(' ')[0]}?
            </button>
            <button className="p-3.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-2xl transition-all group">
              <PhotoIcon className="w-6 h-6 text-green-600 dark:text-green-500 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Posts List */}
      {posts.length > 0 ? (
        <div className="space-y-5">
          {/* Aquí irían los PostCard components */}
          {posts.map((post) => (
            <div key={post.id}>
              {/* PostCard component */}
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-16 text-center shadow-sm">
          <div className="max-w-md mx-auto">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-2xl" />
              <div className="relative w-24 h-24 bg-linear-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 rounded-full flex items-center justify-center">
                <PhotoIcon className="w-12 h-12 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">
              {isOwnProfile
                ? '¡Comparte tu primer momento!'
                : 'No hay publicaciones públicas'}
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed">
              {isOwnProfile
                ? 'Comparte fotos, videos y actualizaciones con tus amigos.'
                : `${displayName.split(' ')[0]} no ha compartido publicaciones públicas recientemente.`}
            </p>
            {isOwnProfile && (
              <button className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-semibold transition-all hover:scale-105 shadow-lg hover:shadow-xl">
                <PlusIcon className="w-5 h-5" />
                Crear publicación
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

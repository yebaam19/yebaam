'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon } from '@/components/icons/heroicons-shim';
import { useAuth } from '@/features/auth/context/auth-context';
import { useStoryStore } from '@/app/(app)/stories/store/story.store';
import { useStorySocket } from '@/app/(app)/stories/hooks/useStorySocket';
import Avatar from '@/ui/Avatar';

interface StoriesProps {
  className?: string;
}

export default function Stories({ className }: StoriesProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { friendsStories, myStories, fetchFriendsStories, fetchMyStories, isLoading } = useStoryStore();
  
  // Conectar WebSocket para recibir actualizaciones en tiempo real
  useStorySocket();

  // Cargar historias al montar el componente
  useEffect(() => {
    fetchFriendsStories();
    fetchMyStories();
  }, [fetchFriendsStories, fetchMyStories]);

  const hasMyStories = myStories.length > 0;

  const handleCreateStory = () => {
    router.push('/stories/create');
  };

  const handleViewStory = (userId: string) => {
    router.push(`/stories/view/${userId}`);
  };

  const handleViewMyStories = () => {
    router.push('/stories/view/my-stories');
  };

  if (isLoading && !hasMyStories && friendsStories.length === 0) {
    return (
      <div className={`bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-4 ${className || ''}`}>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {/* Loading skeletons */}
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-[120px] h-[200px] rounded-2xl bg-neutral-200 dark:bg-neutral-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-xl shadow-sm p-4 ${className || ''}`}>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {/* Mi Historia */}
        <div
          onClick={hasMyStories ? handleViewMyStories : handleCreateStory}
          className="shrink-0 w-[120px] h-[200px] rounded-2xl relative cursor-pointer hover:scale-105 transition-transform overflow-hidden group"
        >
          {hasMyStories ? (
            // Ver mis historias
            <div className="w-full h-full relative">
              {/* Preview de la última historia */}
              {myStories[0].type === 'image' && (
                <img
                  src={myStories[0].mediaUrl}
                  alt="Mi historia"
                  className="w-full h-full object-cover"
                />
              )}
              {myStories[0].type === 'video' && (
                <video
                  src={myStories[0].mediaUrl}
                  className="w-full h-full object-cover"
                  muted
                />
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-linear-to-b from-black/60 via-transparent to-black/60" />
              
              {/* Avatar y nombre */}
              <div className="absolute top-3 left-3">
                <div className="w-10 h-10 rounded-full ring-4 ring-primary-500">
                  <Avatar
                    initials={user?.username.substring(0, 2).toUpperCase() || 'TU'}
                    src={user?.avatar}
                    className="w-full h-full"
                  />
                </div>
              </div>
              
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-white text-sm font-semibold drop-shadow-lg">
                  Tu historia
                </p>
                <p className="text-white/80 text-xs">
                  {myStories.length} {myStories.length === 1 ? 'historia' : 'historias'}
                </p>
              </div>
            </div>
          ) : (
            // Crear historia
            <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800 flex flex-col">
              <div className="flex-1 bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                <Avatar
                  initials={user?.username.substring(0, 2).toUpperCase() || 'TU'}
                  src={user?.avatar}
                  className="w-16 h-16"
                />
              </div>
              <div className="p-3 flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center -mt-8 ring-4 ring-white dark:ring-neutral-900">
                  <PlusIcon className="w-6 h-6 text-white" />
                </div>
                <p className="text-xs font-semibold text-neutral-900 dark:text-white text-center">
                  Crear historia
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Historias de Amigos */}
        {friendsStories.map((userStories) => (
          <div
            key={userStories.userId}
            onClick={() => handleViewStory(userStories.userId)}
            className="shrink-0 w-[120px] h-[200px] rounded-2xl relative cursor-pointer hover:scale-105 transition-transform overflow-hidden group"
          >
            <div className="w-full h-full relative">
              {/* Preview de la última historia */}
              {userStories.stories[0].type === 'image' && (
                <img
                  src={userStories.stories[0].mediaUrl}
                  alt={userStories.username}
                  className="w-full h-full object-cover"
                />
              )}
              {userStories.stories[0].type === 'video' && (
                <video
                  src={userStories.stories[0].mediaUrl}
                  className="w-full h-full object-cover"
                  muted
                />
              )}
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-linear-to-b from-black/60 via-transparent to-black/60" />
              
              {/* Avatar con borde según si fue vista o no */}
              <div className="absolute top-3 left-3">
                <div className={`w-10 h-10 rounded-full ring-4 ${
                  userStories.unviewedCount > 0 
                    ? 'ring-primary-500' 
                    : 'ring-neutral-500'
                }`}>
                  <Avatar
                    initials={userStories.username.substring(0, 2).toUpperCase()}
                    src={userStories.avatarUrl}
                    className="w-full h-full"
                  />
                </div>
                
                {/* Badge de historias no vistas */}
                {userStories.unviewedCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-900">
                    <span className="text-[10px] font-bold text-white">
                      {userStories.unviewedCount}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-white text-sm font-semibold drop-shadow-lg truncate">
                  {userStories.username}
                </p>
                <p className="text-white/80 text-xs">
                  {userStories.stories.length} {userStories.stories.length === 1 ? 'historia' : 'historias'}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Mensaje cuando no hay historias */}
        {!isLoading && !hasMyStories && friendsStories.length === 0 && (
          <div className="shrink-0 w-full flex items-center justify-center py-8">
            <p className="text-neutral-500 text-sm">
              No hay historias disponibles. ¡Sé el primero en crear una!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

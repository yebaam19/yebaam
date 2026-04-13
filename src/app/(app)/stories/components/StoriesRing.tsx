'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStoryStore } from '../store';
import { useStorySocket } from '../hooks/useStorySocket';
import { PlusIcon } from '@/components/icons/heroicons-shim';
import { useAuth } from '@/features/auth/context/auth-context';
import Avatar from '@/ui/Avatar';
import { cn } from '@/lib/utils';

interface StoriesRingProps {
  className?: string;
}

export default function StoriesRing({ className }: StoriesRingProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { friendsStories, myStories, fetchFriendsStories, fetchMyStories, isLoading } = useStoryStore();
  
  // Conectar WebSocket
  useStorySocket();

  // Cargar historias al montar
  useEffect(() => {
    fetchFriendsStories();
    fetchMyStories();
  }, [fetchFriendsStories, fetchMyStories]);

  const hasMyStories = myStories.length > 0;
  const hasFriendsStories = friendsStories.length > 0;

  if (isLoading && !hasMyStories && !hasFriendsStories) {
    return (
      <div className={cn('flex gap-4 overflow-x-auto pb-4 scrollbar-hide', className)}>
        {/* Loading skeletons */}
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 shrink-0">
            <div className="w-16 h-16 rounded-full bg-neutral-800 animate-pulse" />
            <div className="w-14 h-3 rounded bg-neutral-800 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('flex gap-4 overflow-x-auto pb-4 scrollbar-hide', className)}>
      {/* Mi Historia (Crear o Ver) */}
      <button
        onClick={() => router.push(hasMyStories ? '/stories/view/my-stories' : '/stories/create')}
        className="flex flex-col items-center gap-2 shrink-0 group"
      >
        <div
          className={cn(
            'relative w-16 h-16 rounded-full p-0.5 transition-transform group-hover:scale-105',
            hasMyStories
              ? 'bg-linear-to-tr from-primary-600 to-primary-400'
              : 'bg-neutral-800'
          )}
        >
          <div className="w-full h-full rounded-full bg-neutral-950 p-0.5">
            <Avatar
              initials={user?.username.substring(0, 2).toUpperCase() || 'U'}
              src={user?.avatar}
              className="w-full h-full"
            />
          </div>
          
          {/* Botón + para crear */}
          {!hasMyStories && (
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center border-2 border-neutral-950">
              <PlusIcon className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        
        <span className="text-xs text-neutral-300 max-w-[60px] truncate">
          {hasMyStories ? 'Tu historia' : 'Crear'}
        </span>
      </button>

      {/* Historias de Amigos */}
      {friendsStories.map((userStories) => (
        <button
          key={userStories.userId}
          onClick={() => router.push(`/stories/view/${userStories.userId}`)}
          className="flex flex-col items-center gap-2 shrink-0 group"
        >
          <div
            className={cn(
              'relative w-16 h-16 rounded-full p-0.5 transition-transform group-hover:scale-105',
              userStories.unviewedCount > 0
                ? 'bg-linear-to-tr from-primary-600 to-primary-400'
                : 'bg-linear-to-tr from-neutral-700 to-neutral-600'
            )}
          >
            <div className="w-full h-full rounded-full bg-neutral-950 p-0.5">
              <Avatar
                initials={userStories.username.substring(0, 2).toUpperCase()}
                src={userStories.avatarUrl}
                className="w-full h-full"
              />
            </div>

            {/* Badge de historias no vistas */}
            {userStories.unviewedCount > 0 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 rounded-full flex items-center justify-center border-2 border-neutral-950">
                <span className="text-[10px] font-bold text-white">
                  {userStories.unviewedCount}
                </span>
              </div>
            )}
          </div>
          
          <span className="text-xs text-neutral-300 max-w-[60px] truncate">
            {userStories.username}
          </span>
        </button>
      ))}

      {/* Mensaje cuando no hay historias */}
      {!hasMyStories && !hasFriendsStories && !isLoading && (
        <div className="flex items-center justify-center py-8 text-neutral-500">
          <p className="text-sm">No hay historias disponibles</p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { 
  ChatBubbleLeftIcon,
  EllipsisHorizontalIcon,
  StarIcon,
  UserMinusIcon,
} from '@/components/icons/heroicons-shim';
import { StarIcon as StarIconSolid } from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';
import { cn } from '@/lib/utils';
import { Friend } from '@/features/user/services/friends.service';

interface FriendCardProps {
  friend: Friend;
  onToggleCloseFriend?: (friendId: string) => void;
  onRemove?: (friendshipId: string) => void; // Usa friendshipId, no friendId
  onChat?: (friendId: string) => void;
}

// Helper para formatear la ubicación
const formatLocation = (location?: string | { city?: string; country?: string }): string => {
  if (!location) return '';
  if (typeof location === 'string') return location;
  const parts = [location.city, location.country].filter(Boolean);
  return parts.join(', ');
};

export function FriendCard({ friend, onToggleCloseFriend, onRemove, onChat }: FriendCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isCloseFriend, setIsCloseFriend] = useState(friend.closeFriend);

  const handleToggleCloseFriend = () => {
    setIsCloseFriend(!isCloseFriend);
    onToggleCloseFriend?.(friend.friendId);
  };

  const handleRemove = () => {
    if (!friend.friendshipId) {
      console.error('No friendshipId available for friend:', friend);
      alert('No se puede eliminar este amigo. Recarga la página e intenta de nuevo.');
      return;
    }
    
    if (confirm(`¿Eliminar a ${friend.firstName} ${friend.lastName} de tus amigos?`)) {
      onRemove?.(friend.friendshipId);
    }
  };

  const friendSinceDate = new Date(friend.friendSince).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="@container bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 sm:p-4 lg:p-5 hover:shadow-lg transition-shadow min-w-0">
      <div className="flex items-start gap-3 sm:gap-4 min-w-0">
        {/* Avatar */}
        <div className="relative shrink-0">
          <Avatar
            src={friend.avatar}
            initials={
              friend.firstName && friend.lastName
                ? `${friend.firstName[0]}${friend.lastName[0]}`
                : (friend.username?.[0]?.toUpperCase() || friend.friendId?.slice(0, 2)?.toUpperCase() || '?')
            }
            className="size-12 sm:size-14 lg:size-16"
          />
          {isCloseFriend && (
            <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-pink-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-900">
              <StarIconSolid className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 min-w-0">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
                {friend.firstName && friend.lastName
                  ? `${friend.firstName} ${friend.lastName}`
                  : friend.username || `Usuario ${friend.friendId.slice(0, 8)}`
                }
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                @{friend.username || friend.friendId.slice(0, 8)}
              </p>
            </div>

            {/* Menu Button */}
            <div className="relative shrink-0 -mr-1 -mt-1">
              <button
                onClick={() => setShowMenu(!showMenu)}
                aria-label="Más opciones"
                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <EllipsisHorizontalIcon className="w-5 h-5 text-neutral-500" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-8 z-20 w-48 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 py-2">
                    <button
                      onClick={handleToggleCloseFriend}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-3"
                    >
                      <StarIcon className="w-5 h-5" />
                      {isCloseFriend ? 'Quitar de cercanos' : 'Marcar como cercano'}
                    </button>
                    <button
                      onClick={handleRemove}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 flex items-center gap-3"
                    >
                      <UserMinusIcon className="w-5 h-5" />
                      Eliminar amigo
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Meta Info */}
          <div className="mt-2 space-y-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            {friend.location && (
              <div className="truncate">{formatLocation(friend.location)}</div>
            )}
            <div className="truncate">👥 Amigos desde {friendSinceDate}</div>
          </div>

          {friend.mutualFriends && friend.mutualFriends > 0 && (
            <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              {friend.mutualFriends} {friend.mutualFriends === 1 ? 'amigo' : 'amigos'} en común
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-col @[18rem]:flex-row gap-2 min-w-0">
        <button
          onClick={() => onChat?.(friend.friendId)}
          className="flex-1 min-w-0 w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap"
        >
          <ChatBubbleLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          Mensaje
        </button>
        <button
          onClick={() => window.location.href = `/${friend.username}`}
          className="w-full @[18rem]:w-auto @[18rem]:shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap"
        >
          Ver perfil
        </button>
      </div>
    </div>
  );
}

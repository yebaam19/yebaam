'use client';

import { useState } from 'react';
import { 
  ChatBubbleLeftIcon,
  EllipsisHorizontalIcon,
  StarIcon,
  UserMinusIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
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

  // Debug: Ver qué datos tiene el amigo
  console.log('[FriendCard] Friend data:', {
    friendId: friend.friendId,
    friendshipId: friend.friendshipId,
    name: `${friend.firstName} ${friend.lastName}`
  });

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
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          <Avatar
            src={friend.avatar}
            initials={
              friend.firstName && friend.lastName 
                ? `${friend.firstName[0]}${friend.lastName[0]}` 
                : (friend.username?.[0]?.toUpperCase() || friend.friendId?.slice(0, 2)?.toUpperCase() || '?')
            }
            className="w-16 h-16"
          />
          {isCloseFriend && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-900">
              <StarIconSolid className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
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
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
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
          <div className="mt-2 flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
            {friend.location && (
              <span>{formatLocation(friend.location)}</span>
            )}
            <span>👥 Amigos desde {friendSinceDate}</span>
          </div>

          {friend.mutualFriends && friend.mutualFriends > 0 && (
            <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              {friend.mutualFriends} {friend.mutualFriends === 1 ? 'amigo' : 'amigos'} en común
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => onChat?.(friend.friendId)}
          className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <ChatBubbleLeftIcon className="w-5 h-5" />
          Mensaje
        </button>
        <button
          onClick={() => window.location.href = `/${friend.username}`}
          className="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-semibold rounded-lg transition-colors"
        >
          Ver perfil
        </button>
      </div>
    </div>
  );
}

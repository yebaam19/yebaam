'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  CheckIcon,
  XMarkIcon,
  ClockIcon,
} from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';
import { FriendRequest } from '@/features/user/services/friend-request.service';

interface FriendRequestCardProps {
  request: FriendRequest;
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
}

export function FriendRequestCard({ request, onAccept, onReject }: FriendRequestCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Obtener el perfil correcto (usa 'profile' o fallback a 'senderProfile')
  const profile = request.profile || request.senderProfile;
  
  if (!profile) return null;

  const handleAccept = async () => {
    setIsProcessing(true);
    await onAccept?.(request.requestId);
    setIsProcessing(false);
  };

  const handleReject = async () => {
    setIsProcessing(true);
    await onReject?.(request.requestId);
    setIsProcessing(false);
  };

  const timeAgo = getTimeAgo(new Date(request.sentAt));

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        {/* Avatar con badge de notificación */}
        <Link href={`/${profile.username}`} className="relative shrink-0">
          <Avatar
            src={profile.avatar}
            initials={`${profile.firstName[0]}${profile.lastName[0]}`}
            className="w-16 h-16"
          />
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-neutral-900">
            <span className="text-white text-xs font-bold">!</span>
          </div>
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <Link 
            href={`/${profile.username}`}
            className="hover:underline"
          >
            <h3 className="font-semibold text-neutral-900 dark:text-white truncate">
              {profile.firstName} {profile.lastName}
            </h3>
          </Link>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
            @{profile.username}
          </p>

          {request.message && (
            <div className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
              <p className="text-sm text-neutral-700 dark:text-neutral-300 italic">
                "{request.message}"
              </p>
            </div>
          )}

          {/* Time indicator */}
          <div className="mt-2 flex items-center gap-1 text-xs text-neutral-400">
            <ClockIcon className="w-4 h-4" />
            {timeAgo}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={handleAccept}
          disabled={isProcessing}
          className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
        >
          <CheckIcon className="w-5 h-5" />
          Aceptar
        </button>
        <button
          onClick={handleReject}
          disabled={isProcessing}
          className="flex-1 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:bg-neutral-200 text-neutral-700 dark:text-neutral-300 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
        >
          <XMarkIcon className="w-5 h-5" />
          Rechazar
        </button>
      </div>
    </div>
  );
}

// Helper function to calculate time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Hace un momento';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  if (days < 7) {
    return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
  }
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  }
  const months = Math.floor(days / 30);
  return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;
}

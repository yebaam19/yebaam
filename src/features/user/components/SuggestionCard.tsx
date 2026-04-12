'use client';

import { useState } from 'react';
import { 
  UserPlusIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import Avatar from '@/ui/Avatar';
import { FriendSuggestion } from '@/features/user/services/friend-request.service';

interface SuggestionCardProps {
  suggestion: FriendSuggestion;
  onSendRequest?: (userId: string) => void;
  onDismiss?: (userId: string) => void;
}

// Helper para formatear la ubicación
const formatLocation = (location?: string | { city?: string; country?: string }): string => {
  if (!location) return '';
  if (typeof location === 'string') return location;
  const parts = [location.city, location.country].filter(Boolean);
  return parts.join(', ');
};

export function SuggestionCard({ suggestion, onSendRequest, onDismiss }: SuggestionCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleSendRequest = async () => {
    setIsProcessing(true);
    await onSendRequest?.(suggestion.id);
    setIsProcessing(false);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.(suggestion.id);
  };

  if (isDismissed) return null;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 hover:shadow-lg transition-shadow">
      <div className="flex flex-col items-center text-center">
        {/* Avatar */}
        <Avatar
          src={suggestion.avatar}
          initials={`${suggestion.firstName[0]}${suggestion.lastName[0]}`}
          className="w-20 h-20 mb-4"
        />

        {/* Name & Username */}
        <h3 className="font-semibold text-neutral-900 dark:text-white">
          {suggestion.firstName} {suggestion.lastName}
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
          @{suggestion.username}
        </p>

        {/* Mutual Friends Badge */}
        {suggestion.mutualFriends > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 rounded-full text-xs font-medium mb-3">
            <UsersIcon className="w-4 h-4" />
            {suggestion.mutualFriends} {suggestion.mutualFriends === 1 ? 'amigo' : 'amigos'} en común
          </div>
        )}

        {/* Reason for suggestion */}
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          {suggestion.reason}
        </p>

        {suggestion.location && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-4">
             {formatLocation(suggestion.location)}
          </p>
        )}

        {/* Actions */}
        <div className="w-full flex flex-col gap-2">
          <button
            onClick={handleSendRequest}
            disabled={isProcessing}
            className="w-full px-4 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          >
            <UserPlusIcon className="w-5 h-5" />
            {isProcessing ? 'Enviando...' : 'Agregar amigo'}
          </button>
          <button
            onClick={handleDismiss}
            className="w-full px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
          >
            Descartar
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { 
  UserPlusIcon,
  UsersIcon,
} from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';
import { getUserInitials } from '@/lib/user-helpers';
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
    try {
      // The store rethrows on rate-limit / already-pending; the parent surfaces the
      // toast, so swallow here so the button never sticks on "Enviando...".
      await onSendRequest?.(suggestion.id);
    } catch {
      // handled upstream
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.(suggestion.id);
  };

  if (isDismissed) return null;

  return (
    <div className="@container min-w-0 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 sm:p-5 hover:shadow-lg transition-shadow">
      <div className="flex h-full min-w-0 flex-col items-center text-center">
        {/* Avatar */}
        <Avatar
          src={suggestion.avatar}
          initials={getUserInitials(`${suggestion.firstName ?? ''} ${suggestion.lastName ?? ''}`.trim() || suggestion.username)}
          className="w-16 h-16 @[12rem]:w-20 @[12rem]:h-20 mb-4 shrink-0"
        />

        {/* Name & Username */}
        <h3 className="w-full truncate font-semibold text-neutral-900 dark:text-white">
          {suggestion.firstName} {suggestion.lastName}
        </h3>
        <p className="w-full truncate text-sm text-neutral-500 dark:text-neutral-400 mb-3">
          @{suggestion.username}
        </p>

        {/* Mutual Friends Badge */}
        {suggestion.mutualFriends > 0 && (
          <div className="inline-flex max-w-full items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 rounded-full text-xs font-medium mb-3">
            <UsersIcon className="w-4 h-4 shrink-0" />
            {suggestion.mutualFriends} {suggestion.mutualFriends === 1 ? 'amigo' : 'amigos'} en común
          </div>
        )}

        {/* Reason for suggestion */}
        <p className="w-full break-words text-xs text-neutral-500 dark:text-neutral-400 mb-4">
          {suggestion.reason}
        </p>

        {suggestion.location && (
          <p className="w-full truncate text-xs text-neutral-400 dark:text-neutral-500 mb-4">
             {formatLocation(suggestion.location)}
          </p>
        )}

        {/* Actions */}
        <div className="mt-auto w-full min-w-0 flex flex-col gap-2">
          <button
            onClick={handleSendRequest}
            disabled={isProcessing}
            className="w-full px-3 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          >
            <UserPlusIcon className="hidden @[10rem]:block w-5 h-5 shrink-0" />
            {isProcessing ? 'Enviando...' : 'Agregar amigo'}
          </button>
          <button
            onClick={handleDismiss}
            className="w-full px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-colors"
          >
            Descartar
          </button>
        </div>
      </div>
    </div>
  );
}

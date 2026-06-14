'use client';

import { useTranslations } from 'next-intl';
import { SuggestionCard } from '@/features/user/components/SuggestionCard';
import { FriendSuggestionsCompact } from '@/features/user/components/FriendSuggestionCard';
import type { useFriendships } from '@/features/friendships';

type FriendshipsApi = ReturnType<typeof useFriendships>;
type SuggestionItem = NonNullable<FriendshipsApi['suggestions']>[number];

interface SuggestionsTabViewProps {
  isLoading: boolean;
  suggestions: SuggestionItem[];
  onSendRequest: (userId: string) => void;
  onDismiss: (id: string) => void;
}

export function SuggestionsTabView({
  isLoading,
  suggestions,
  onSendRequest,
  onDismiss,
}: SuggestionsTabViewProps) {
  const t = useTranslations('feed');

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-800"
          />
        ))}
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-neutral-500 dark:text-neutral-400">{t('friends.empty.suggestions')}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onSendRequest={onSendRequest}
            onDismiss={onDismiss}
          />
        ))}
      </div>
      <div className="mt-8 border-t border-neutral-200 pt-8 dark:border-neutral-700">
        <h3 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-white">
          {t('friends.quickSuggestions')}
        </h3>
        <FriendSuggestionsCompact limit={6} />
      </div>
    </div>
  );
}

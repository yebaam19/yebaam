'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserPlusIcon } from '@/components/icons/heroicons-shim';
import Avatar from '@/ui/Avatar';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

interface FriendSuggestion {
  id: string;
  name: string;
  avatar: string;
  mutualFriends: number;
  username: string;
}

interface FriendSuggestionsProps {
  suggestions: FriendSuggestion[];
  onSendRequest: (userId: string) => Promise<void>;
}

export default function FriendSuggestions({ suggestions, onSendRequest }: FriendSuggestionsProps) {
  const t = useTranslations('nav');
  const [sendingRequestTo, setSendingRequestTo] = useState<Set<string>>(new Set());

  const handleSendFriendRequest = async (userId: string) => {
    try {
      setSendingRequestTo(prev => new Set(prev).add(userId));
      await onSendRequest(userId);
      toast.success(t('friendRequestSent'));
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast.error(t('friendRequestError'));
    } finally {
      setSendingRequestTo(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
          {t('friendSuggestions')}
        </h3>
        <Link
          href="/feed/friends?tab=suggestions"
          className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          {t('viewAllSuggestions')}
        </Link>
      </div>
      <div className="space-y-3">
        {suggestions.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
            {t('noSuggestionsAvailable')}
          </p>
        ) : (
          suggestions.map((friend) => (
            <div key={friend.id} className="flex items-center gap-3">
              <Link href={`/${friend.username}`} className="shrink-0">
                <Avatar
                  className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity"
                  src={friend.avatar}
                  initials={friend.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/${friend.username}`}
                  className="block"
                >
                  <p className="truncate text-sm font-medium text-neutral-900 dark:text-white hover:underline cursor-pointer">
                    {friend.name}
                  </p>
                </Link>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {t('mutualFriends', { n: friend.mutualFriends })}
                </p>
              </div>
              <button
                onClick={() => handleSendFriendRequest(friend.id)}
                disabled={sendingRequestTo.has(friend.id)}
                className="shrink-0 rounded-lg bg-primary-600 p-1.5 hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('addFriend')}
              >
                <UserPlusIcon className="h-4 w-4 text-white" />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { displayNameFor, type SearchResult } from './UserRow';

interface DirectSendBarProps {
  user: SearchResult;
  pending: boolean;
  onSend: () => void;
}

export default function DirectSendBar({ user, pending, onSend }: DirectSendBarProps) {
  const t = useTranslations('chat.newMessage');

  return (
    <div className="border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
      <button
        type="button"
        onClick={onSend}
        disabled={pending}
        className="w-full rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
      >
        {pending ? t('opening') : t('sendMessageTo', { name: displayNameFor(user, t('userFallback')) })}
      </button>
    </div>
  );
}

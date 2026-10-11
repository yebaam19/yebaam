'use client';

import { useTranslations } from 'next-intl';
import type { ChatMessage } from '@/features/chat/types';
import { retryMessage } from '@/features/chat/store/outgoing-messages.store';

export function MessageDelivery({ message }: { message: ChatMessage }) {
  const t = useTranslations('chat.message.delivery');
  if (message.status !== 'sending' && message.status !== 'failed') return null;
  return (
    <div role="status" className="mt-1 text-right text-xs text-neutral-600 dark:text-neutral-300">
      {message.status === 'sending' ? t('sending') : (
        <><span>{t('failed')} </span><button type="button" onClick={() => retryMessage(message.id)}
          className="rounded px-1 py-1 font-semibold underline focus-visible:outline-2 focus-visible:outline-offset-2">
          {t('retry')}
        </button></>
      )}
    </div>
  );
}

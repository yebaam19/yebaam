'use client';

import { ChatBubbleLeftRightIcon } from '@/components/icons/heroicons-shim';
import { useTranslations } from 'next-intl';

interface MessageSectionProps {
  message?: string;
}

export function MessageSection({ message }: MessageSectionProps) {
  const t = useTranslations('friendships.detailModal');

  if (!message) return null;

  return (
    <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
      <div className="flex items-start gap-2 mb-2">
        <ChatBubbleLeftRightIcon className="w-4 h-4 text-primary-600 dark:text-primary-400 mt-0.5 shrink-0" />
        <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
          {t('messageLabel')}
        </p>
      </div>
      <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
        &quot;{message}&quot;
      </p>
    </div>
  );
}

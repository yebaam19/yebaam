'use client';

import { ChatBubbleLeftIcon } from '@/components/icons/heroicons-shim';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { Route } from 'next';
import { useTranslations } from 'next-intl';

interface MessageButtonProps {
  userId: string;
  className?: string;
}

/** Secondary Mensaje control (filled gray), aligned con PageDetailHeader. */
export default function MessageButton({ userId, className }: MessageButtonProps) {
  const t = useTranslations('profile.actions');
  return (
    <Link
      href={`/chat/${userId}` as Route}
      className={cn(
        'inline-flex shrink-0 items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600',
        className,
      )}
    >
      <ChatBubbleLeftIcon className="h-4 w-4 shrink-0" />
      {t('message')}
    </Link>
  );
}

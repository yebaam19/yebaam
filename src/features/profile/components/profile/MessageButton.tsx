'use client';

import { ChatBubbleLeftIcon } from '@/components/icons/heroicons-shim';
import Link from 'next/link';
import type { Route } from 'next';

interface MessageButtonProps {
  userId: string;
}

export default function MessageButton({ userId }: MessageButtonProps) {
  return (
    <Link
      href={`/messages/${userId}` as Route}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
    >
      <ChatBubbleLeftIcon className="h-4 w-4" />
      Mensaje
    </Link>
  );
}

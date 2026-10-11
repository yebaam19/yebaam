'use client';
import { useTranslations } from 'next-intl';

export default function FeedLoadFeedback({ message, onRetry, pending }: {
  message: string;
  onRetry: () => Promise<void>;
  pending: boolean;
}) {
  const t = useTranslations('feed.timeline');
  return (
    <div role="status" className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
      <p>{message}</p>
      <button type="button" onClick={() => void onRetry()} disabled={pending}
        className="mt-2 rounded-lg px-3 py-2 font-semibold text-primary-800 hover:bg-primary-50 disabled:opacity-60 dark:text-primary-200 dark:hover:bg-neutral-800">
        {pending ? t('retrying') : t('retry')}
      </button>
    </div>
  );
}

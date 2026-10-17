'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { shareCommunityArticleToFeed } from '@/features/communities/actions/communityArticles.actions';
import { UserGroupIcon } from '@/components/icons/heroicons-shim';
import { CommunityLinkShareButton } from './CommunityLinkShareButton';

interface CommunityArticleShareButtonProps {
  articleId: string;
  articleTitle: string;
  /** Canonical article path — origin is added at click time. */
  articlePath: string;
  communitySlug: string;
  /**
   * Only the article author can share into the community feed. Other viewers
   * still see the external sharing options.
   */
  isAuthor: boolean;
}

export function CommunityArticleShareButton({
  articleId,
  articleTitle,
  articlePath,
  communitySlug,
  isAuthor,
}: CommunityArticleShareButtonProps) {
  const router = useRouter();
  const t = useTranslations('communities');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const [isPending, startTransition] = useTransition();
  const shareRequestId = useRef<string | null>(null);

  const handleShareToCommunity = () => {
    setError(null);
    shareRequestId.current ??= crypto.randomUUID();
    startTransition(async () => {
      const result = await shareCommunityArticleToFeed(articleId, message, shareRequestId.current!);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setShared(true);
      router.refresh();
      setTimeout(() => {
        setDialogOpen(false);
        setShared(false);
        setMessage('');
        router.push(`/comunidades/${communitySlug}`);
      }, 900);
    });
  };

  return (
    <>
      <CommunityLinkShareButton path={articlePath} title={articleTitle} />
      {isAuthor && <button type="button" onClick={() => {
        setError(null);
        setShared(false);
        setDialogOpen(true);
      }} className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium text-primary-800 hover:bg-secondary-100 focus-visible:outline-2 dark:text-primary-300 dark:hover:bg-primary-900">
        <UserGroupIcon className="size-4" aria-hidden="true" />
        {t('admin.article.share.shareToCommunity')}
      </button>}

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-neutral-900">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              {t('admin.article.share.dialogTitle')}
            </h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
              {t('admin.article.share.dialogDescription', { title: articleTitle })}
            </p>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
              placeholder={t('admin.article.share.messagePlaceholder')}
              rows={3}
              disabled={isPending || shared}
              className="mt-3 w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus-visible:outline-2 focus-visible:outline-primary-800 dark:border-neutral-600 dark:bg-neutral-900 dark:text-white"
            />

            {error && (
              <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </p>
            )}
            {shared && (
              <p className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">
                {t('admin.article.share.successToast')}
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDialogOpen(false);
                  setError(null);
                  setShared(false);
                  setMessage('');
                }}
                disabled={isPending}
                className="min-h-11 rounded-lg px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100 focus-visible:outline-2 dark:text-neutral-200 dark:hover:bg-neutral-800 disabled:opacity-50"
              >
                {t('admin.article.share.cancel')}
              </button>
              <button
                type="button"
                onClick={handleShareToCommunity}
                disabled={isPending || shared}
                className="min-h-11 rounded-lg bg-primary-800 px-4 text-sm font-medium text-white hover:bg-primary-900 focus-visible:outline-2 disabled:opacity-50"
              >
                {isPending
                  ? t('admin.article.share.submitting')
                  : shared
                    ? t('admin.article.share.submitted')
                    : t('admin.article.share.submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { shareCommunityArticleToFeed } from '@/features/communities/actions/communityArticles.actions';
import {
  LinkIcon,
  ShareIcon,
  UserGroupIcon,
} from '@/components/icons/heroicons-shim';

interface CommunityArticleShareButtonProps {
  articleId: string;
  articleTitle: string;
  /** Path beginning with `/feed/...` — origin is added at click time. */
  articlePath: string;
  communitySlug: string;
  /**
   * Only the article author can share into the community feed. Other viewers
   * still see the button so they can copy the link externally.
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [menuOpen]);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(t);
  }, [copied]);

  const handleCopyLink = async () => {
    const url =
      typeof window !== 'undefined' ? `${window.location.origin}${articlePath}` : articlePath;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: articleTitle, url });
        return;
      } catch {
        /* fall through to clipboard */
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      try {
        document.execCommand('copy');
        setCopied(true);
      } finally {
        document.body.removeChild(input);
      }
    }
  };

  const handleShareToCommunity = () => {
    setError(null);
    startTransition(async () => {
      const result = await shareCommunityArticleToFeed(articleId, message);
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
        router.push(`/feed/comunidades/${communitySlug}`);
      }, 900);
    });
  };

  return (
    <>
      <div ref={wrapperRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/60"
        >
          {copied ? (
            <>
              <LinkIcon className="h-4 w-4" />
              {t('admin.article.share.copied')}
            </>
          ) : (
            <>
              <ShareIcon className="h-4 w-4" />
              {t('admin.article.share.share')}
            </>
          )}
        </button>

        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
          >
            {isAuthor && (
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setError(null);
                  setShared(false);
                  setDialogOpen(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/60"
              >
                <UserGroupIcon className="h-4 w-4" />
                {t('admin.article.share.shareToCommunity')}
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                void handleCopyLink();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/60"
            >
              <LinkIcon className="h-4 w-4" />
              {t('admin.article.share.copyLink')}
            </button>
          </div>
        )}
      </div>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {t('admin.article.share.dialogTitle')}
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {t('admin.article.share.dialogDescription', { title: articleTitle })}
            </p>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
              placeholder={t('admin.article.share.messagePlaceholder')}
              rows={3}
              disabled={isPending || shared}
              className="mt-3 w-full resize-none rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
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
                className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/60 disabled:opacity-50"
              >
                {t('admin.article.share.cancel')}
              </button>
              <button
                type="button"
                onClick={handleShareToCommunity}
                disabled={isPending || shared}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
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

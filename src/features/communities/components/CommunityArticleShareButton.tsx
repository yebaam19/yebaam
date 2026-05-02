'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { shareCommunityArticleToFeed } from '@/features/communities/actions/communityArticles.actions';
import { ShareIcon } from '@/components/icons/heroicons-shim';

interface CommunityArticleShareButtonProps {
  articleId: string;
  articleTitle: string;
  /**
   * Community slug used only to redirect the viewer to the community feed
   * after a successful share, so they can confirm the post landed.
   */
  communitySlug: string;
}

export function CommunityArticleShareButton({
  articleId,
  articleTitle,
  communitySlug,
}: CommunityArticleShareButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleShare = () => {
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
        setOpen(false);
        setShared(false);
        setMessage('');
        router.push(`/feed/comunidades/${communitySlug}`);
      }, 900);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setShared(false);
          setOpen(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/60"
      >
        <ShareIcon className="h-4 w-4" />
        Compartir
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl dark:bg-gray-800">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Compartir con la comunidad
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Se publicará un post en el feed de la comunidad enlazando a “{articleTitle}”.
            </p>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
              placeholder="Escribe un mensaje opcional para los miembros..."
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
                Compartido en la comunidad.
              </p>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setError(null);
                  setShared(false);
                  setMessage('');
                }}
                disabled={isPending}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700/60 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleShare}
                disabled={isPending || shared}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? 'Compartiendo...' : shared ? 'Compartido' : 'Compartir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

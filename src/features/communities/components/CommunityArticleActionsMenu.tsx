'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { Dialog, DialogPanel, DialogTitle, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useTranslations } from 'next-intl';
import { EllipsisHorizontalIcon, PencilSquareIcon, TrashIcon } from '@/components/icons/heroicons-shim';
import { deleteCommunityArticle } from '../actions/communityArticles.actions';

export function CommunityArticleActionsMenu({ articleId, communitySlug, articleSlug, articleTitle }: {
  articleId: string; communitySlug: string; articleSlug: string; articleTitle: string;
}) {
  const router = useRouter();
  const t = useTranslations('communities');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function archive() {
    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteCommunityArticle(articleId);
        if (!result.ok) { setError(result.error); return; }
        router.replace(`/feed/comunidades/${communitySlug}/articulos` as Route);
        router.refresh();
      } catch {
        setError('No se pudo eliminar el artículo. Inténtalo de nuevo.');
      }
    });
  }

  return <>
    <Menu as="div" className="relative">
      <MenuButton aria-label={t('admin.article.actionsAria')}
        className="flex size-11 items-center justify-center rounded-lg text-neutral-700 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-primary-800 dark:text-neutral-200 dark:hover:bg-neutral-800">
        <EllipsisHorizontalIcon className="size-5" aria-hidden="true" />
      </MenuButton>
      <MenuItems className="absolute right-0 z-20 mt-1 w-44 rounded-lg bg-white p-1 shadow-lg outline-none dark:bg-neutral-800">
        <MenuItem>
          <button type="button" onClick={() => router.push(`/feed/comunidades/${communitySlug}/articulos/${articleSlug}/editar` as Route)}
            className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-neutral-900 data-focus:bg-secondary-100 dark:text-white dark:data-focus:bg-primary-900">
            <PencilSquareIcon className="size-4" aria-hidden="true" /> {t('admin.article.edit')}
          </button>
        </MenuItem>
        <MenuItem>
          <button type="button" onClick={() => setConfirmOpen(true)}
            className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left text-sm text-red-700 data-focus:bg-red-50 dark:text-red-300 dark:data-focus:bg-red-950">
            <TrashIcon className="size-4" aria-hidden="true" /> {t('admin.article.delete')}
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
    <Dialog open={confirmOpen} onClose={() => { if (!pending) setConfirmOpen(false); }} className="relative z-[60]">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm space-y-4 rounded-xl bg-white p-5 text-neutral-900 shadow-xl dark:bg-neutral-900 dark:text-white">
          <DialogTitle className="text-lg font-semibold">{t('admin.article.deleteTitle')}</DialogTitle>
          <p className="text-sm text-neutral-600 dark:text-neutral-300">{t('admin.article.deleteConfirm', { title: articleTitle })}</p>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" disabled={pending} onClick={() => { setConfirmOpen(false); setError(null); }}
              className="min-h-11 rounded-lg border border-neutral-300 px-4 text-sm font-medium hover:bg-neutral-50 focus-visible:outline-2 dark:border-neutral-600 dark:hover:bg-neutral-800">
              {t('admin.article.cancel')}
            </button>
            <button type="button" disabled={pending} onClick={archive}
              className="min-h-11 rounded-lg bg-red-700 px-4 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline-2 disabled:opacity-50">
              {pending ? t('admin.article.deleting') : t('admin.article.delete')}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  </>;
}

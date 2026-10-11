'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Dialog, DialogPanel, DialogTitle, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { deleteCommunity } from '@/features/communities/actions/update.actions';
import {
  EllipsisHorizontalIcon,
  TrashIcon,
} from '@/components/icons/heroicons-shim';

interface CommunityOwnerMenuProps {
  communityId: string;
  communityName: string;
}

export function CommunityOwnerMenu({ communityId, communityName }: CommunityOwnerMenuProps) {
  const router = useRouter();
  const t = useTranslations('communities');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteCommunity(communityId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push('/feed/comunidades');
      router.refresh();
    });
  };

  return <>
    <Menu as="div" className="relative">
      <MenuButton
        aria-label={t('admin.owner.manageAria')}
        title={t('admin.owner.manageAria')}
        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-primary-700 bg-primary-800 px-3 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-800 sm:px-4"
      >
        <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden="true" />
        <span className="hidden sm:inline">{t('admin.owner.manage')}</span>
      </MenuButton>
      <MenuItems className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-md border border-neutral-200 bg-white p-1 shadow-lg outline-none dark:border-neutral-700 dark:bg-neutral-800">
        <MenuItem>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-700 data-focus:bg-red-50 dark:text-red-300 dark:data-focus:bg-red-950"
          >
            <TrashIcon className="h-4 w-4" aria-hidden="true" />
            {t('admin.owner.deleteCommunity')}
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
    <Dialog open={confirmOpen} onClose={() => { if (!isPending) { setConfirmOpen(false); setError(null); } }} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel className="max-h-[calc(100dvh-2rem)] w-full max-w-sm overflow-y-auto rounded-xl bg-white p-5 text-neutral-900 shadow-xl dark:bg-neutral-800 dark:text-white">
          <DialogTitle className="text-base font-semibold">{t('admin.owner.deleteTitle')}</DialogTitle>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{t('admin.owner.deleteConfirm', { name: communityName })}</p>
          {error && <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <button type="button" disabled={isPending} onClick={() => { setConfirmOpen(false); setError(null); }}
              className="min-h-11 rounded-lg border border-neutral-300 px-4 text-sm font-medium hover:bg-neutral-50 focus-visible:outline-2 dark:border-neutral-600 dark:hover:bg-neutral-700 disabled:opacity-50">
              {t('admin.owner.cancel')}
            </button>
            <button type="button" disabled={isPending} onClick={handleDelete}
              className="min-h-11 rounded-lg bg-red-700 px-4 text-sm font-medium text-white hover:bg-red-800 focus-visible:outline-2 disabled:opacity-50">
              {isPending ? t('admin.owner.deleting') : t('admin.owner.delete')}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  </>;
}

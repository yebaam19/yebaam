'use client';

import { FC, useState, Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, Transition } from '@headlessui/react';
import { Page } from '../../types/page.types';
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  TrashIcon,
  XMarkIcon,
} from '@/components/icons/heroicons-shim';

interface SettingsDangerZoneProps {
  page: Page;
}

export const SettingsDangerZone: FC<SettingsDangerZoneProps> = ({ page }) => {
  const t = useTranslations('pages');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeletePage = async () => {
    if (confirmationText !== page.name) {
      return;
    }

    setIsDeleting(true);
    // TODO: Implement delete page mutation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsDeleting(false);
    // Redirect to pages list
    window.location.href = '/feed/paginas';
  };

  const isOwner = page.userRole === 'OWNER';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">
          {t('settings.dangerZone.title')}
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('settings.dangerZone.subtitle')}
        </p>
      </div>

      {/* Warning Alert */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
              {t('settings.dangerZone.warningTitle')}
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-400">
              {t('settings.dangerZone.warningDescription')}
            </p>
          </div>
        </div>
      </div>

      {/* Transfer Ownership (Only for owners) */}
      {isOwner && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-2 border-orange-200 dark:border-orange-800">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <ArrowPathIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  {t('settings.dangerZone.transfer.title')}
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {t('settings.dangerZone.transfer.description')}
                </p>
                <ul className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>
                      {t('settings.dangerZone.transfer.bullets.control')}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>
                      {t('settings.dangerZone.transfer.bullets.role')}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>{t('settings.dangerZone.transfer.bullets.irreversible')}</span>
                  </li>
                </ul>
              </div>
            </div>
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 border border-orange-300 dark:border-orange-700 rounded-lg transition-colors"
            >
              {t('settings.dangerZone.transfer.button')}
            </button>
          </div>
        </div>
      )}

      {/* Delete Page */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border-2 border-red-200 dark:border-red-800">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrashIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-base font-medium text-gray-900 dark:text-white">
                {t('settings.dangerZone.delete.title')}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {t('settings.dangerZone.delete.description')}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>
                    {t('settings.dangerZone.delete.bullets.posts')}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>{t('settings.dangerZone.delete.bullets.followers')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>{t('settings.dangerZone.delete.bullets.username')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>{t('settings.dangerZone.delete.bullets.recovery')}</span>
                </li>
              </ul>
            </div>
          </div>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            disabled={!isOwner}
            className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('settings.dangerZone.delete.button')}
          </button>
        </div>
        {!isOwner && (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 italic">
            {t('settings.dangerZone.delete.ownerOnly')}
          </p>
        )}
      </div>

      {/* Transfer Modal */}
      <Transition appear show={isTransferModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsTransferModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 dark:bg-black/50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('settings.dangerZone.transfer.modalTitle')}
                    </Dialog.Title>
                    <button
                      onClick={() => setIsTransferModalOpen(false)}
                      className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {t('settings.dangerZone.transfer.modalDescription')}
                  </p>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setIsTransferModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {t('settings.dangerZone.delete.cancel')}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Modal */}
      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsDeleteModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25 dark:bg-black/50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl transition-all">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t('settings.dangerZone.delete.modalTitle')}
                      </Dialog.Title>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {t('settings.dangerZone.delete.modalDescription')}
                      </p>
                    </div>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-800 dark:text-red-300 font-medium">
                      {t('settings.dangerZone.delete.willDelete')}
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-red-700 dark:text-red-400">
                      <li>• {t('settings.dangerZone.delete.willDeleteItems.posts')}</li>
                      <li>• {t('settings.dangerZone.delete.willDeleteItems.followers', { count: page.followerCount || 0 })}</li>
                      <li>• {t('settings.dangerZone.delete.willDeleteItems.media')}</li>
                      <li>• {t('settings.dangerZone.delete.willDeleteItems.history')}</li>
                    </ul>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t.rich('settings.dangerZone.delete.confirmLabel', {
                        name: page.name,
                        strong: (chunks) => <strong>{chunks}</strong>,
                      })}
                    </label>
                    <input
                      type="text"
                      value={confirmationText}
                      onChange={(e) => setConfirmationText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                      placeholder={page.name}
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setIsDeleteModalOpen(false);
                        setConfirmationText('');
                      }}
                      disabled={isDeleting}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {t('settings.dangerZone.delete.cancel')}
                    </button>
                    <button
                      onClick={handleDeletePage}
                      disabled={confirmationText !== page.name || isDeleting}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                    >
                      {isDeleting ? t('settings.dangerZone.delete.deleting') : t('settings.dangerZone.delete.confirmButton')}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

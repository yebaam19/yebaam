'use client';

import { useState, Fragment } from 'react';
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react';
import { useTranslations } from 'next-intl';

interface Props {
  open: boolean;
  busy: boolean;
  userName: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

/** Review drawer for rejecting a request: preset reasons + a free-text field.
 *  Owns only the local draft `reason`; the parent owns `busy` and the actual
 *  server-action call invoked through `onConfirm`. */
export function RejectionDialog({ open, busy, userName, onClose, onConfirm }: Props) {
  const t = useTranslations('admin.verifications');
  const [reason, setReason] = useState('');
  const trimmed = reason.trim();

  const REJECTION_PRESETS = [t('preset1'), t('preset2'), t('preset3'), t('preset4')];

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-150"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-100"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-neutral-800">
              <div className="border-b border-neutral-100 px-6 py-4 dark:border-neutral-700">
                <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {t('rejectDialogTitle', { name: userName })}
                </h3>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {t('rejectDialogDescription')}
                </p>
              </div>

              <div className="space-y-4 px-6 py-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
                    {t('commonReasons')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {REJECTION_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setReason(preset)}
                        className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-neutral-700 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-red-900/20"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="rejection-reason"
                    className="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400"
                  >
                    {t('rejectionReasonLabel')}
                  </label>
                  <textarea
                    id="rejection-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    maxLength={500}
                    placeholder={t('rejectionPlaceholder')}
                    className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100"
                  />
                  <div className="mt-1 flex justify-between text-[11px] text-neutral-500">
                    <span>{t('rejectionHint')}</span>
                    <span>{reason.length}/500</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-neutral-100 bg-neutral-50 px-6 py-3 dark:border-neutral-700 dark:bg-neutral-800/60">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={busy}
                  className="rounded-md bg-white px-4 py-2 text-sm font-medium text-neutral-700 ring-1 ring-neutral-300 hover:bg-neutral-100 disabled:opacity-50 dark:bg-neutral-700 dark:text-neutral-200 dark:ring-neutral-600"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => trimmed && onConfirm(trimmed)}
                  disabled={busy || trimmed.length < 4}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-neutral-400"
                >
                  {busy ? t('rejecting') : t('confirmReject')}
                </button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

'use client'

import { ClipboardDocumentIcon } from '@/components/icons/heroicons-shim';
import { useTranslations } from 'next-intl';

export function ProfessionalProfileUrlField({ profileUrl, onCopy }: { profileUrl: string; onCopy: () => void }) {
  const t = useTranslations('professional.dialogs.editProfile')
  return (
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      {t('urlLabel')}
                    </label>
                    <div className="mt-1 flex gap-2">
                      <input
                        type="text"
                        value={profileUrl}
                        readOnly
                        className="flex-1 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-600 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                      />
                      <button
                        type="button"
                        onClick={onCopy}
                        className="inline-flex items-center rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
                        title={t('copyUrlTitle')}
                      >
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      {t('urlHint')}
                    </p>
                  </div>

  )
}

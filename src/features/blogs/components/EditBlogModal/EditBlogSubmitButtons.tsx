'use client'

import { useTranslations } from 'next-intl';

export function EditBlogSubmitButtons({ onClose, isSaving, isDeleting, uploadingImages, hasRequiredFields }: { onClose: () => void; isSaving: boolean; isDeleting: boolean; uploadingImages: boolean; hasRequiredFields: boolean }) {
  const t = useTranslations('blogs.editModal')
  const tActions = useTranslations('blogs.actions')
  return (
                  <div className="flex gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-700">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSaving || uploadingImages || isDeleting}
                      className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                      {tActions('cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={
                        isSaving || uploadingImages || isDeleting || !hasRequiredFields
                      }
                      className="flex-1 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploadingImages
                        ? t('uploadingButton')
                        : isSaving
                          ? t('saving')
                          : t('save')}
                    </button>
                  </div>

  )
}

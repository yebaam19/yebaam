'use client'

import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@/components/icons/heroicons-shim'
import { Fragment } from 'react'
import { useTranslations } from 'next-intl'
import { useCreateBlogForm } from '../hooks/useCreateBlogForm'
import { BlogFormFields } from './BlogFormFields'
import { BlogImageUploader } from './BlogImageUploader'

interface CreateBlogModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CreateBlogModal = ({ isOpen, onClose }: CreateBlogModalProps) => {
  const t = useTranslations('blogs')
  const {
    formData,
    handleFieldsChange,
    uploadingImages,
    isPending,
    coverFile,
    coverPreview,
    handleCoverChange,
    handleCoverRemove,
    handleSubmit,
    handleClose,
  } = useCreateBlogForm(onClose)

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all dark:bg-neutral-800">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
                  <div>
                    <Dialog.Title as="h3" className="text-xl font-semibold text-neutral-900 dark:text-white">
                      {t('create.title')}
                    </Dialog.Title>
                    <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                      {t('create.subtitle')}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isPending}
                    className="rounded-full p-2 transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-700"
                  >
                    <XMarkIcon className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
                  {/* Form Fields */}
                  <BlogFormFields
                    formData={formData}
                    onChange={handleFieldsChange}
                    disabled={isPending || uploadingImages}
                  />

                  {/* Imágenes */}
                  <div className="grid grid-cols-2 gap-4">
                    <BlogImageUploader
                      label={t('create.coverLabel')}
                      preview={coverPreview}
                      file={coverFile}
                      onFileChange={handleCoverChange}
                      onRemove={handleCoverRemove}
                      disabled={isPending || uploadingImages}
                      type="cover"
                    />
                  </div>

                  {uploadingImages && (
                    <div className="text-center text-sm text-primary-600 dark:text-primary-400">
                      ⏳ {t('create.uploadingHint')}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isPending}
                      className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                      {t('actions.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={isPending || uploadingImages || !formData.name || !formData.description}
                      className="flex-1 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploadingImages
                        ? t('create.uploading')
                        : isPending
                          ? t('create.submitting')
                          : t('create.submit')}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

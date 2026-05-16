'use client'

/**
 * UploadPhotoDialog
 * 
 * Modal para subir fotos al perfil con soporte para álbumes
 */

import { useState, Fragment } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogPanel, Transition, TransitionChild } from '@headlessui/react'
import ButtonPrimary from '@/ui/ButtonPrimary'
import ButtonSecondary from '@/ui/ButtonSecondary'
import Textarea from '@/ui/Textarea'
import { PhotoIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import { useProfileMediaStore } from '../../store/profile-media.store'
import Image from 'next/image'
import Select from '@/ui/Select'

interface UploadPhotoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function UploadPhotoDialog({ open, onOpenChange }: UploadPhotoDialogProps) {
  const t = useTranslations('profile.dialogs.uploadPhoto')
  const { albums, uploadPhoto, isUploading } = useProfileMediaStore()
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [caption, setCaption] = useState('')
  const [albumId, setAlbumId] = useState<string>('')
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'only_me'>('public')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    // Filtrar solo imágenes
    const imageFiles = files.filter((file) => file.type.startsWith('image/'))
    
    if (imageFiles.length === 0) return

    setSelectedFiles(imageFiles)

    // Crear previews
    const newPreviewUrls = imageFiles.map((file) => URL.createObjectURL(file))
    setPreviewUrls((prev) => {
      // Limpiar URLs anteriores
      prev.forEach((url) => URL.revokeObjectURL(url))
      return newPreviewUrls
    })
  }

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviewUrls((prev) => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return
    setErrorMsg(null)

    try {
      for (const file of selectedFiles) {
        await uploadPhoto(file, {
          caption: caption || undefined,
          albumId: albumId || undefined,
          visibility,
        })
      }
      handleClose()
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('errorFallback')
      setErrorMsg(msg)
    }
  }

  const handleClose = () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url))
    setSelectedFiles([])
    setPreviewUrls([])
    setCaption('')
    setAlbumId('')
    setVisibility('public')
    setErrorMsg(null)
    onOpenChange(false)
  }

  return (
    <Transition show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 p-6 shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-white">
                    {t('title')}
                  </h3>
                  <button
                    onClick={handleClose}
                    className="rounded-full p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    aria-label={t('close')}
                  >
                    <XMarkIcon className="h-5 w-5 text-neutral-500" />
                  </button>
                </div>

                {/* Body */}
                <div className="space-y-5">
                  {/* File Input */}
                  {selectedFiles.length === 0 ? (
                    <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl p-12 hover:border-primary-500 dark:hover:border-primary-500 transition-colors">
                      <label
                        htmlFor="photo-upload"
                        className="flex flex-col items-center justify-center cursor-pointer"
                      >
                        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                          <PhotoIcon className="w-8 h-8 text-neutral-400 dark:text-neutral-600" />
                        </div>
                        <p className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                          {t('dropzoneTitle')}
                        </p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                          {t('dropzoneSubtitle')}
                        </p>
                        <input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileSelect}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                  ) : (
                    <>
                      {/* Preview Grid */}
                      <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                        {previewUrls.map((url, index) => (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                            <Image
                              src={url}
                              alt={`Preview ${index + 1}`}
                              fill
                              sizes="(max-width: 640px) 33vw, 200px"
                              className="object-cover"
                            />
                            <button
                              onClick={() => removeFile(index)}
                              disabled={isUploading}
                              className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <XMarkIcon className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Caption */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          {t('captionLabel')}
                        </label>
                        <Textarea
                          placeholder={t('captionPlaceholder')}
                          value={caption}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCaption(e.target.value)}
                          rows={3}
                          disabled={isUploading}
                        />
                      </div>

                      {/* Album Selection */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          {t('albumLabel')}
                        </label>
                        <select
                          value={albumId}
                          onChange={(e) => setAlbumId(e.target.value)}
                          disabled={isUploading}
                          className="block w-full rounded-xl border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-primary-500 dark:text-white"
                        >
                          <option value="">{t('albumNone')}</option>
                          {albums.map((album) => (
                            <option key={album.id} value={album.id}>
                              {t('albumOption', { name: album.name, count: album.photosCount })}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Privacy */}
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                          {t('privacyLabel')}
                        </label>
                        <select
                          value={visibility}
                          onChange={(e) => setVisibility(e.target.value as 'public' | 'friends' | 'only_me')}
                          disabled={isUploading}
                          className="block w-full rounded-xl border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-primary-500 dark:text-white"
                        >
                          <option value="public">{t('privacyPublic')}</option>
                          <option value="friends">{t('privacyFriends')}</option>
                          <option value="only_me">{t('privacyOnlyMe')}</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                {selectedFiles.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
                    {errorMsg && (
                      <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                        {errorMsg}
                      </p>
                    )}
                    <div className="flex gap-3">
                      <ButtonSecondary
                        onClick={handleClose}
                        disabled={isUploading}
                        className="flex-1"
                      >
                        {t('cancel')}
                      </ButtonSecondary>
                      <ButtonPrimary
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="flex-1"
                      >
                        {isUploading ? t('uploading') : t('uploadCount', { count: selectedFiles.length })}
                      </ButtonPrimary>
                    </div>
                  </div>
                )}
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}


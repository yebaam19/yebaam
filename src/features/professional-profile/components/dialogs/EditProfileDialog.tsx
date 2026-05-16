/**
 * EditProfileDialog
 */

'use client'

import { Button } from '@/ui/Button'
import Select from '@/ui/Select'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { ArrowPathIcon, ClipboardDocumentIcon } from '@/components/icons/heroicons-shim'
import { useEffect, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type {
  ProfessionalProfile,
  ProfessionalProfileVisibility,
} from '../../interfaces/professional-profile.interfaces'
import { ImageUpload } from './ImageUpload'

interface EditProfileDialogProps {
  isOpen: boolean
  profile: ProfessionalProfile
  onClose: () => void
  onSubmit: (data: EditProfileFormData) => Promise<void>
}

export interface EditProfileFormData {
  bio?: string
  avatarUrl?: string
  coverUrl?: string
  visibility: ProfessionalProfileVisibility
}

export function EditProfileDialog({ isOpen, profile, onClose, onSubmit }: EditProfileDialogProps) {
  const t = useTranslations('professional.dialogs.editProfile')
  const visibilityOptions = useMemo(
    () => [
      { value: 'PUBLIC', label: t('visibilityPublic') },
      { value: 'LIMITED', label: t('visibilityLimited') },
      { value: 'PRIVATE', label: t('visibilityPrivate') },
    ],
    [t]
  )
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<EditProfileFormData>({
    defaultValues: {
      bio: '',
      avatarUrl: '',
      coverUrl: '',
      visibility: 'PUBLIC',
    },
  })

  // Watch para preview de imágenes
  const avatarUrl = watch('avatarUrl')
  const coverUrl = watch('coverUrl')

  // Generar URL del perfil
  const profileUrl =
    typeof window !== 'undefined' && profile.user
      ? `${window.location.origin}/feed/professional-profile/${profile.user.username}`
      : ''

  // Handler para copiar URL
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl)
      toast.success(t('copySuccess'))
    } catch (error) {
      toast.error(t('copyError'))
    }
  }

  useEffect(() => {
    if (isOpen) {
      reset({
        bio: profile.bio ?? '',
        avatarUrl: profile.avatarUrl ?? '',
        coverUrl: profile.coverUrl ?? '',
        visibility: profile.visibility ?? 'PUBLIC',
      })
    }
  }, [isOpen, profile, reset])

  const submit = async (data: EditProfileFormData) => {
    const cleanData: EditProfileFormData = {
      visibility: data.visibility,
    }

    // Solo incluir bio si hay contenido
    if (data.bio?.trim()) {
      cleanData.bio = data.bio.trim()
    }

    // Solo incluir avatarUrl si hay contenido
    if (data.avatarUrl?.trim()) {
      cleanData.avatarUrl = data.avatarUrl.trim()
    }

    // Solo incluir coverUrl si hay contenido
    if (data.coverUrl?.trim()) {
      cleanData.coverUrl = data.coverUrl.trim()
    }

    await onSubmit(cleanData)
  }

  return (
    <Transition show={isOpen}>
      <Dialog onClose={onClose} className="relative z-50">
        <TransitionChild
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-neutral-900">
              <div className="shrink-0 border-b border-neutral-200 p-6 dark:border-neutral-700">
                <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {t('title')}
                </DialogTitle>
              </div>

              <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit(submit)}>
                <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
                  {/* URL del Perfil - Solo lectura */}
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
                        onClick={handleCopyUrl}
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

                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      {t('bioLabel')}
                    </label>
                    <Controller
                      control={control}
                      name="bio"
                      rules={{ maxLength: { value: 500, message: t('bioMaxLength') } }}
                      render={({ field, fieldState }) => (
                        <>
                          <textarea
                            {...field}
                            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none dark:border-neutral-600 dark:bg-neutral-800 dark:text-white"
                            rows={4}
                            placeholder={t('bioPlaceholder')}
                            maxLength={500}
                          />
                          <div className="mt-1 flex justify-between">
                            <div>
                              {fieldState.error && <p className="text-xs text-red-500">{fieldState.error.message}</p>}
                            </div>
                            <p className="text-xs text-neutral-500">{field.value?.length || 0}/500</p>
                          </div>
                        </>
                      )}
                    />
                  </div>

                  {/* Avatar Upload */}
                  <ImageUpload
                    currentImageUrl={avatarUrl}
                    onImageChange={(url) => setValue('avatarUrl', url)}
                    label={t('avatarLabel')}
                    imageType="avatar"
                    maxSizeMB={5}
                  />

                  {/* Cover Upload */}
                  <ImageUpload
                    currentImageUrl={coverUrl}
                    onImageChange={(url) => setValue('coverUrl', url)}
                    label={t('coverLabel')}
                    imageType="cover"
                    maxSizeMB={10}
                  />

                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{t('visibilityLabel')}</label>
                    <Controller
                      control={control}
                      name="visibility"
                      render={({ field }) => (
                        <Select {...field} className="mt-1 rounded-lg">
                          {visibilityOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      )}
                    />
                  </div>
                </div>

                <div className="shrink-0 border-t border-neutral-200 p-6 dark:border-neutral-700">
                  <div className="flex justify-end gap-3">
                    <Button type="button" onClick={onClose} disabled={isSubmitting} outline>
                      {t('cancel')}
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                      {t('submit')}
                    </Button>
                  </div>
                </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}

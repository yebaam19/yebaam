/**
 * StudyDialog
 */

'use client'

import { Button } from '@/ui/Button'
import Input from '@/ui/Input'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { ArrowPathIcon } from '@/components/icons/heroicons-shim'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Controller, useForm } from 'react-hook-form'
import type { Study, StudyFormData } from '../../interfaces/professional-profile.interfaces'
import { STUDY_TYPE_OPTIONS, studyTypeLabel } from '../../lib/credentials'

interface StudyDialogProps {
  isOpen: boolean
  study: Study | null
  onClose: () => void
  onSubmit: (data: StudyFormData) => Promise<void>
}

export function StudyDialog({ isOpen, study, onClose, onSubmit }: StudyDialogProps) {
  const t = useTranslations('professional.dialogs.study')
  const tc = useTranslations('professional.dialogs.common')
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<StudyFormData>({
    defaultValues: {
      name: '',
      institution: '',
      year: new Date().getFullYear(),
      studyType: null,
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (study) {
        reset({
          name: study.name ?? '',
          institution: study.institution ?? '',
          year: study.year ?? new Date().getFullYear(),
          studyType: study.studyType ?? null,
        })
      } else {
        reset({
          name: '',
          institution: '',
          year: new Date().getFullYear(),
          studyType: null,
        })
      }
    }
  }, [isOpen, study, reset])

  const submit = async (data: StudyFormData) => {
    const cleanData: StudyFormData = {
      name: data.name.trim(),
      institution: data.institution && data.institution.trim() ? data.institution.trim() : undefined,
      year: data.year ? Number(data.year) : undefined,
      studyType: data.studyType ?? null,
    }
    await onSubmit(cleanData)
  }

  const isApproved = study?.credentialStatus === 'approved'

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
            <DialogPanel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
              <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-white">
                {study ? t('titleEdit') : t('titleCreate')}
              </DialogTitle>

              {isApproved && (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-200">
                  {tc('editReviewNotice')}
                </div>
              )}

              <form className="mt-4 space-y-4" onSubmit={handleSubmit(submit)}>
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      {t('studyTypeLabel')}
                    </label>
                    <Controller
                      control={control}
                      name="studyType"
                      render={({ field }) => (
                        <select
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value || null)}
                          className="mt-1 h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                        >
                          <option value="">{t('studyTypeSelect')}</option>
                          {STUDY_TYPE_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {studyTypeLabel(s)}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      {t('nameLabel')}
                    </label>
                    <Controller
                      control={control}
                      name="name"
                      rules={{ required: tc('requiredField') }}
                      render={({ field, fieldState }) => (
                        <>
                          <Input
                            {...field}
                            className="mt-1"
                            sizeClass="h-10 px-3 py-2"
                            rounded="rounded-lg"
                            placeholder={t('namePlaceholder')}
                          />
                          {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                        </>
                      )}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      {t('institutionLabel')}
                    </label>
                    <Controller
                      control={control}
                      name="institution"
                      render={({ field }) => (
                        <Input
                          {...field}
                          className="mt-1"
                          sizeClass="h-10 px-3 py-2"
                          rounded="rounded-lg"
                          placeholder={t('institutionPlaceholder')}
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{t('yearLabel')}</label>
                    <Controller
                      control={control}
                      name="year"
                      rules={{
                        min: { value: 1900, message: tc('yearMin') },
                        max: { value: new Date().getFullYear() + 10, message: tc('yearMax') },
                      }}
                      render={({ field, fieldState }) => (
                        <>
                          <Input
                            type="number"
                            {...field}
                            className="mt-1"
                            sizeClass="h-10 px-3 py-2"
                            rounded="rounded-lg"
                            placeholder={t('yearPlaceholder')}
                          />
                          {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                        </>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" onClick={onClose} disabled={isSubmitting} outline>
                    {tc('cancel')}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                    {study ? t('submitEdit') : t('submitCreate')}
                  </Button>
                </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}

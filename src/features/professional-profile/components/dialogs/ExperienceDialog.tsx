/**
 * ExperienceDialog
 */

'use client'

import { Button } from '@/ui/Button'
import Input from '@/ui/Input'
import Textarea from '@/ui/Textarea'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { ArrowPathIcon } from '@/components/icons/heroicons-shim'
import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Controller, useForm } from 'react-hook-form'
import type { Experience, ExperienceFormData } from '../../interfaces/professional-profile.interfaces'

interface ExperienceDialogProps {
  isOpen: boolean
  experience: Experience | null
  onClose: () => void
  onSubmit: (data: ExperienceFormData) => Promise<void>
}

export function ExperienceDialog({ isOpen, experience, onClose, onSubmit }: ExperienceDialogProps) {
  const t = useTranslations('professional.dialogs.experience')
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ExperienceFormData>({
    defaultValues: {
      position: '',
      company: '',
      startDate: '',
      endDate: '',
      description: '',
    },
  })

  useEffect(() => {
    if (experience) {
      const formatDateForInput = (date: string | Date | null | undefined): string => {
        if (!date) return ''
        const d = typeof date === 'string' ? new Date(date) : date
        return d.toISOString().split('T')[0]
      }
      reset({
        position: experience.position,
        company: experience.company ?? '',
        startDate: formatDateForInput(experience.startDate),
        endDate: formatDateForInput(experience.endDate),
        description: experience.description ?? '',
      })
    } else {
      reset({ position: '', company: '', startDate: '', endDate: '', description: '' })
    }
  }, [experience, reset])

  const submit = async (data: ExperienceFormData) => {
    await onSubmit({ ...data, endDate: data.endDate || undefined })
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
            <DialogPanel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
              <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-white">
                {experience ? t('titleEdit') : t('titleCreate')}
              </DialogTitle>

              <form className="mt-4 space-y-4" onSubmit={handleSubmit(submit)}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{t('positionLabel')}</label>
                    <Controller
                      control={control}
                      name="position"
                      rules={{ required: t('requiredField') }}
                      render={({ field, fieldState }) => (
                        <>
                          <Input
                            {...field}
                            className="mt-1"
                            sizeClass="h-10 px-3 py-2"
                            rounded="rounded-lg"
                            placeholder={t('positionPlaceholder')}
                          />
                          {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                        </>
                      )}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{t('companyLabel')}</label>
                    <Controller
                      control={control}
                      name="company"
                      rules={{ required: t('requiredField') }}
                      render={({ field, fieldState }) => (
                        <>
                          <Input
                            {...field}
                            className="mt-1"
                            sizeClass="h-10 px-3 py-2"
                            rounded="rounded-lg"
                            placeholder={t('companyPlaceholder')}
                          />
                          {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                        </>
                      )}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{t('startDateLabel')}</label>
                    <Controller
                      control={control}
                      name="startDate"
                      rules={{ required: t('requiredField') }}
                      render={({ field, fieldState }) => (
                        <>
                          <Input
                            type="date"
                            {...field}
                            className="mt-1"
                            sizeClass="h-10 px-3 py-2"
                            rounded="rounded-lg"
                          />
                          {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                        </>
                      )}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      {t('endDateLabel')}
                    </label>
                    <Controller
                      control={control}
                      name="endDate"
                      render={({ field }) => (
                        <Input
                          type="date"
                          {...field}
                          className="mt-1"
                          sizeClass="h-10 px-3 py-2"
                          rounded="rounded-lg"
                        />
                      )}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    {t('descriptionLabel')}
                  </label>
                  <Controller
                    control={control}
                    name="description"
                    render={({ field }) => (
                      <Textarea
                        {...field}
                        rows={3}
                        className="mt-1 rounded-lg"
                        placeholder={t('descriptionPlaceholder')}
                      />
                    )}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" onClick={onClose} disabled={isSubmitting} outline>
                    {t('cancel')}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                    {t('submit')}
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

/**
 * SkillDialog
 */

'use client'

import { Button } from '@/ui/Button'
import Input from '@/ui/Input'
import Select from '@/ui/Select'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { ArrowPathIcon } from '@/components/icons/heroicons-shim'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import type { Skill, SkillFormData } from '../../interfaces/professional-profile.interfaces'

interface SkillDialogProps {
  isOpen: boolean
  skill: Skill | null
  onClose: () => void
  onSubmit: (data: SkillFormData) => Promise<void>
}

// Backend values; labels come from i18n
const levelValues = ['beginner', 'intermediate', 'advanced', 'expert'] as const

export function SkillDialog({ isOpen, skill, onClose, onSubmit }: SkillDialogProps) {
  const t = useTranslations('professional.dialogs.skill')
  const tCommon = useTranslations('professional.dialogs.common')
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<SkillFormData>({
    defaultValues: { name: '', level: 'intermediate' },
  })

  useEffect(() => {
    if (isOpen) {
      if (skill) {
        reset({ name: skill.name, level: skill.level ?? 'intermediate' })
      } else {
        reset({ name: '', level: 'intermediate' })
      }
    }
  }, [isOpen, skill, reset])

  const submit = async (data: SkillFormData) => {
    await onSubmit(data)
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
            <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
              <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-white">
                {skill ? t('titleEdit') : t('titleCreate')}
              </DialogTitle>

              <form className="mt-4 space-y-4" onSubmit={handleSubmit(submit)}>
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{t('nameLabel')}</label>
                  <Controller
                    control={control}
                    name="name"
                    rules={{ required: tCommon('requiredField') }}
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
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{t('levelLabel')}</label>
                  <Controller
                    control={control}
                    name="level"
                    render={({ field }) => (
                      <Select {...field} className="mt-1 rounded-lg">
                        <option value="">{t('levelSelect')}</option>
                        {levelValues.map((value) => (
                          <option key={value} value={value}>
                            {t(`levelOptions.${value}`)}
                          </option>
                        ))}
                      </Select>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" onClick={onClose} disabled={isSubmitting} outline>
                    {tCommon('cancel')}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                    {tCommon('save')}
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

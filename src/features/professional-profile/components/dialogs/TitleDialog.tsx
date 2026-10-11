/**
 * TitleDialog
 */

'use client'

import { Button } from '@/ui/Button'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { ArrowPathIcon } from '@/components/icons/heroicons-shim'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useForm } from 'react-hook-form'
import type { Title, TitleFormData } from '../../interfaces/professional-profile.interfaces'
import { TitleCredentialFields } from './TitleCredentialFields'

interface TitleDialogProps {
  isOpen: boolean
  title: Title | null
  existingFocuses?: string[]
  onClose: () => void
  onSubmit: (data: TitleFormData) => Promise<void>
}

function TitleDialogForm({ isOpen, title, existingFocuses = [], onClose, onSubmit }: TitleDialogProps) {
  const t = useTranslations('professional.dialogs.title')
  const tc = useTranslations('professional.dialogs.common')
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<TitleFormData>({
    defaultValues: {
      name: title?.name ?? '',
      institution: title?.institution ?? '',
      year: title?.year ?? new Date().getFullYear(),
      category: title?.category ?? null,
      distinction: title?.distinction ?? null,
      focuses: title?.focuses ?? [],
    },
  })

  const [focuses, setFocuses] = useState<string[]>(title?.focuses ?? [])
  const [focusDraft, setFocusDraft] = useState('')

  const addFocus = (raw: string) => {
    const v = raw.trim()
    if (!v) return
    if (focuses.includes(v)) return
    if (focuses.length >= 12) return
    setFocuses([...focuses, v])
    setFocusDraft('')
  }

  const removeFocus = (v: string) => {
    setFocuses(focuses.filter((f) => f !== v))
  }

  const submit = async (data: TitleFormData) => {
    const cleanData: TitleFormData = {
      name: data.name.trim(),
      institution: data.institution && data.institution.trim() ? data.institution.trim() : undefined,
      year: data.year ? Number(data.year) : undefined,
      category: data.category ?? null,
      distinction: data.distinction ?? null,
      focuses,
    }
    await onSubmit(cleanData)
  }

  const isApproved = title?.credentialStatus === 'approved'
  const focusSuggestions = existingFocuses.filter(
    (f) => !focuses.includes(f) && f.toLowerCase().includes(focusDraft.trim().toLowerCase()),
  ).slice(0, 6)

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
                {title ? t('titleEdit') : t('titleCreate')}
              </DialogTitle>

              {isApproved && (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-200">
                  {tc('editReviewNotice')}
                </div>
              )}

              <form className="mt-4 space-y-4" onSubmit={handleSubmit(submit)}>
                <TitleCredentialFields control={control} />

                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    {t('focusesLabel')} <span className="text-xs text-neutral-500">{t('focusesMax')}</span>
                  </label>
                  <div className="mt-1 flex flex-wrap items-center gap-1 rounded-lg border border-neutral-300 bg-white px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-800">
                    {focuses.map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-800 dark:bg-primary-900/40 dark:text-primary-200"
                      >
                        {f}
                        <button
                          type="button"
                          onClick={() => removeFocus(f)}
                          className="text-primary-700 hover:text-primary-900 dark:text-primary-300"
                          aria-label={t('focusRemove', { focus: f })}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={focusDraft}
                      onChange={(e) => setFocusDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault()
                          addFocus(focusDraft)
                        }
                      }}
                      onBlur={() => addFocus(focusDraft)}
                      placeholder={focuses.length >= 12 ? t('focusesMaxReached') : t('focusesPlaceholder')}
                      disabled={focuses.length >= 12}
                      className="flex-1 min-w-[8ch] border-none bg-transparent text-sm focus:outline-none disabled:opacity-50 dark:text-neutral-100"
                    />
                  </div>
                  {focusSuggestions.length > 0 && focusDraft.trim() && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {focusSuggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => addFocus(s)}
                          className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300"
                        >
                          + {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" onClick={onClose} disabled={isSubmitting} outline>
                    {tc('cancel')}
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

export function TitleDialog(props: TitleDialogProps) {
  return props.isOpen ? <TitleDialogForm key={props.title?.id ?? 'new'} {...props} /> : null
}

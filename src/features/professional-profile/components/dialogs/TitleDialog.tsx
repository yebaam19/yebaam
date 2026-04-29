/**
 * TitleDialog
 */

'use client'

import { Button } from '@/ui/Button'
import Input from '@/ui/Input'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { ArrowPathIcon } from '@/components/icons/heroicons-shim'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { Title, TitleFormData } from '../../interfaces/professional-profile.interfaces'
import {
  CATEGORY_OPTIONS,
  DISTINCTION_OPTIONS,
  categoryLabel,
  distinctionLabel,
} from '../../lib/credentials'

interface TitleDialogProps {
  isOpen: boolean
  title: Title | null
  existingFocuses?: string[]
  onClose: () => void
  onSubmit: (data: TitleFormData) => Promise<void>
}

export function TitleDialog({ isOpen, title, existingFocuses = [], onClose, onSubmit }: TitleDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<TitleFormData>({
    defaultValues: {
      name: '',
      institution: '',
      year: new Date().getFullYear(),
      category: null,
      distinction: null,
      focuses: [],
    },
  })

  const [focuses, setFocuses] = useState<string[]>([])
  const [focusDraft, setFocusDraft] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (title) {
        reset({
          name: title.name,
          institution: title.institution ?? '',
          year: title.year ?? new Date().getFullYear(),
          category: title.category ?? null,
          distinction: title.distinction ?? null,
          focuses: title.focuses ?? [],
        })
        setFocuses(title.focuses ?? [])
      } else {
        reset({
          name: '',
          institution: '',
          year: new Date().getFullYear(),
          category: null,
          distinction: null,
          focuses: [],
        })
        setFocuses([])
      }
      setFocusDraft('')
    }
  }, [isOpen, title, reset])

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
                {title ? 'Editar Titulo' : 'Agregar Titulo'}
              </DialogTitle>

              {isApproved && (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-200">
                  Editar abrirá una nueva revisión administrativa y pausará la verificación hasta que un admin decida.
                </div>
              )}

              <form className="mt-4 space-y-4" onSubmit={handleSubmit(submit)}>
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    Categoría
                  </label>
                  <Controller
                    control={control}
                    name="category"
                    render={({ field }) => (
                      <select
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        className="mt-1 h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                      >
                        <option value="">— Selecciona —</option>
                        {CATEGORY_OPTIONS.map((c) => (
                          <option key={c} value={c}>
                            {categoryLabel(c)}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    Nombre del titulo
                  </label>
                  <Controller
                    control={control}
                    name="name"
                    rules={{ required: 'Campo requerido' }}
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          {...field}
                          className="mt-1"
                          sizeClass="h-10 px-3 py-2"
                          rounded="rounded-lg"
                          placeholder="Ej. Antropología"
                        />
                        {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                      </>
                    )}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    Distinción <span className="text-xs text-neutral-500">(opcional)</span>
                  </label>
                  <Controller
                    control={control}
                    name="distinction"
                    render={({ field }) => (
                      <select
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value || null)}
                        className="mt-1 h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
                      >
                        <option value="">— Sin distinción —</option>
                        {DISTINCTION_OPTIONS.map((d) => (
                          <option key={d} value={d}>
                            {distinctionLabel(d)}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Institucion</label>
                  <Controller
                    control={control}
                    name="institution"
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          {...field}
                          className="mt-1"
                          sizeClass="h-10 px-3 py-2"
                          rounded="rounded-lg"
                          placeholder="Universidad, Instituto, etc"
                        />
                        {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                      </>
                    )}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Año</label>
                  <Controller
                    control={control}
                    name="year"
                    rules={{
                      min: { value: 1900, message: 'Año mínimo: 1900' },
                      max: { value: new Date().getFullYear() + 10, message: 'Año máximo excedido' },
                    }}
                    render={({ field, fieldState }) => (
                      <>
                        <Input
                          type="number"
                          {...field}
                          className="mt-1"
                          sizeClass="h-10 px-3 py-2"
                          rounded="rounded-lg"
                          placeholder="Ej. 2020"
                        />
                        {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                      </>
                    )}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    Enfoques profesionales <span className="text-xs text-neutral-500">(máx. 12)</span>
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
                          aria-label={`Eliminar ${f}`}
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
                      placeholder={focuses.length >= 12 ? 'Máximo alcanzado' : 'Añade un enfoque y pulsa Enter'}
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
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                    Guardar
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

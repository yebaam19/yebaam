/**
 * LanguageDialog
 */

'use client'

import { Button } from '@/ui/Button'
import Input from '@/ui/Input'
import Select from '@/ui/Select'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { Language, LanguageFormData } from '../../interfaces/professional-profile.interfaces'

interface LanguageDialogProps {
  isOpen: boolean
  language: Language | null
  onClose: () => void
  onSubmit: (data: LanguageFormData) => Promise<void>
}

// Opciones de nivel - valores en inglés para el backend, labels en español para UI
const proficiencyOptions = [
  { value: 'basic', label: 'Básico' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
  { value: 'fluent', label: 'Fluido' },
  { value: 'native', label: 'Nativo/Bilingüe' },
]

export function LanguageDialog({ isOpen, language, onClose, onSubmit }: LanguageDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<LanguageFormData>({
    defaultValues: { name: '', proficiency: 'intermediate' },
  })

  useEffect(() => {
    if (isOpen) {
      if (language) {
        reset({ name: language.name, proficiency: language.proficiency ?? 'intermediate' })
      } else {
        reset({ name: '', proficiency: 'intermediate' })
      }
    }
  }, [isOpen, language, reset])

  const submit = async (data: LanguageFormData) => {
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
                {language ? 'Editar Idioma' : 'Agregar Idioma'}
              </DialogTitle>

              <form className="mt-4 space-y-4" onSubmit={handleSubmit(submit)}>
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Idioma</label>
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
                          placeholder="Ej. Ingles"
                        />
                        {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                      </>
                    )}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Nivel</label>
                  <Controller
                    control={control}
                    name="proficiency"
                    render={({ field }) => (
                      <Select {...field} className="mt-1 rounded-lg">
                        {proficiencyOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Select>
                    )}
                  />
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

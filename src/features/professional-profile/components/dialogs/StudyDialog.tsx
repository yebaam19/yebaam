/**
 * StudyDialog
 */

'use client'

import { Button } from '@/ui/Button'
import Input from '@/ui/Input'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { Study, StudyFormData } from '../../interfaces/professional-profile.interfaces'

interface StudyDialogProps {
  isOpen: boolean
  study: Study | null
  onClose: () => void
  onSubmit: (data: StudyFormData) => Promise<void>
}

export function StudyDialog({ isOpen, study, onClose, onSubmit }: StudyDialogProps) {
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
    },
  })

  // Resetear formulario cuando se abre/cierra el dialog o cambia el estudio
  useEffect(() => {
    if (isOpen) {
      if (study) {
        // Modo edición: cargar datos del estudio existente
        reset({
          name: study.name ?? '',
          institution: study.institution ?? '',
          year: study.year ?? new Date().getFullYear(),
        })
      } else {
        // Modo creación: formulario vacío
        reset({
          name: '',
          institution: '',
          year: new Date().getFullYear(),
        })
      }
    }
  }, [isOpen, study, reset])

  const submit = async (data: StudyFormData) => {
    // Limpiar y transformar datos antes de enviar
    const cleanData: StudyFormData = {
      name: data.name.trim(),
      institution: data.institution && data.institution.trim() ? data.institution.trim() : undefined,
      year: data.year ? Number(data.year) : undefined,
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
            <DialogPanel className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
              <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-white">
                {study ? 'Editar Estudio' : 'Agregar Estudio'}
              </DialogTitle>

              <form className="mt-4 space-y-4" onSubmit={handleSubmit(submit)}>
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      Nombre del estudio *
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
                            placeholder="Ej. Licenciatura en Ingeniería de Sistemas"
                          />
                          {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                        </>
                      )}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      Institución (opcional)
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
                          placeholder="Ej. Universidad Nacional"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Año (opcional)</label>
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
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" onClick={onClose} disabled={isSubmitting} outline>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                    {study ? 'Guardar Cambios' : 'Agregar'}
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

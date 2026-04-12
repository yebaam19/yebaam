/**
 * LicenseDialog
 */

'use client'

import { Button } from '@/ui/Button'
import Input from '@/ui/Input'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { License, LicenseFormData } from '../../interfaces/professional-profile.interfaces'

interface LicenseDialogProps {
  isOpen: boolean
  license: License | null
  onClose: () => void
  onSubmit: (data: LicenseFormData) => Promise<void>
}

export function LicenseDialog({ isOpen, license, onClose, onSubmit }: LicenseDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<LicenseFormData>({
    defaultValues: {
      name: '',
      number: '',
      issuedBy: '',
      issuedAt: '',
    },
  })

  useEffect(() => {
    if (license) {
      const formatDateForInput = (date: string | Date | null | undefined): string => {
        if (!date) return ''
        const d = typeof date === 'string' ? new Date(date) : date
        return d.toISOString().split('T')[0]
      }
      reset({
        name: license.name,
        number: license.number ?? '',
        issuedBy: license.issuedBy ?? '',
        issuedAt: formatDateForInput(license.issuedAt),
      })
    } else {
      reset({ name: '', number: '', issuedBy: '', issuedAt: '' })
    }
  }, [license, reset])

  const submit = async (data: LicenseFormData) => {
    await onSubmit({
      ...data,
      number: data.number || undefined,
      issuedBy: data.issuedBy || undefined,
      issuedAt: data.issuedAt || undefined,
    })
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
                {license ? 'Editar Licencia' : 'Agregar Licencia'}
              </DialogTitle>

              <form className="mt-4 space-y-4" onSubmit={handleSubmit(submit)}>
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      Nombre de la licencia *
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
                            placeholder="Ej. AWS Solutions Architect"
                          />
                          {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                        </>
                      )}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      Número de licencia (opcional)
                    </label>
                    <Controller
                      control={control}
                      name="number"
                      render={({ field }) => (
                        <Input
                          {...field}
                          className="mt-1"
                          sizeClass="h-10 px-3 py-2"
                          rounded="rounded-lg"
                          placeholder="Ej. ABC-123456"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      Emitido por (opcional)
                    </label>
                    <Controller
                      control={control}
                      name="issuedBy"
                      render={({ field }) => (
                        <Input
                          {...field}
                          className="mt-1"
                          sizeClass="h-10 px-3 py-2"
                          rounded="rounded-lg"
                          placeholder="Ej. Amazon Web Services"
                        />
                      )}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                      Fecha de emisión (opcional)
                    </label>
                    <Controller
                      control={control}
                      name="issuedAt"
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

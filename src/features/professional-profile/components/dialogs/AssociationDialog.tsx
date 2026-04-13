/**
 * AssociationDialog
 */

'use client'

import { Button } from '@/ui/Button'
import Input from '@/ui/Input'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { ArrowPathIcon } from '@/components/icons/heroicons-shim'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { Association, AssociationFormData } from '../../interfaces/professional-profile.interfaces'

interface AssociationDialogProps {
  isOpen: boolean
  association: Association | null
  onClose: () => void
  onSubmit: (data: AssociationFormData) => Promise<void>
}

export function AssociationDialog({ isOpen, association, onClose, onSubmit }: AssociationDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<AssociationFormData>({
    defaultValues: { name: '', role: '' },
  })

  useEffect(() => {
    if (association) {
      reset({
        name: association.name,
        role: association.role ?? '',
      })
    } else {
      reset({ name: '', role: '' })
    }
  }, [association, reset])

  const submit = async (data: AssociationFormData) => {
    await onSubmit({
      name: data.name,
      role: data.role || undefined,
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
            <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
              <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-white">
                {association ? 'Editar Asociación' : 'Agregar Asociación'}
              </DialogTitle>

              <form className="mt-4 space-y-4" onSubmit={handleSubmit(submit)}>
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    Nombre de la asociación *
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
                          placeholder="Ej. ACM, IEEE, ACOFI"
                        />
                        {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                      </>
                    )}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Rol (opcional)</label>
                  <Controller
                    control={control}
                    name="role"
                    render={({ field }) => (
                      <Input
                        {...field}
                        className="mt-1"
                        sizeClass="h-10 px-3 py-2"
                        rounded="rounded-lg"
                        placeholder="Ej. Miembro, Director, Presidente"
                      />
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

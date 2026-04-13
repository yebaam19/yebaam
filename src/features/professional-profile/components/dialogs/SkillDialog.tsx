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
import type { Skill, SkillFormData } from '../../interfaces/professional-profile.interfaces'

interface SkillDialogProps {
  isOpen: boolean
  skill: Skill | null
  onClose: () => void
  onSubmit: (data: SkillFormData) => Promise<void>
}

// Opciones de niveles - valores en inglés para el backend, labels en español para UI
const levelOptions = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
  { value: 'expert', label: 'Experto' },
]

export function SkillDialog({ isOpen, skill, onClose, onSubmit }: SkillDialogProps) {
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
                {skill ? 'Editar Habilidad' : 'Agregar Habilidad'}
              </DialogTitle>

              <form className="mt-4 space-y-4" onSubmit={handleSubmit(submit)}>
                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Nombre</label>
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
                          placeholder="Ej. React, TypeScript"
                        />
                        {fieldState.error && <p className="mt-1 text-xs text-red-500">{fieldState.error.message}</p>}
                      </>
                    )}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Nivel (opcional)</label>
                  <Controller
                    control={control}
                    name="level"
                    render={({ field }) => (
                      <Select {...field} className="mt-1 rounded-lg">
                        <option value="">Seleccionar nivel</option>
                        {levelOptions.map((level) => (
                          <option key={level.value} value={level.value}>
                            {level.label}
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

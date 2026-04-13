/**
 * CreateProfileDialog Component
 *
 * Dialog para crear un nuevo perfil profesional
 */

'use client'

import { useMyProfile } from '@/features/user/hooks/useUserProfile'
import { cn } from '@/lib/utils'
import { Button } from '@/ui/Button'
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react'
import { GlobeAltIcon, LockClosedIcon, UserGroupIcon, XMarkIcon } from '@/components/icons/heroicons-shim'
import { ArrowPathIcon } from '@/components/icons/heroicons-shim'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useCreateProfile } from '../../hooks'
import type { ProfessionalProfileVisibility } from '../../interfaces/professional-profile.interfaces'

interface CreateProfileDialogProps {
  isOpen: boolean
  onClose: () => void
}

const visibilityOptions: Array<{
  value: ProfessionalProfileVisibility
  label: string
  description: string
  icon: React.ElementType
}> = [
  {
    value: 'PUBLIC',
    label: 'Publico',
    description: 'Cualquier persona puede ver tu perfil profesional',
    icon: GlobeAltIcon,
  },
  {
    value: 'PRIVATE',
    label: 'Privado',
    description: 'Solo tú puedes ver tu perfil profesional',
    icon: LockClosedIcon,
  },
  {
    value: 'LIMITED',
    label: 'Limitado',
    description: 'Solo tus conexiones pueden ver tu perfil profesional',
    icon: UserGroupIcon,
  },
]

export function CreateProfileDialog({ isOpen, onClose }: CreateProfileDialogProps) {
  const router = useRouter()
  const { mutateAsync: createProfile, isPending: isLoading } = useCreateProfile()
  const { profile: myProfile } = useMyProfile()
  const [visibility, setVisibility] = useState<ProfessionalProfileVisibility>('PUBLIC')

  const handleSubmit = async () => {
    try {
      const profile = await createProfile({ visibility })
      onClose()
      // Redirigir al perfil recién creado usando username
      const username = myProfile?.username || profile.userId
      router.push(`/feed/professional-profile/${username}`)
    } catch (error) {
      // El error ya se maneja en el mutation hook
    }
  }

  return (
    <Transition show={isOpen}>
      <Dialog onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <TransitionChild
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </TransitionChild>

        {/* Panel */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900">
              {/* Header */}
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-semibold text-neutral-900 dark:text-white">
                  Crear Perfil Profesional
                </DialogTitle>
                <button
                  onClick={onClose}
                  className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="mt-6">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Selecciona quien puede ver tu perfil profesional
                </p>

                <div className="mt-4 space-y-3">
                  {visibilityOptions.map((option) => {
                    const Icon = option.icon
                    const isSelected = visibility === option.value

                    return (
                      <button
                        key={option.value}
                        onClick={() => setVisibility(option.value)}
                        className={cn(
                          'flex w-full cursor-pointer items-start gap-4 rounded-xl border p-4 text-left transition-all',
                          isSelected
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600'
                        )}
                      >
                        <div
                          className={cn(
                            'rounded-lg p-2',
                            isSelected
                              ? 'bg-primary-100 text-primary-600 dark:bg-primary-800 dark:text-primary-400'
                              : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p
                            className={cn(
                              'font-medium',
                              isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-neutral-900 dark:text-white'
                            )}
                          >
                            {option.label}
                          </p>
                          <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{option.description}</p>
                        </div>
                        {/* Radio indicator */}
                        <div
                          className={cn(
                            'mt-1 h-5 w-5 rounded-full border-2 transition-colors',
                            isSelected
                              ? 'border-primary-500 bg-primary-500'
                              : 'border-neutral-300 dark:border-neutral-600'
                          )}
                        >
                          {isSelected && (
                            <div className="flex h-full w-full items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 flex justify-end gap-3">
                <Button onClick={onClose} disabled={isLoading} outline>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                  Crear Perfil
                </Button>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  )
}

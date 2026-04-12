'use client'

import { useCreateClub } from '@/features/clubs/hooks/useClubs'
import { useClubsUIStore } from '@/features/clubs/store/clubsUIStore'
import type { CreateClubDto } from '@/features/clubs/types/club.types'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'
import { Fragment, useState } from 'react'
import { CreateClubStep1, CreateClubStep2, CreateClubStep3, CreateClubStep4 } from './create-club'

export function CreateClubModal() {
  const router = useRouter()
  const { isCreateModalOpen, setIsCreateModalOpen } = useClubsUIStore()
  const createMutation = useCreateClub()

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<Partial<CreateClubDto>>({
    privacy: 'PUBLIC',
  })

  const totalSteps = 4

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleUpdateData = (data: Partial<CreateClubDto>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const handleSubmit = async () => {
    try {
      const club = await createMutation.mutateAsync(formData as CreateClubDto)
      setIsCreateModalOpen(false)
      resetModal()
      // Navegar al club recién creado usando el slug
      if (club.slug) {
        router.push(`/feed/clubes/${club.slug}`)
      }
    } catch (error) {
      console.error('Error creating club:', error)
    }
  }

  const resetModal = () => {
    setCurrentStep(1)
    setFormData({ privacy: 'PUBLIC' })
  }

  const handleClose = () => {
    setIsCreateModalOpen(false)
    // Reset después de la animación de cierre
    setTimeout(resetModal, 300)
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Información básica'
      case 2:
        return 'Configuración'
      case 3:
        return 'Imágenes'
      case 4:
        return 'Información adicional'
      default:
        return 'Crear club'
    }
  }

  return (
    <Transition appear show={isCreateModalOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 dark:bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all dark:bg-gray-800">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                  <div>
                    <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900 dark:text-white">
                      Crear club
                    </Dialog.Title>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      {getStepTitle()} - Paso {currentStep} de {totalSteps}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="bg-gray-50 px-6 py-3 dark:bg-gray-900">
                  <div className="flex gap-2">
                    {[...Array(totalSteps)].map((_, index) => (
                      <div
                        key={index}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          index + 1 <= currentStep ? 'bg-primary-600' : 'bg-neutral-200 dark:bg-neutral-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
                  {currentStep === 1 && (
                    <CreateClubStep1 data={formData} onUpdate={handleUpdateData} onNext={handleNext} />
                  )}
                  {currentStep === 2 && (
                    <CreateClubStep2
                      data={formData}
                      onUpdate={handleUpdateData}
                      onNext={handleNext}
                      onBack={handleBack}
                    />
                  )}
                  {currentStep === 3 && (
                    <CreateClubStep3
                      data={formData}
                      onUpdate={handleUpdateData}
                      onNext={handleNext}
                      onBack={handleBack}
                    />
                  )}
                  {currentStep === 4 && (
                    <CreateClubStep4
                      data={formData}
                      onUpdate={handleUpdateData}
                      onBack={handleBack}
                      onSubmit={handleSubmit}
                      isSubmitting={createMutation.isPending}
                    />
                  )}
                </div>

                {/* Error Message */}
                {createMutation.isError && (
                  <div className="border-t border-red-200 bg-red-50 px-6 py-3 dark:border-red-800 dark:bg-red-900/20">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {createMutation.error instanceof Error
                        ? createMutation.error.message
                        : 'Error al crear el club. Intenta nuevamente.'}
                    </p>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

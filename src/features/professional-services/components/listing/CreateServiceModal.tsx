/**
 * CreateServiceModal Component
 *
 * Modal con pasos para crear un servicio profesional.
 * Similar a CreatePageModal pero adaptado para servicios.
 */

'use client'

import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@/components/icons/heroicons-shim'
import { useRouter } from 'next/navigation'
import { Fragment, useEffect, useState } from 'react'

import { CreateProfessionalServiceDTO } from '../../interfaces/professional-service.interfaces'
import { useProfessionalServicesUIStore } from '../../store/professionalServicesUI.store'
import { CreateServiceStep1, CreateServiceStep2, CreateServiceStep3, CreateServiceStep4, CreateServiceStep5 } from './create-service'
import { CreateServiceGate } from './create-service/CreateServiceGate'
import { uploadPendingMedia } from './create-service/uploadPendingMedia'
import { useCreateService } from '../../hooks/useServices'
import { myEligibilityAction } from '../../actions/services.actions'
import { professionalServicePath } from '../../constants/routes'

type Eligibility = Awaited<ReturnType<typeof myEligibilityAction>>

export function CreateServiceModal() {
  const router = useRouter()
  const { isCreateModalOpen, closeCreateModal } = useProfessionalServicesUIStore()
  const createMutation = useCreateService()

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<Partial<CreateProfessionalServiceDTO>>({
    currency: 'COP',
    availableForHire: true,
  })

  // PDF eligibility rule: only a verified professional profile may publish.
  // Checked on open; the Server Action + RLS enforce it again on submit.
  const [eligibility, setEligibility] = useState<Eligibility | null>(null)
  useEffect(() => {
    if (!isCreateModalOpen) return
    let cancelled = false
    myEligibilityAction()
      .then((e) => {
        if (!cancelled) setEligibility(e)
      })
      .catch(() => {
        if (!cancelled) setEligibility({ eligible: false, hasProfile: false, professionalProfileId: null })
      })
    return () => {
      cancelled = true
    }
  }, [isCreateModalOpen])

  const totalSteps = 5

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

  const handleUpdateData = (data: Partial<CreateProfessionalServiceDTO>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const handleSubmit = async () => {
    try {
      // 1. Crear el servicio. 2. Subir los medios pendientes (galería del paso 5).
      const response = await createMutation.mutateAsync(formData as CreateProfessionalServiceDTO)
      await uploadPendingMedia(response.service.id)

      // 3. Cerrar modal y navegar al perfil del servicio.
      closeCreateModal()
      resetModal()
      router.push(professionalServicePath(response.service.slug))
    } catch (error) {
      console.error('Error creating service:', error)
    }
  }

  const resetModal = () => {
    setCurrentStep(1)
    setFormData({ currency: 'COP', availableForHire: true })
    // Reset eligibility so the next open re-checks and shows the loading state.
    setEligibility(null)
  }

  const handleClose = () => {
    closeCreateModal()
    // Reset después de la animación de cierre
    setTimeout(resetModal, 300)
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return 'Información básica'
      case 2:
        return 'Categoría y ubicación'
      case 3:
        return 'Precios y disponibilidad'
      case 4:
        return 'Información de contacto'
      case 5:
        return 'Galería de imágenes'
      default:
        return 'Crear servicio'
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all dark:bg-neutral-800">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-700">
                  <div>
                    <Dialog.Title as="h3" className="text-xl font-semibold text-neutral-900 dark:text-white">
                      Crear servicio profesional
                    </Dialog.Title>
                    <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                      {getStepTitle()} - Paso {currentStep} de {totalSteps}
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="rounded-full p-2 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700"
                  >
                    <XMarkIcon className="h-6 w-6 text-neutral-500 dark:text-neutral-400" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="bg-neutral-50 px-6 py-3 dark:bg-neutral-900">
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

                {/* Content — eligibility gate (PDF rule) wraps the create steps. */}
                <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
                  {eligibility?.eligible ? (
                    <>
                      {currentStep === 1 && (
                        <CreateServiceStep1 data={formData} onUpdate={handleUpdateData} onNext={handleNext} />
                      )}
                      {currentStep === 2 && (
                        <CreateServiceStep2
                          data={formData}
                          onUpdate={handleUpdateData}
                          onNext={handleNext}
                          onBack={handleBack}
                        />
                      )}
                      {currentStep === 3 && (
                        <CreateServiceStep3
                          data={formData}
                          onUpdate={handleUpdateData}
                          onNext={handleNext}
                          onBack={handleBack}
                        />
                      )}
                      {currentStep === 4 && (
                        <CreateServiceStep4
                          data={formData}
                          onUpdate={handleUpdateData}
                          onBack={handleBack}
                          onNext={handleNext}
                        />
                      )}
                      {currentStep === 5 && (
                        <CreateServiceStep5
                          data={formData}
                          onUpdate={handleUpdateData}
                          onBack={handleBack}
                          onSubmit={handleSubmit}
                          isSubmitting={createMutation.isPending}
                        />
                      )}
                    </>
                  ) : (
                    <CreateServiceGate eligibility={eligibility} />
                  )}
                </div>

                {/* Error Message */}
                {createMutation.isError && (
                  <div className="border-t border-red-200 bg-red-50 px-6 py-3 dark:border-red-800 dark:bg-red-900/20">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      {createMutation.error instanceof Error
                        ? createMutation.error.message
                        : 'Error al crear el servicio. Intenta nuevamente.'}
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

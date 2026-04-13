'use client'

import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@/components/icons/heroicons-shim'
import { useRouter } from 'next/navigation'
import { Fragment, useState } from 'react'

import { useCreateBusiness } from '../../hooks/useBusinesses'
import { CreateBusinessStep1 } from './create-business/CreateBusinessStep1'
import { CreateBusinessStep2 } from './create-business/CreateBusinessStep2'
import { CreateBusinessStep3 } from './create-business/CreateBusinessStep3'
import { CreateBusinessStep4 } from './create-business/CreateBusinessStep4'

interface CreateBusinessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export interface BusinessFormData {
  // Step 1 - Básico
  name: string
  description: string

  // Step 2 - Categoría y Ubicación
  categoryId: string
  stateId: string
  cityId: string
  address: string

  // Step 3 - Contacto
  email: string
  phone: string
  website: string

  // Step 4 - Redes Sociales
  facebookUrl: string
  instagramUrl: string
  twitterUrl: string
  linkedinUrl: string
  youtubeUrl: string
  tiktokUrl: string
}

const initialFormData: BusinessFormData = {
  name: '',
  description: '',
  categoryId: '',
  stateId: '',
  cityId: '',
  address: '',
  email: '',
  phone: '',
  website: '',
  facebookUrl: '',
  instagramUrl: '',
  twitterUrl: '',
  linkedinUrl: '',
  youtubeUrl: '',
  tiktokUrl: '',
}

const totalSteps = 4

export function CreateBusinessModal({ open, onOpenChange }: CreateBusinessModalProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<BusinessFormData>(initialFormData)
  const createMutation = useCreateBusiness()

  const updateFormData = (data: Partial<BusinessFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

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

  const handleSubmit = async () => {
    try {
      const business = await createMutation.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
        categoryId: formData.categoryId,
        cityId: formData.cityId,
        address: formData.address || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        website: formData.website || undefined,
        facebookUrl: formData.facebookUrl || undefined,
        instagramUrl: formData.instagramUrl || undefined,
        twitterUrl: formData.twitterUrl || undefined,
        linkedinUrl: formData.linkedinUrl || undefined,
        youtubeUrl: formData.youtubeUrl || undefined,
        tiktokUrl: formData.tiktokUrl || undefined,
      })

      onOpenChange(false)
      resetModal()
      // Navegar al negocio recién creado
      //router.push(`/feed/businesses/${business.slug}`)
    } catch (error) {
      console.error('Error creating business:', error)
    }
  }

  const resetModal = () => {
    setCurrentStep(1)
    setFormData(initialFormData)
  }

  const handleClose = () => {
    onOpenChange(false)
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
        return 'Información de contacto'
      case 4:
        return 'Redes sociales'
      default:
        return 'Crear negocio'
    }
  }

  return (
    <Transition appear show={open} as={Fragment}>
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
                      Registrar negocio
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

                {/* Content */}
                <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
                  {currentStep === 1 && (
                    <CreateBusinessStep1 data={formData} onChange={updateFormData} onNext={handleNext} />
                  )}
                  {currentStep === 2 && (
                    <CreateBusinessStep2
                      data={formData}
                      onChange={updateFormData}
                      onNext={handleNext}
                      onBack={handleBack}
                    />
                  )}
                  {currentStep === 3 && (
                    <CreateBusinessStep3
                      data={formData}
                      onChange={updateFormData}
                      onNext={handleNext}
                      onBack={handleBack}
                    />
                  )}
                  {currentStep === 4 && (
                    <CreateBusinessStep4
                      data={formData}
                      onChange={updateFormData}
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
                        : 'Error al crear el negocio. Intenta nuevamente.'}
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

/**
 * CreateServiceModal Component
 *
 * Modal con pasos para crear un servicio profesional.
 * Similar a CreatePageModal pero adaptado para servicios.
 */

'use client'

import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@/components/icons/heroicons-shim'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Fragment, useState } from 'react'

import { CreateProfessionalServiceDTO } from '../../interfaces/professional-service.interfaces'
import { useProfessionalServicesUIStore } from '../../store/professionalServicesUI.store'
import { CreateServiceStep1, CreateServiceStep2, CreateServiceStep3, CreateServiceStep4, CreateServiceStep5 } from './create-service'
import { useCreateService } from '../../hooks/useServices'
import { uploadService } from '@/lib/service/upload.service'
import { mediaApiClient } from '../../api/media.api'
import { professionalServicePath } from '../../constants/routes'

export function CreateServiceModal() {
  const router = useRouter()
  const { isCreateModalOpen, closeCreateModal } = useProfessionalServicesUIStore()
  const createMutation = useCreateService()

  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<Partial<CreateProfessionalServiceDTO>>({
    currency: 'COP',
    availableForHire: true,
  })

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
      // 1. Crear el servicio primero
      const response = await createMutation.mutateAsync(formData as any)
      const serviceId = response.service.id

      // 2. Subir medios pendientes si existen
      const pendingMediaJson = sessionStorage.getItem('pendingMediaItems')
      if (pendingMediaJson) {
        const pendingMedia = JSON.parse(pendingMediaJson)
        
        if (pendingMedia.length > 0) {
          console.log(`Subiendo ${pendingMedia.length} medios al servicio ${serviceId}...`)

          // Subir cada media
          for (const media of pendingMedia) {
            try {
              let finalUrl = media.url
              let thumbnailUrl: string | undefined = undefined

              if (media.file) {
                if (media.type === 'video') {
                  const result = await uploadService.uploadVideo(media.file)
                  finalUrl = `https://iframe.videodelivery.net/${result.uid}`
                  thumbnailUrl = result.thumbnail
                } else {
                  const result = await uploadService.uploadImage(media.file)
                  finalUrl = result.url
                }
              }

              // Agregar media al servicio en el backend
              await mediaApiClient.addMedia(serviceId, {
                type: media.type,
                url: finalUrl,
                thumbnailUrl,
                caption: media.caption || undefined,
                order: media.order,
              })

              console.log(`Media subido exitosamente: ${media.type}`)
            } catch (mediaError) {
              console.error('Error subiendo media:', mediaError)
              // Continuar con los demás medios aunque uno falle
            }
          }

          // Limpiar sessionStorage
          sessionStorage.removeItem('pendingMediaItems')
          console.log('Todos los medios subidos exitosamente')
        }
      }

      // 3. Cerrar modal y navegar
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

                {/* Content */}
                <div className="max-h-[60vh] overflow-y-auto px-6 py-6">
                  {/* Requisito del PDF: solo perfiles profesionales verificados pueden publicar.
                      La verificación de títulos tiene un costo; abrir el perfil no. La validación
                      real queda pendiente del backend de servicios (hoy mock) — ver routes/README. */}
                  {currentStep === 1 && (
                    <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/60 dark:bg-amber-900/20">
                      <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                        Solo para perfiles profesionales verificados
                      </p>
                      <p className="mt-0.5 text-sm text-amber-800 dark:text-amber-300/90">
                        Para publicar un servicio necesitas un perfil profesional con títulos verificados por la
                        plataforma.{' '}
                        <Link
                          href="/feed/professional-profile"
                          className="font-medium underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100"
                        >
                          Verificar mi perfil profesional
                        </Link>
                      </p>
                    </div>
                  )}
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

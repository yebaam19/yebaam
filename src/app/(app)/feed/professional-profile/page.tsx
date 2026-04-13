'use client'

import { ArrowPathIcon } from '@/components/icons/heroicons-shim'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// Feature components
import { CreateProfileDialog } from '@/features/professional-profile/components/welcome/CreateProfileDialog'
import { ProfessionalBenefits } from '@/features/professional-profile/components/welcome/ProfessionalBenefits'
import { ValidationSteps } from '@/features/professional-profile/components/welcome/ValidationSteps'

// React Query hooks
import { useMyProfile } from '@/features/professional-profile/hooks'

/**
 * Página de Bienvenida al Perfil Profesional
 *
 * Esta página se muestra cuando un usuario accede a /feed/professional-profile
 * - Si ya tiene un perfil profesional, redirige a su perfil
 * - Si no tiene perfil, muestra la información de beneficios y permite crearlo
 */
export default function ProfessionalProfileWelcomePage() {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Cargar perfil del usuario actual con React Query
  const { data: myProfile, isLoading } = useMyProfile()

  // Si ya tiene perfil, redirigir a su perfil profesional
  useEffect(() => {
    if (!myProfile || isLoading) return
    const identifier = myProfile.user?.username || myProfile.userId
    if (!identifier) return
    router.push(`/feed/professional-profile/${identifier}`)
  }, [myProfile, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  // Si ya tiene perfil (mientras redirige), mostrar loading
  if (myProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-3 text-neutral-600 dark:text-neutral-400">Redirigiendo a tu perfil...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-w-0 bg-neutral-50 dark:bg-neutral-900">
      <div className="mx-auto max-w-6xl min-w-0 px-4 py-5 sm:px-5">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-3xl font-bold text-neutral-900 md:text-4xl lg:text-5xl dark:text-white">
            Perfil Profesional
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
            Destaca tu experiencia, habilidades y logros profesionales. Conecta con oportunidades y profesionales de tu
            sector.
          </p>
        </div>

        {/* Benefits Section */}
        <section className="mb-12 px-0 py-3 sm:p-5">
          <ProfessionalBenefits />
        </section>

        {/* Validation Steps */}
        <section className="mb-12">
          <h2 className="mb-6 text-center text-2xl font-semibold text-neutral-900 dark:text-white">
            ¿Cómo funciona la validación?
          </h2>
          <ValidationSteps />
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="mx-auto max-w-xl rounded-2xl bg-white p-5 shadow-lg sm:p-8 dark:bg-neutral-800">
            <h3 className="mb-4 text-xl font-semibold text-neutral-900 dark:text-white">¿Listo para comenzar?</h3>
            <p className="mb-6 text-neutral-600 dark:text-neutral-400">
              Crea tu perfil profesional y empieza a destacar tus habilidades y experiencia ante la comunidad.
            </p>
            <button
              onClick={() => setIsDialogOpen(true)}
              className="w-full rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700 sm:w-auto"
            >
              Crear mi perfil profesional
            </button>
          </div>
        </section>

        {/* Create Profile Dialog */}
        <CreateProfileDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
      </div>
    </div>
  )
}

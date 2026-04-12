'use client'

import { useAuth } from '@/features/auth'
import { PROFILE_FEATURES } from '../config/features.config'
import { FeatureCard } from './FeatureCard'
import { ProfileBenefits } from './ProfileBenefits'
import { VerificationCard } from './VerificationCard'

/**
 * Contenido principal de la página de Perfiles
 * Muestra los diferentes tipos de espacios digitales disponibles en Yebaam
 */
export function ProfilesContent() {
  const { user } = useAuth()

  // Determinar si el usuario puede crear espacios (por ahora siempre true, adaptar según lógica de negocio)
  const canCreate = user?.emailVerified ?? false

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-5">
      {/* Hero Section */}
      <ProfileBenefits />

      {/* Features Grid */}
      <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-neutral-900">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROFILE_FEATURES.map((feature) => (
            <FeatureCard key={feature.id} feature={feature} canCreate={canCreate} />
          ))}
        </div>
      </div>

      {/* Verification Card - Solo mostrar si no puede crear */}
      {!canCreate && <VerificationCard />}
    </div>
  )
}

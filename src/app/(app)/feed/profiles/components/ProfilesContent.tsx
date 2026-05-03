'use client'

import { useAuth } from '@/features/auth'
import { PROFILE_FEATURES } from '../config/features.config'
import { FeatureCard } from './FeatureCard'
import { ProfileBenefits } from './ProfileBenefits'
import { VerificationCard } from './VerificationCard'

export function ProfilesContent() {
  const { user } = useAuth()
  const canCreate = user?.emailVerified ?? false

  return (
    <div className="bg-linear-to-b from-primary-50/40 via-white to-neutral-50 dark:from-primary-900/10 dark:via-neutral-950 dark:to-neutral-950">
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-6 sm:space-y-10 sm:px-6 sm:py-8 lg:px-8">
        <ProfileBenefits />

        <section id="explora-espacios" className="space-y-5">
          <header className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-700 dark:text-primary-400">
              Explora tus espacios
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl dark:text-white">
              Elige dónde quieres crecer hoy
            </h2>
            <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
              Cada espacio tiene su propósito. Únete, crea y conecta a tu ritmo.
            </p>
          </header>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {PROFILE_FEATURES.map((feature) => (
              <FeatureCard key={feature.id} feature={feature} canCreate={canCreate} />
            ))}
          </div>
        </section>

        {!canCreate && <VerificationCard />}
      </div>
    </div>
  )
}

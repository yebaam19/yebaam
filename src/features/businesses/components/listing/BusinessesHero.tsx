'use client'

/**
 * BusinessesHero Component
 *
 * Hero section para la página de negocios.
 * Estilo similar a ServicesHero pero con tema azul/cyan.
 */

import { BuildingStorefrontIcon, MapPinIcon, PlusIcon, StarIcon } from '@/components/icons/heroicons-shim'

import { BackgroundPattern } from '@/components/BackgroundPattern'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

// ============================================================================
// TYPES
// ============================================================================

interface BusinessesHeroProps {
  className?: string
  onCreateClick?: () => void
  showCreateButton?: boolean
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BusinessesHero({ className, onCreateClick }: BusinessesHeroProps) {
  const t = useTranslations('businesses')
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-2xl bg-feature-businesses px-6 py-8 md:px-12 md:py-10',
        className
      )}
    >
      {/* Background Pattern */}
      <BackgroundPattern opacity={0.1} color="white" />

      {/* Content */}
      <div className="relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-2xl font-bold text-white md:text-3xl lg:text-4xl">{t('hero.title')}</h1>
          <p className="mt-3 text-base text-amber-100 md:text-lg">{t('hero.subtitle')}</p>

          {/* Create Button */}
          {onCreateClick && (
            <button
              onClick={onCreateClick}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 font-semibold text-amber-900 shadow-lg transition-all hover:bg-amber-50 hover:shadow-xl"
            >
              <PlusIcon className="h-5 w-5" />
              {t('hero.createCta')}
            </button>
          )}
        </div>

        {/* Feature Cards */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={<BuildingStorefrontIcon className="h-6 w-6" />}
            title={t('hero.features.catalog.title')}
            description={t('hero.features.catalog.description')}
          />
          <FeatureCard
            icon={<MapPinIcon className="h-6 w-6" />}
            title={t('hero.features.local.title')}
            description={t('hero.features.local.description')}
          />
          <FeatureCard
            icon={<StarIcon className="h-6 w-6" />}
            title={t('hero.features.reviews.title')}
            description={t('hero.features.reviews.description')}
          />
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-xl bg-white/10 p-5 backdrop-blur-sm">
      <div className="mb-3 inline-flex rounded-lg bg-white/20 p-2 text-white">{icon}</div>
      <h3 className="mb-2 font-semibold text-white">{title}</h3>
      <p className="text-sm text-amber-100">{description}</p>
    </div>
  )
}

/**
 * ProfessionalBenefits Component
 *
 * Muestra los beneficios de tener un perfil profesional verificado
 */

'use client'

import {
  BriefcaseIcon,
  BuildingOfficeIcon,
  CheckBadgeIcon,
  RocketLaunchIcon,
  TrophyIcon,
  UserGroupIcon,
} from '@/components/icons/heroicons-shim'
import { useTranslations } from 'next-intl'

const benefits = [
  { key: 'verification', icon: CheckBadgeIcon },
  { key: 'credibility', icon: TrophyIcon },
  { key: 'networking', icon: UserGroupIcon },
  { key: 'opportunities', icon: BuildingOfficeIcon },
  { key: 'portfolio', icon: BriefcaseIcon },
  { key: 'visibility', icon: RocketLaunchIcon },
] as const

export function ProfessionalBenefits() {
  const t = useTranslations('professional')

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('benefits.heading')}</h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">{t('benefits.subheading')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map((benefit) => {
          const Icon = benefit.icon
          return (
            <div
              key={benefit.key}
              className="group rounded-xl border border-neutral-200 bg-white p-5 transition-all hover:border-primary-500 hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
            >
              <div className="mb-4 inline-flex rounded-lg bg-primary-50 p-3 text-primary-600 group-hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-semibold text-neutral-900 dark:text-white">
                {t(`benefits.items.${benefit.key}.title` as const)}
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {t(`benefits.items.${benefit.key}.description` as const)}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

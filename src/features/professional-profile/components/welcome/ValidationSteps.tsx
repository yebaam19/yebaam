/**
 * ValidationSteps Component
 *
 * Muestra los pasos del proceso de verificación profesional
 */

'use client'

import { ArrowUpTrayIcon, CheckBadgeIcon, ShieldCheckIcon } from '@/components/icons/heroicons-shim'
import { useTranslations } from 'next-intl'

const steps = [
  { step: 1, key: 'upload', icon: ArrowUpTrayIcon },
  { step: 2, key: 'review', icon: ShieldCheckIcon },
  { step: 3, key: 'verified', icon: CheckBadgeIcon },
] as const

export function ValidationSteps() {
  const t = useTranslations('professional')

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('validation.heading')}</h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">{t('validation.subheading')}</p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        {steps.map((step, index) => {
          const Icon = step.icon
          return (
            <div key={step.step} className="relative flex-1">
              {/* Línea conectora */}
              {index < steps.length - 1 && (
                <div className="absolute top-16 left-1/2 hidden h-0.5 w-full bg-linear-to-r from-primary-500 to-primary-300 md:block" />
              )}

              <div className="relative flex flex-col items-center rounded-xl border border-neutral-200 bg-white p-6 text-center dark:border-neutral-700 dark:bg-neutral-800">
                {/* Número del paso */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-3 py-1 text-xs font-bold text-white">
                  {t('validation.stepLabel', { step: step.step })}
                </div>

                <div className="mt-2 mb-4 inline-flex rounded-full bg-primary-50 p-4 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
                  <Icon className="h-8 w-8" />
                </div>

                <h3 className="mb-2 font-semibold text-neutral-900 dark:text-white">
                  {t(`validation.steps.${step.key}.title` as const)}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {t(`validation.steps.${step.key}.description` as const)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

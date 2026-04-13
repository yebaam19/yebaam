/**
 * ValidationSteps Component
 *
 * Muestra los pasos del proceso de verificación profesional
 */

'use client'

import { ArrowUpTrayIcon, CheckBadgeIcon, ShieldCheckIcon } from '@/components/icons/heroicons-shim'

const steps = [
  {
    step: 1,
    icon: ArrowUpTrayIcon,
    title: 'Sube tus Documentos',
    description: 'Proporciona los documentos que respalden tu formacion y experiencia profesional',
  },
  {
    step: 2,
    icon: ShieldCheckIcon,
    title: 'Validacion',
    description: 'Nuestro equipo verificará la autenticidad de tus documentos y credenciales',
  },
  {
    step: 3,
    icon: CheckBadgeIcon,
    title: 'Obtén tu Verificacion',
    description: 'Recibe tu insignia de profesional verificado y accede a todos los beneficios',
  },
]

export function ValidationSteps() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Proceso de Verificacion</h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Sigue estos simples pasos para verificar tu perfil profesional
        </p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        {steps.map((step, index) => (
          <div key={step.step} className="relative flex-1">
            {/* Línea conectora */}
            {index < steps.length - 1 && (
              <div className="absolute top-16 left-1/2 hidden h-0.5 w-full bg-linear-to-r from-primary-500 to-primary-300 md:block" />
            )}

            <div className="relative flex flex-col items-center rounded-xl border border-neutral-200 bg-white p-6 text-center dark:border-neutral-700 dark:bg-neutral-800">
              {/* Número del paso */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-3 py-1 text-xs font-bold text-white">
                Paso {step.step}
              </div>

              <div className="mt-2 mb-4 inline-flex rounded-full bg-primary-50 p-4 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
                <step.icon className="h-8 w-8" />
              </div>

              <h3 className="mb-2 font-semibold text-neutral-900 dark:text-white">{step.title}</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

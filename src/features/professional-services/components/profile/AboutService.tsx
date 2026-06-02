import { BriefcaseIcon, ClockIcon, CurrencyDollarIcon, TagIcon } from '@/components/icons/heroicons-shim'
import Link from 'next/link'
import type { Route } from 'next'
import { ProfessionalService } from '../../interfaces/professional-service.interfaces'

interface AboutServiceProps {
  service: ProfessionalService
}

/**
 * Formatea precio con separadores de miles
 */
function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Mapeo de tipos de trabajo
 */
const workTypeLabels: Record<string, string> = {
  remote: 'Remoto',
  'on-site': 'Presencial',
  hybrid: 'Híbrido',
}

/**
 * Sección "Acerca de" del servicio profesional
 */
export function AboutService({ service }: AboutServiceProps) {
  const hasPricing = service.hourlyRate || service.dailyRate || service.projectRate

  return (
    <div className="space-y-6">
      {/* Descripción */}
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Acerca del servicio</h2>

        {service.description ? (
          <div className="prose max-w-none prose-neutral dark:prose-invert">
            {service.description.split('\n').map((paragraph, index) => {
              // Detectar si es un heading (comienza con **)
              if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                return (
                  <h3 key={index} className="mt-4 mb-2 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    {paragraph.replace(/\*\*/g, '')}
                  </h3>
                )
              }

              // Detectar listas
              if (paragraph.startsWith('- ')) {
                return (
                  <li key={index} className="ml-4 text-neutral-700 dark:text-neutral-300">
                    {paragraph.replace('- ', '')}
                  </li>
                )
              }

              // Párrafo normal
              if (paragraph.trim()) {
                return (
                  <p key={index} className="text-neutral-700 dark:text-neutral-300">
                    {paragraph}
                  </p>
                )
              }

              return null
            })}
          </div>
        ) : (
          <p className="text-neutral-500 dark:text-neutral-400">Este servicio aún no tiene descripción.</p>
        )}
      </div>

      {/* Tarifas */}
      {hasPricing && (
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            <CurrencyDollarIcon className="h-5 w-5 text-primary-500" />
            Tarifas
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            {service.hourlyRate && (
              <div className="rounded-xl bg-primary-50 p-4 dark:bg-primary-900/20">
                <div className="flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300">
                  <ClockIcon className="h-4 w-4" />
                  <span>Por hora</span>
                </div>
                <p className="mt-1 text-2xl font-bold text-primary-900 dark:text-primary-100">
                  {formatPrice(service.hourlyRate, service.currency)}
                </p>
              </div>
            )}

            {service.dailyRate && (
              <div className="rounded-xl bg-primary-50 p-4 dark:bg-primary-900/20">
                <div className="flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300">
                  <BriefcaseIcon className="h-4 w-4" />
                  <span>Por día</span>
                </div>
                <p className="mt-1 text-2xl font-bold text-primary-900 dark:text-primary-100">
                  {formatPrice(service.dailyRate, service.currency)}
                </p>
              </div>
            )}

            {service.projectRate && (
              <div className="rounded-xl bg-primary-50 p-4 dark:bg-primary-900/20">
                <div className="flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300">
                  <BriefcaseIcon className="h-4 w-4" />
                  <span>Por proyecto</span>
                </div>
                <p className="mt-1 text-2xl font-bold text-primary-900 dark:text-primary-100">
                  {formatPrice(service.projectRate, service.currency)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tipo de trabajo */}
      {service.workType && service.workType.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            <BriefcaseIcon className="h-5 w-5 text-primary-500" />
            Modalidad de trabajo
          </h2>

          <div className="flex flex-wrap gap-2">
            {service.workType.map((type) => (
              <span
                key={type}
                className="rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300"
              >
                {workTypeLabels[type] || type}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {service.tags && service.tags.length > 0 && (
        <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            <TagIcon className="h-5 w-5 text-primary-500" />
            Etiquetas
          </h2>

          <div className="flex flex-wrap gap-2">
            {service.tags.map((tag) => (
              <Link
                key={tag}
                href={`/professional-services?q=${encodeURIComponent(tag)}` as Route}
                className="rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-800 transition-colors hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

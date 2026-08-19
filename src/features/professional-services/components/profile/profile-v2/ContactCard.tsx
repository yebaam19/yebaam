import Link from 'next/link'
import { ProfessionalService } from '../../../interfaces/professional-service.interfaces'
import { safeExternalHref } from '@/lib/safe-href'

interface ContactCardProps {
  service: Pick<ProfessionalService, 'name' | 'email' | 'phone' | 'website' | 'hourlyRate' | 'currency'>
  /** When true, drops the `sticky top-24` positioning (e.g. inside a tab/panel). */
  inline?: boolean
}

/**
 * Tarjeta de contacto / "Consulta" — botones de correo, llamada y sitio web
 * más la tarifa por hora. Extraída del bloque que vivía inline en la página de
 * perfil para que el riel "Consulta" y la columna de contacto compartan una sola
 * fuente.
 */
export function ContactCard({ service, inline }: ContactCardProps) {
  const websiteHref = safeExternalHref(service.website)
  return (
    <div
      id="consulta"
      className={`scroll-mt-24 rounded-2xl bg-primary-50 p-6 dark:bg-primary-900/20 ${inline ? '' : 'sticky top-24'}`}
    >
      <h3 className="mb-4 font-semibold text-neutral-900 dark:text-neutral-100">¿Interesado en este servicio?</h3>

      <div className="space-y-3">
        {service.email && (
          <a
            href={`mailto:${service.email}?subject=Consulta sobre ${service.name}`}
            className="block w-full rounded-lg bg-primary-500 py-3 text-center font-semibold text-white transition-colors hover:bg-primary-600"
          >
            Enviar correo
          </a>
        )}

        {service.phone && (
          <a
            href={`tel:${service.phone}`}
            className="block w-full rounded-lg border border-primary-500 py-3 text-center font-semibold text-primary-600 transition-colors hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/30"
          >
            Llamar ahora
          </a>
        )}

        {websiteHref && (
          <a
            href={websiteHref}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg border border-neutral-300 py-3 text-center font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Visitar sitio web
          </a>
        )}
      </div>

      {service.hourlyRate && (
        <p className="mt-4 text-center text-sm text-neutral-600 dark:text-neutral-400">
          Desde{' '}
          <span className="font-semibold text-primary-600 dark:text-primary-400">
            {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: service.currency,
              minimumFractionDigits: 0,
            }).format(service.hourlyRate)}
          </span>{' '}
          /hora
        </p>
      )}

      {/* Aviso de intermediación (Manual de Convivencia, Art. 12) */}
      <p className="mt-4 text-center text-xs leading-5 text-neutral-500 dark:text-neutral-400">
        Yebaam actúa como portal de intermediación neutro; la relación contractual es directa entre las partes.{' '}
        <Link
          href="/normativa/normas-comunitarias"
          className="underline underline-offset-2 transition-colors hover:text-primary-600 dark:hover:text-primary-400"
        >
          Normas comunitarias
        </Link>
      </p>
    </div>
  )
}

import { BriefcaseIcon, MapPinIcon } from '@/components/icons/heroicons-shim'
import Link from 'next/link'
import type { Route } from 'next'
import { ProfessionalService } from '../../../interfaces/professional-service.interfaces'
import { ServiceSocialLinks } from '../../header/ServiceSocialLinks'

interface DetailsCardProps {
  service: ProfessionalService
}

/**
 * "Detalles" — Profesión, Especialización, Dirección, Ciudad de Trabajo y Redes
 * Sociales. Los campos sin dato en el modelo (Especialización) se omiten.
 */
export function DetailsCard({ service }: DetailsCardProps) {
  const { category, address, city, workType, subcategories } = service
  const specialization = workType && workType.length > 0 ? workType.map(workTypeLabel).join(', ') : undefined

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
      <h2 className="mb-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Detalles</h2>

      <dl className="space-y-4 text-sm">
        {category?.name && <DetailRow term="Profesión" value={category.name} />}

        {specialization && <DetailRow term="Especialización" value={specialization} />}

        {address && (
          <DetailRow
            term="Dirección"
            value={
              <Link
                href={`https://maps.google.com/?q=${encodeURIComponent(address)}` as Route}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-neutral-700 transition-colors hover:text-primary-600 dark:text-neutral-300 dark:hover:text-primary-400"
              >
                <MapPinIcon className="h-4 w-4 shrink-0" />
                <span>{address}</span>
              </Link>
            }
          />
        )}

        {city?.name && (
          <DetailRow
            term="Ciudad de Trabajo"
            value={
              <Link
                href={`/cities/${city.slug}`}
                className="inline-flex items-center gap-1.5 text-neutral-700 transition-colors hover:text-primary-600 dark:text-neutral-300 dark:hover:text-primary-400"
              >
                <BriefcaseIcon className="h-4 w-4 shrink-0" />
                <span>
                  {city.name}
                  {city.state?.name && `, ${city.state.name}`}
                </span>
              </Link>
            }
          />
        )}
      </dl>

      {/* Especialidades — subcategorías elegidas de la taxonomía (PDF) */}
      {subcategories && subcategories.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">
            Especialidades
          </p>
          <div className="flex flex-wrap gap-1.5">
            {subcategories.map((sub) => (
              <span
                key={sub.id}
                className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/20 dark:text-primary-300"
              >
                {sub.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Redes Sociales */}
      <div className="mt-2">
        <ServiceSocialLinks
          facebookUrl={service.facebookUrl}
          instagramUrl={service.instagramUrl}
          twitterUrl={service.twitterUrl}
          linkedinUrl={service.linkedinUrl}
          youtubeUrl={service.youtubeUrl}
          tiktokUrl={service.tiktokUrl}
        />
      </div>
    </div>
  )
}

const WORK_TYPE_LABELS: Record<string, string> = {
  remote: 'Remoto',
  'on-site': 'Presencial',
  hybrid: 'Híbrido',
}

function workTypeLabel(type: string): string {
  return WORK_TYPE_LABELS[type] ?? type
}

function DetailRow({ term, value }: { term: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">{term}</dt>
      <dd className="mt-0.5 text-neutral-700 dark:text-neutral-300">{value}</dd>
    </div>
  )
}

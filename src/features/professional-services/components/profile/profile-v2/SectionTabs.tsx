'use client'

import { getUserDisplayName } from '@/lib/user-helpers'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useState } from 'react'
import { ProfessionalService, ServiceMediaType } from '../../../interfaces/professional-service.interfaces'
import { ServiceCV } from '../../ServiceCV'
import { AboutService } from '../AboutService'
import { ServiceMediaGallery } from '../ServiceMediaGallery'
import { ServiceReviews } from '../ServiceReviews'

type TabId = 'about' | 'professional' | 'videos' | 'photos' | 'articles' | 'reviews'

interface SectionTabsProps {
  service: ProfessionalService
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'about', label: 'Acerca de mi' },
  { id: 'professional', label: 'Perfil Profesional' },
  { id: 'videos', label: 'Videos' },
  { id: 'photos', label: 'Fotos' },
  { id: 'articles', label: 'Artículos' },
  { id: 'reviews', label: 'Reseñas' },
]

/**
 * Tira de secciones del perfil. Las pestañas cambian SOLO el bloque superior;
 * "Foto o Reel" y el feed de posts se renderizan de forma persistente debajo
 * (en `ProfileLayout`).
 */
export function SectionTabs({ service }: SectionTabsProps) {
  const [active, setActive] = useState<TabId>('about')

  const photos = service.media.filter((m) => m.type === ServiceMediaType.IMAGE)
  const videos = service.media.filter((m) => m.type === ServiceMediaType.VIDEO)

  return (
    <div className="space-y-4">
      {/* Tab strip */}
      <div
        role="tablist"
        aria-label="Secciones del perfil"
        className="flex flex-wrap items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === active
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(tab.id)}
              className={cn(
                'inline-flex items-center rounded-xl px-3 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-700',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Active panel */}
      <div>
        {active === 'about' && <AboutService service={service} />}

        {active === 'professional' && <ProfessionalProfilePanel service={service} />}

        {active === 'videos' &&
          (videos.length > 0 ? (
            <ServiceMediaGallery media={videos} serviceName={service.name} />
          ) : (
            <EmptyPanel title="Videos" message="Este servicio aún no tiene videos." />
          ))}

        {active === 'photos' &&
          (photos.length > 0 ? (
            <ServiceMediaGallery media={photos} serviceName={service.name} />
          ) : (
            <EmptyPanel title="Fotos" message="Este servicio aún no tiene fotos." />
          ))}

        {active === 'articles' && (
          <ComingSoonPanel title="Artículos" message="Pronto este profesional podrá publicar artículos." />
        )}

        {active === 'reviews' && (
          <ServiceReviews
            serviceId={service.id}
            ownerId={service.userId}
            reviews={service.reviews}
            averageRating={service.averageRating}
            totalReviews={service._count.reviews}
          />
        )}
      </div>
    </div>
  )
}

function ProfessionalProfilePanel({ service }: { service: ProfessionalService }) {
  const username = service.user?.username

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
        <h2 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Perfil Profesional</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {service.user
            ? `Conoce la trayectoria, títulos y experiencia de ${getUserDisplayName(service.user)}.`
            : 'Conoce la trayectoria, títulos y experiencia del profesional.'}
        </p>

        {username && (
          <Link
            href={`/feed/professional-profile/${username}`}
            className="mt-4 inline-block rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-600"
          >
            Ver perfil profesional
          </Link>
        )}
      </div>

      {/* CV descargable (se oculta solo si no hay archivo o el flag está apagado) */}
      {service.cvUrl && <ServiceCV cvUrl={service.cvUrl} serviceName={service.name} />}
    </div>
  )
}

function EmptyPanel({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-neutral-800">
      <h2 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">{message}</p>
    </div>
  )
}

function ComingSoonPanel({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center dark:border-neutral-700">
      <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase dark:text-neutral-400">Próximamente</p>
      <h2 className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{message}</p>
    </div>
  )
}

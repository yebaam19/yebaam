import Link from 'next/link'
import Image from 'next/image'
import { MapPin, GraduationCap } from 'lucide-react'
import type { School } from '../../types'

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

function cfImageUrl(id: string | null) {
  if (!id || !CF_HASH) return null
  return `https://imagedelivery.net/${CF_HASH}/${id}/public`
}

const CATEGORY_LABELS: Record<string, string> = {
  MUSIC: 'Música',
  ARTS: 'Artes Plásticas',
  DANCE: 'Danza',
  THEATER: 'Teatro',
  MULTIDISCIPLINARY: 'Multidisciplinario',
}

interface Props {
  school: School
}

export function SchoolCard({ school }: Props) {
  const coverUrl = cfImageUrl(school.cover_cf_image_id) ?? cfImageUrl(school.profile_cf_image_id)

  return (
    <article className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      {/* Cover */}
      <div className="relative h-44 overflow-hidden bg-primary-50">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={`Portada de ${school.name}`}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
            <GraduationCap size={48} className="text-primary-300" aria-hidden="true" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" aria-hidden="true" />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-neutral-800 backdrop-blur-sm">
            {CATEGORY_LABELS[school.category] ?? school.category}
          </span>
          {school.is_verified && (
            <span className="rounded-full bg-primary-800/90 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
              Verificada
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="line-clamp-1 text-base font-black text-neutral-900">{school.name}</h3>

        <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
          <MapPin size={12} aria-hidden="true" />
          <span>{school.city || 'Sin ubicación'}</span>
        </p>

        {school.description && (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-neutral-500">{school.description}</p>
        )}

        <Link
          href={`/escuelas/${school.slug}` as never}
          className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-2xl border border-neutral-200 bg-white text-sm font-bold text-neutral-800 transition hover:border-primary-700 hover:bg-primary-50 hover:text-primary-700"
        >
          Ver escuela
        </Link>
      </div>
    </article>
  )
}

/** Skeleton para estados de carga client-side */
export function SchoolCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="h-44 animate-pulse bg-neutral-200" />
      <div className="space-y-3 p-5">
        <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-200" />
        <div className="h-3 w-full animate-pulse rounded bg-neutral-200" />
        <div className="mt-4 h-9 animate-pulse rounded-xl bg-neutral-200" />
      </div>
    </div>
  )
}

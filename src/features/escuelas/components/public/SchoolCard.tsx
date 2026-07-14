import Link from 'next/link'
import Image from 'next/image'
import { MapPin } from 'lucide-react'
import type { School } from '../../types'
import { cfImageUrl } from '@/lib/cloudflare'

const CATEGORY_LABELS: Record<string, string> = {
  MUSIC:             'Música',
  ARTS:              'Artes Plásticas',
  DANCE:             'Danza',
  THEATER:           'Teatro',
  MULTIDISCIPLINARY: 'Multidisciplinario',
}

const CATEGORY_EMOJI: Record<string, string> = {
  MUSIC:             '🎵',
  ARTS:              '🎨',
  DANCE:             '💃',
  THEATER:           '🎭',
  MULTIDISCIPLINARY: '✨',
}

interface Props { school: School }

export function SchoolCard({ school }: Props) {
  const coverUrl = cfImageUrl(school.cover_cf_image_id) ?? cfImageUrl(school.profile_cf_image_id)
  const emoji = CATEGORY_EMOJI[school.category] ?? '🎓'
  const label = CATEGORY_LABELS[school.category] ?? school.category

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] ring-1 ring-neutral-950/5 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]">

      {/* Full-card link — increases tap/click target to 100% of the card */}
      <Link
        href={`/escuelas/${school.slug}` as never}
        className="absolute inset-0 z-10"
        aria-label={`Ver ${school.name}`}
      />

      {/* Cover */}
      <div className="relative h-44 overflow-hidden bg-linear-to-br from-primary-50 to-primary-100 sm:h-48">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={`Portada de ${school.name}`}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-5xl opacity-40" aria-hidden="true">{emoji}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-neutral-950/55 via-neutral-950/10 to-transparent" />

        {/* Category + verified */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-neutral-800 backdrop-blur-sm shadow-sm">
            <span aria-hidden="true">{emoji}</span>
            {label}
          </span>
          {school.is_verified && (
            <span className="rounded-full bg-primary-700 px-2 py-0.5 text-xs font-semibold text-white shadow-sm">
              ✓
            </span>
          )}
        </div>

        {/* Name + city over gradient */}
        <div className="absolute bottom-3 left-3 right-3 min-w-0">
          <h3 className="line-clamp-1 text-base font-bold leading-tight text-white drop-shadow-sm">
            {school.name}
          </h3>
          {school.city && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-white/80">
              <MapPin size={11} aria-hidden="true" />
              <span className="truncate">{school.city}</span>
            </p>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {school.description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-neutral-500">
            {school.description}
          </p>
        ) : (
          <p className="text-sm italic text-neutral-400">Explora su propuesta académica.</p>
        )}
        <div className="mt-4">
          <span className="relative z-20 inline-flex w-full items-center justify-center rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition group-hover:bg-neutral-800">
            Ver escuela
          </span>
        </div>
      </div>
    </article>
  )
}

export function SchoolCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-950/5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="h-44 animate-pulse bg-neutral-100 sm:h-48" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded-lg bg-neutral-100" />
        <div className="h-4 w-full animate-pulse rounded-lg bg-neutral-100" />
        <div className="mt-4 h-10 animate-pulse rounded-xl bg-neutral-100" />
      </div>
    </div>
  )
}

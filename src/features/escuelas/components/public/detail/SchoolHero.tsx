import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Monitor, GraduationCap, Star, CheckCircle, ArrowLeft } from 'lucide-react'
import type { SchoolDetail } from '../../../types'

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''
export function cfImageUrl(id: string | null): string | null {
  if (!id) return null
  return `https://imagedelivery.net/${CF_HASH}/${id}/public`
}

const MODALITY_MAP: Record<string, string> = {
  PRESENTIAL: 'Presencial', VIRTUAL: 'Virtual', HYBRID: 'Híbrido',
}

interface Props {
  school: SchoolDetail
  onLeadForm: () => void
  onTrialForm: () => void
}

export function SchoolHero({ school, onLeadForm, onTrialForm }: Props) {
  const coverUrl = cfImageUrl(school.cover_cf_image_id)
  const profileUrl = cfImageUrl(school.profile_cf_image_id)
  const programs = school.programs ?? []
  const reviews = school.reviews ?? []
  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : null

  const modalitySet = new Set(programs.map((p) => p.modality))
  const modalitySummary = modalitySet.size
    ? Array.from(modalitySet).map((m) => MODALITY_MAP[m] ?? m).join(' · ')
    : null

  return (
    <section className="mx-auto max-w-7xl px-5 pb-8 sm:px-6 lg:px-8">
      {/* Cover */}
      <div className="relative h-48 overflow-hidden rounded-b-lg bg-primary-100 sm:h-64 lg:h-72">
        {coverUrl ? (
          <Image src={coverUrl} alt={`Portada de ${school.name}`} fill className="object-cover" sizes="100vw" priority />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-primary-800 to-primary-700">
            <GraduationCap size={48} className="text-white/40" />
          </div>
        )}
        {/* Back link */}
        <Link
          href={'/escuelas' as never}
          className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-neutral-700 backdrop-blur-sm transition hover:bg-white"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Escuelas
        </Link>
      </div>

      {/* Identity card */}
      <div className="relative mx-auto -mt-14 max-w-6xl rounded-xl border border-primary-100 bg-white/95 p-5 shadow-xl backdrop-blur sm:p-7">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          {/* Name + meta */}
          <div className="flex gap-4">
            <div className="relative shrink-0">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-primary-50 bg-primary-50 text-xl font-black text-primary-700 sm:h-20 sm:w-20">
                {profileUrl ? (
                  <Image src={profileUrl} alt={school.name} fill className="object-cover" sizes="80px" />
                ) : (
                  school.name?.charAt(0) ?? '?'
                )}
              </div>
              {school.is_verified && (
                <span className="absolute -right-1 bottom-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary-700 text-white shadow">
                  <CheckCircle size={14} />
                </span>
              )}
            </div>

            <div className="min-w-0">
              <h1 className="text-3xl font-black leading-tight tracking-tight text-neutral-950 sm:text-4xl">
                {school.name}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-500">{school.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-neutral-500">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} className="text-primary-700" />{school.city}
                </span>
                {modalitySummary && (
                  <span className="inline-flex items-center gap-1.5">
                    <Monitor size={14} className="text-primary-700" />{modalitySummary}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap size={14} className="text-primary-700" />{programs.length} cursos
                </span>
                {avgRating !== null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Star size={14} className="text-amber-500" />
                    {avgRating} ({reviews.length} reseñas)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button onClick={onLeadForm}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary-700 px-5 text-sm font-bold text-white transition hover:bg-primary-800">
              {school.primary_cta_label || 'Más información'}
            </button>
            {school.trial_class_message && (
              <button onClick={onTrialForm}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-primary-200 bg-white px-5 text-sm font-bold text-neutral-950 transition hover:border-primary-700 hover:text-primary-700">
                {school.secondary_cta_label || 'Clase de prueba'}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, ShieldCheck, Eye, Heart } from 'lucide-react'
import type { ArtistProfile } from '../../types'

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

function cfImageUrl(id: string | null) {
  if (!id || !CF_HASH) return null
  return `https://imagedelivery.net/${CF_HASH}/${id}/public`
}

const ARTIST_TYPE_MAP: Record<string, string> = {
  SINGER: 'Cantante', MUSICIAN: 'Músico', DANCER: 'Bailarín/a', ACTOR: 'Actor/Actriz',
  VISUAL_ARTIST: 'Artista visual', PHOTOGRAPHER: 'Fotógrafo/a', FILMMAKER: 'Realizador/a',
  WRITER: 'Escritor/a', PRODUCER: 'Productor/a', DJ: 'DJ', COMEDIAN: 'Comediante',
  PERFORMER: 'Performer', MAKEUP_ARTIST: 'Maquillaje', FASHION_DESIGNER: 'Moda',
  MULTIDISCIPLINARY: 'Multidisciplinar', MODEL: 'Modelo', OTHER: 'Artista',
}

interface Props {
  artist: ArtistProfile
}

export function ArtistCard({ artist }: Props) {
  const coverUrl = cfImageUrl(artist.cover_cf_image_id)
  const profileUrl = cfImageUrl(artist.profile_cf_image_id)
  const initials = artist.stage_name.charAt(0).toUpperCase()

  return (
    <Link
      href={`/artistas/${artist.slug}` as never}
      className="group block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-700 focus-visible:ring-offset-2"
      aria-label={`Ver perfil de ${artist.stage_name}`}
    >
      {/* Cover */}
      <div className="relative h-36 overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt=""
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary-50 to-primary-100" aria-hidden="true" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/50 to-transparent" aria-hidden="true" />
        {artist.is_featured && (
          <span className="absolute right-3 top-3 rounded-full bg-secondary-700 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
            Destacado
          </span>
        )}
      </div>

      <div className="p-4">
        {/* Avatar + verified badge row */}
        <div className="-mt-10 mb-3 flex items-end justify-between">
          <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-white shadow-sm ring-2 ring-primary-700/20">
            {profileUrl ? (
              <Image
                src={profileUrl}
                alt={artist.stage_name}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-primary-50 text-lg font-black text-primary-700">
                {initials}
              </div>
            )}
          </div>
          {artist.is_verified && (
            <span
              title="Perfil verificado"
              aria-label="Perfil verificado"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-800 text-white shadow-sm"
            >
              <ShieldCheck size={14} aria-hidden="true" />
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="text-base font-black leading-tight text-neutral-900">{artist.stage_name}</h3>

        {/* Location */}
        <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
          <MapPin size={12} aria-hidden="true" />
          <span>{artist.city}{artist.country ? `, ${artist.country}` : ''}</span>
        </p>

        {/* Bio */}
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-neutral-500">
          {artist.short_bio ?? artist.biography ?? 'Sin descripción aún.'}
        </p>

        {/* Artist type badge */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-primary-700 px-2.5 py-0.5 text-xs font-semibold text-white">
            {ARTIST_TYPE_MAP[artist.artist_type] ?? artist.artist_type}
          </span>
        </div>

        {/* Stats */}
        {(artist.profile_views > 0 || artist.follower_count > 0) && (
          <div className="mt-3 flex gap-3 border-t border-neutral-200 pt-3 text-xs text-neutral-500">
            {artist.profile_views > 0 && (
              <span className="flex items-center gap-1">
                <Eye size={11} aria-hidden="true" />
                <span aria-label={`${artist.profile_views} vistas`}>{artist.profile_views}</span>
              </span>
            )}
            {artist.follower_count > 0 && (
              <span className="flex items-center gap-1">
                <Heart size={11} aria-hidden="true" />
                <span aria-label={`${artist.follower_count} seguidores`}>{artist.follower_count}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

/** Skeleton para filtrado client-side */
export function ArtistCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="h-36 animate-pulse bg-neutral-200" />
      <div className="p-4 space-y-3">
        <div className="-mt-10 h-16 w-16 animate-pulse rounded-full bg-neutral-200" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-200" />
        <div className="h-3 w-full animate-pulse rounded bg-neutral-200" />
      </div>
    </div>
  )
}

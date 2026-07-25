import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Globe, ShieldCheck, Eye, Heart, Briefcase, ArrowLeft } from 'lucide-react'
import type { ArtistProfileDetail } from '../../../types'

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''
export function cfImageUrl(id: string | null): string | null {
  if (!id) return null
  return `https://imagedelivery.net/${CF_HASH}/${id}/public`
}

const ARTIST_TYPE_MAP: Record<string, string> = {
  SINGER: 'Cantante', MUSICIAN: 'Músico', DANCER: 'Bailarín/a', ACTOR: 'Actor/Actriz',
  VISUAL_ARTIST: 'Artista visual', PHOTOGRAPHER: 'Fotógrafo/a', FILMMAKER: 'Realizador/a',
  WRITER: 'Escritor/a', PRODUCER: 'Productor/a', DJ: 'DJ', COMEDIAN: 'Comediante',
  PERFORMER: 'Performer', MODEL: 'Modelo', MAKEUP_ARTIST: 'Maquillador/a',
  FASHION_DESIGNER: 'Diseñador/a moda', MULTIDISCIPLINARY: 'Multidisciplinar', OTHER: 'Artista',
}

interface Props { artist: ArtistProfileDetail }

export function ArtistHeader({ artist }: Props) {
  const coverUrl = cfImageUrl(artist.cover_cf_image_id)
  const profileUrl = cfImageUrl(artist.profile_cf_image_id)
  const initials = (artist.stage_name ?? '').trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || '?'

  return (
    <div className="relative">
      {/* Cover */}
      <div className="relative h-56 overflow-hidden bg-linear-to-br from-primary-800 via-primary-700 to-neutral-900 md:h-72">
        {coverUrl && (
          <Image src={coverUrl} alt={`Portada de ${artist.stage_name}`} fill className="object-cover" sizes="100vw" priority unoptimized />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-neutral-950/80 via-neutral-950/30 to-transparent" />
        {/* Back link */}
        <Link href={'/artistas' as never}
          className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/25">
          <ArrowLeft size={14} /> Artistas
        </Link>
      </div>

      {/* Identity bar */}
      <div className="relative border-b border-primary-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 pb-5 sm:px-6">
          <div className="-mt-14 flex flex-wrap items-end justify-between gap-4 sm:-mt-16">
            {/* Avatar */}
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-primary-50 text-lg font-black text-primary-700 shadow-xl ring-2 ring-primary-700/20 sm:h-28 sm:w-28">
              {profileUrl ? (
                <Image src={profileUrl} alt={artist.stage_name} fill className="object-cover" sizes="112px" unoptimized />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            {/* Verified */}
            {artist.is_verified && (
              <div className="flex items-center gap-1.5 rounded-full border border-primary-700/30 bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-800">
                <ShieldCheck size={14} /> Perfil verificado
              </div>
            )}
          </div>

          {/* Name + meta */}
          <div className="mt-4">
            <h1 className="text-2xl font-black text-neutral-950 md:text-3xl">{artist.stage_name}</h1>
            {artist.legal_name && artist.legal_name !== artist.stage_name && (
              <p className="text-sm text-neutral-500">{artist.legal_name}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-neutral-500">
              <span className="flex items-center gap-1.5">
                <MapPin size={14} className="text-primary-700" />{artist.city}, {artist.country}
              </span>
              {artist.website && (
                <a href={artist.website} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 font-semibold text-primary-700 hover:underline">
                  <Globe size={14} /> Sitio web
                </a>
              )}
            </div>

            {/* Badges */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-primary-700 px-2.5 py-0.5 text-xs font-semibold text-white">
                {ARTIST_TYPE_MAP[artist.artist_type] ?? artist.artist_type}
              </span>
              {(artist.disciplines ?? []).map((d) => (
                <span key={d.id} className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-800 border border-primary-200">
                  {d.name}
                </span>
              ))}
              {artist.is_featured && (
                <span className="rounded-full bg-secondary-700 px-2.5 py-0.5 text-xs font-bold text-white">Destacado</span>
              )}
            </div>

            {/* Stats */}
            <dl className="mt-4 flex flex-wrap gap-5 text-sm text-neutral-500">
              {artist.profile_views > 0 && (
                <div className="flex items-center gap-1.5">
                  <Eye size={15} className="text-primary-600" />
                  <dt className="sr-only">Vistas</dt><dd>{artist.profile_views} vistas</dd>
                </div>
              )}
              {artist.follower_count > 0 && (
                <div className="flex items-center gap-1.5">
                  <Heart size={15} className="text-secondary-700" />
                  <dt className="sr-only">Seguidores</dt><dd>{artist.follower_count} seguidores</dd>
                </div>
              )}
              {artist.portfolio_count > 0 && (
                <div className="flex items-center gap-1.5">
                  <Briefcase size={15} className="text-primary-700" />
                  <dt className="sr-only">Piezas</dt><dd>{artist.portfolio_count} piezas</dd>
                </div>
              )}
            </dl>
            {artist.availability && (
              <p className="mt-2 text-xs font-semibold text-neutral-500">{artist.availability}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

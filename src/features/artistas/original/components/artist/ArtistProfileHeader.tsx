import { MapPin, ShieldCheck, Globe, Eye, Heart, Briefcase } from "lucide-react";
import type { ArtistProfile } from "../../types";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";

const ARTIST_TYPE_MAP: Record<string, string> = {
  SINGER: "Cantante", MUSICIAN: "Músico", DANCER: "Bailarín/a", ACTOR: "Actor/Actriz",
  VISUAL_ARTIST: "Artista visual", PHOTOGRAPHER: "Fotógrafo/a", FILMMAKER: "Realizador/a",
  WRITER: "Escritor/a", PRODUCER: "Productor/a", DJ: "DJ", COMEDIAN: "Comediante",
  PERFORMER: "Performer", MODEL: "Modelo", MULTIDISCIPLINARY: "Multidisciplinar", OTHER: "Artista"
};

export function ArtistProfileHeader({ artist }: { artist: ArtistProfile }) {
  return (
    <div className="relative">
      {/* Cover */}
      <div className="relative h-56 overflow-hidden bg-brand-hero md:h-72">
        {artist.coverImageUrl ? (
          <img src={artist.coverImageUrl} alt={`Portada de ${artist.stageName}`} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-brand-hero" aria-hidden="true" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-brand-dark/30 to-transparent" aria-hidden="true" />
      </div>

      {/* Identity bar */}
      <div className="relative bg-white border-b border-brand-border">
        <div className="mx-auto max-w-7xl px-4 pb-5 sm:px-6">
          {/* Avatar floating over cover */}
          <div className="-mt-14 flex flex-wrap items-end justify-between gap-4 sm:-mt-16">
            <div className="flex items-end gap-4">
              <Avatar
                src={artist.profileImageUrl}
                name={artist.stageName}
                className="h-24 w-24 shrink-0 border-4 border-white shadow-card text-xl ring-2 ring-brand-green/20 sm:h-28 sm:w-28"
                aria-label={`Foto de perfil de ${artist.stageName}`}
              />
            </div>

            {/* Verification badge */}
            {artist.isVerified && (
              <div className="flex items-center gap-1.5 rounded-full bg-brand-mintLight px-3 py-1.5 text-xs font-bold text-brand-dark border border-brand-green/30" aria-label="Perfil verificado">
                <ShieldCheck size={14} aria-hidden="true" /> Perfil verificado
              </div>
            )}
          </div>

          {/* Name + meta */}
          <div className="mt-4">
            <div className="flex flex-wrap items-start gap-3">
              <div>
                <h1 className="text-2xl font-black text-brand-ink md:text-3xl">{artist.stageName}</h1>
                {artist.legalName && artist.legalName !== artist.stageName && (
                  <p className="text-sm text-brand-muted">{artist.legalName}</p>
                )}
              </div>
            </div>

            {/* Location + type */}
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm text-brand-muted">
                <MapPin size={14} className="text-brand-greenDark" aria-hidden="true" />
                {artist.city}, {artist.country}
              </span>
              {artist.website && (
                <a
                  href={artist.website}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-1.5 rounded text-sm font-semibold text-brand-greenDark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark"
                  aria-label={`Sitio web de ${artist.stageName} (abre en pestaña nueva)`}
                >
                  <Globe size={14} aria-hidden="true" /> Sitio web
                </a>
              )}
            </div>

            {/* Badges */}
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Disciplinas artísticas">
              <Badge variant="green">{ARTIST_TYPE_MAP[artist.artistType] ?? artist.artistType}</Badge>
              {artist.disciplines?.map((item) => (
                <Badge key={item.discipline.id} variant="mint">{item.discipline.name}</Badge>
              ))}
              {artist.isFeatured && <Badge variant="orange">Destacado</Badge>}
            </div>

            {/* Stats */}
            <dl className="mt-4 flex flex-wrap gap-5 text-sm text-brand-muted">
              {artist.profileViews > 0 && (
                <div className="flex items-center gap-1.5">
                  <Eye size={15} className="text-brand-greenSoft" aria-hidden="true" />
                  <dt className="sr-only">Vistas</dt>
                  <dd>{artist.profileViews} vistas</dd>
                </div>
              )}
              {artist.followerCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Heart size={15} className="text-brand-orange" aria-hidden="true" />
                  <dt className="sr-only">Seguidores</dt>
                  <dd>{artist.followerCount} seguidores</dd>
                </div>
              )}
              {artist.portfolioCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Briefcase size={15} className="text-brand-greenDark" aria-hidden="true" />
                  <dt className="sr-only">Piezas de portafolio</dt>
                  <dd>{artist.portfolioCount} piezas</dd>
                </div>
              )}
            </dl>

            {/* Availability */}
            {artist.availability && (
              <p className="mt-2 text-xs font-semibold text-brand-muted">{artist.availability}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

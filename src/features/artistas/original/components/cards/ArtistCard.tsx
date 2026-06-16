import { Link } from "react-router-dom";
import { MapPin, ShieldCheck, Eye, Heart } from "lucide-react";
import type { ArtistProfile } from "../../types";
import { Badge } from "../ui/Badge";
import { Avatar } from "../ui/Avatar";

const ARTIST_TYPE_MAP: Record<string, string> = {
  SINGER: "Cantante", MUSICIAN: "Músico", DANCER: "Bailarín/a", ACTOR: "Actor/Actriz",
  VISUAL_ARTIST: "Artista visual", PHOTOGRAPHER: "Fotógrafo/a", FILMMAKER: "Realizador/a",
  WRITER: "Escritor/a", PRODUCER: "Productor/a", DJ: "DJ", COMEDIAN: "Comediante",
  PERFORMER: "Performer", MAKEUP_ARTIST: "Maquillaje", FASHION_DESIGNER: "Moda",
  MULTIDISCIPLINARY: "Multidisciplinar", MODEL: "Modelo", OTHER: "Artista"
};

export function ArtistCard({ artist }: { artist: ArtistProfile }) {
  return (
    <Link
      to={`/artists/${artist.slug}`}
      className="group block rounded-2xl border border-brand-border bg-white shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-hover overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark focus-visible:ring-offset-2"
      aria-label={`Ver perfil de ${artist.stageName}`}
    >
      {/* Cover */}
      <div className="relative h-36 bg-brand-hero overflow-hidden">
        {artist.coverImageUrl ? (
          <img src={artist.coverImageUrl} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full bg-brand-hero" aria-hidden="true" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/50 to-transparent" aria-hidden="true" />
        {artist.isFeatured && (
          <span className="absolute right-3 top-3 rounded-full bg-brand-orange px-2.5 py-0.5 text-xs font-bold text-white shadow-orange">
            Destacado
          </span>
        )}
      </div>

      <div className="p-4">
        {/* Avatar + verified */}
        <div className="-mt-10 mb-3 flex items-end justify-between">
          <Avatar
            src={artist.profileImageUrl}
            name={artist.stageName}
            className="h-16 w-16 border-2 border-white shadow-card text-base ring-2 ring-brand-green/20"
            aria-hidden="true"
          />
          {artist.isVerified && (
            <span title="Perfil verificado" aria-label="Perfil verificado" className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-greenDark text-white shadow-green">
              <ShieldCheck size={14} aria-hidden="true" />
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="text-base font-black text-brand-ink leading-tight">{artist.stageName}</h3>

        {/* Location */}
        <p className="mt-1 flex items-center gap-1 text-xs text-brand-muted">
          <MapPin size={12} aria-hidden="true" />
          <span>{artist.city}, {artist.country}</span>
        </p>

        {/* Bio */}
        <p className="mt-2 line-clamp-2 text-xs text-brand-muted leading-relaxed">
          {artist.shortBio ?? artist.biography}
        </p>

        {/* Badges */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge variant="green">{ARTIST_TYPE_MAP[artist.artistType] ?? artist.artistType}</Badge>
          {artist.disciplines?.slice(0, 2).map((item) => (
            <Badge key={item.discipline.id} variant="mint">{item.discipline.name}</Badge>
          ))}
        </div>

        {/* Stats */}
        {(artist.profileViews > 0 || artist.followerCount > 0) && (
          <div className="mt-3 flex gap-3 border-t border-brand-border pt-3 text-xs text-brand-muted">
            {artist.profileViews > 0 && (
              <span className="flex items-center gap-1">
                <Eye size={11} aria-hidden="true" />
                <span aria-label={`${artist.profileViews} vistas`}>{artist.profileViews}</span>
              </span>
            )}
            {artist.followerCount > 0 && (
              <span className="flex items-center gap-1">
                <Heart size={11} aria-hidden="true" />
                <span aria-label={`${artist.followerCount} seguidores`}>{artist.followerCount}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

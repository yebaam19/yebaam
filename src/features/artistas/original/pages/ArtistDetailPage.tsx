import { Link, useParams } from "react-router-dom";
import { ExternalLink, Calendar, Award, BookOpen, Music, Send, BookmarkPlus, Heart, Flag } from "lucide-react";
import { useArtistDetail } from "../hooks/useArtistDetail";
import { ArtistProfileHeader } from "../components/artist/ArtistProfileHeader";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { SectionHeader } from "../components/ui/SectionHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/ErrorState";
import { formatCurrency } from "../lib/formatters";

const MEDIA_LABEL: Record<string, string> = {
  IMAGE: "Imagen", VIDEO: "Video", AUDIO: "Audio", DOCUMENT: "Documento", LINK: "Enlace"
};
const MEDIA_BADGE_VARIANT: Record<string, "green" | "orange" | "gold" | "mint" | "default"> = {
  IMAGE: "mint", VIDEO: "orange", AUDIO: "gold", DOCUMENT: "default", LINK: "green"
};

const actionLinkBase =
  "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark focus-visible:ring-offset-2";
const primaryActionLink = `${actionLinkBase} bg-brand-greenDark text-white shadow-green hover:bg-brand-greenDeep`;
const secondaryActionLink = `${actionLinkBase} border border-brand-green/30 bg-brand-mintLight text-brand-dark hover:bg-[#d4f1de]`;
const outlineActionLink = `${actionLinkBase} border border-brand-green text-brand-dark bg-white hover:bg-brand-mintLight`;
const ghostActionLink = `${actionLinkBase} bg-transparent text-brand-muted hover:bg-brand-mintLight hover:text-brand-ink`;

export function ArtistDetailPage() {
  const { slug = "" } = useParams();
  const { data: artist, isLoading, error, refetch } = useArtistDetail(slug);

  if (isLoading) {
    return (
      <div aria-busy="true" aria-label="Cargando perfil del artista">
        <Skeleton className="h-72" />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }
  if (error) return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><ErrorState description={error} onRetry={refetch} /></div>;
  if (!artist) return <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6"><EmptyState title="Perfil no encontrado" description="Este perfil no existe o fue removido." /></div>;

  return (
    <div className="bg-brand-bg">
      <ArtistProfileHeader artist={artist} />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">

          {/* LEFT COLUMN */}
          <div className="space-y-10">

            {/* BIOGRAPHY */}
            {artist.biography && (
              <section aria-labelledby="bio-heading">
                <SectionHeader title="Biografía" />
                <h2 id="bio-heading" className="sr-only">Biografía</h2>
                <Card className="p-6">
                  <p className="leading-relaxed text-brand-muted whitespace-pre-wrap">{artist.biography}</p>
                </Card>
              </section>
            )}

            {/* PORTFOLIO */}
            <section aria-labelledby="portfolio-heading">
              <SectionHeader
                title="Portafolio multimedia"
                description="Muestra de obra, presentaciones y colaboraciones destacadas."
              />
              <h2 id="portfolio-heading" className="sr-only">Portafolio multimedia</h2>
              {artist.portfolioItems?.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {artist.portfolioItems.map((item) => (
                    <Card key={item.id} hover className="overflow-hidden">
                      <div className="relative h-44 bg-brand-hero overflow-hidden">
                        {item.thumbnailUrl ? (
                          <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover transition hover:scale-105" />
                        ) : (
                          <div className="flex h-full items-center justify-center bg-brand-mintLight" aria-hidden="true">
                            <Music size={32} className="text-brand-greenDark" />
                          </div>
                        )}
                        {item.isFeatured && (
                          <span className="absolute right-2 top-2 rounded-full bg-brand-orange px-2 py-0.5 text-xs font-bold text-brand-ink">Destacada</span>
                        )}
                      </div>
                      <div className="p-4">
                        <Badge variant={MEDIA_BADGE_VARIANT[item.mediaType] ?? "default"} className="mb-2">
                          {MEDIA_LABEL[item.mediaType] ?? item.mediaType}
                        </Badge>
                        <h3 className="font-black text-brand-ink">{item.title}</h3>
                        {item.description && <p className="mt-1.5 text-sm text-brand-muted line-clamp-2">{item.description}</p>}
                        {item.tags?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1" aria-label="Etiquetas">
                            {item.tags.map((tag) => <Badge key={tag} variant="mint">{tag}</Badge>)}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState title="Sin piezas de portafolio" description="Este artista no ha publicado portafolio aún." />
              )}
            </section>

            {/* EXPERIENCE */}
            {artist.experiences?.length ? (
              <section aria-labelledby="experience-heading">
                <SectionHeader title="Experiencia" />
                <h2 id="experience-heading" className="sr-only">Experiencia</h2>
                <div className="space-y-3">
                  {artist.experiences.map((exp) => (
                    <Card key={exp.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-mintLight text-brand-greenDark" aria-hidden="true">
                          <Calendar size={16} />
                        </div>
                        <div>
                          <h3 className="font-bold text-brand-ink">{exp.title}</h3>
                          {exp.organization && <p className="text-sm font-medium text-brand-muted">{exp.organization}</p>}
                          {exp.description && <p className="mt-1 text-sm text-brand-muted">{exp.description}</p>}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            ) : null}

            {/* ACHIEVEMENTS */}
            {artist.achievements?.length ? (
              <section aria-labelledby="achievements-heading">
                <SectionHeader title="Logros y reconocimientos" />
                <h2 id="achievements-heading" className="sr-only">Logros y reconocimientos</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {artist.achievements.map((ach) => (
                    <Card key={ach.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-amber-600" aria-hidden="true">
                          <Award size={16} />
                        </div>
                        <div>
                          <h3 className="font-bold text-brand-ink">{ach.title}</h3>
                          {ach.issuer && <p className="text-sm text-brand-muted">{ach.issuer}</p>}
                          {ach.description && <p className="mt-1 text-sm text-brand-muted">{ach.description}</p>}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            ) : null}

            {/* FORMATION */}
            {artist.educations?.length ? (
              <section aria-labelledby="education-heading">
                <SectionHeader title="Formación" />
                <h2 id="education-heading" className="sr-only">Formación</h2>
                <div className="space-y-3">
                  {artist.educations.map((edu) => (
                    <Card key={edu.id} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-mintLight text-brand-greenDark" aria-hidden="true">
                          <BookOpen size={16} />
                        </div>
                        <div>
                          <h3 className="font-bold text-brand-ink">{edu.title}</h3>
                          {edu.institution && <p className="text-sm font-medium text-brand-muted">{edu.institution}</p>}
                          {edu.description && <p className="mt-1 text-sm text-brand-muted">{edu.description}</p>}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            ) : null}

            {/* REVIEWS */}
            {artist.reviews?.length ? (
              <section aria-labelledby="reviews-heading">
                <SectionHeader title="Reseñas de la comunidad" />
                <h2 id="reviews-heading" className="sr-only">Reseñas de la comunidad</h2>
                <div className="space-y-3">
                  {artist.reviews.map((review) => (
                    <Card key={review.id} className="p-4">
                      <div className="mb-2 flex items-center gap-1" aria-label={`Valoración: ${review.rating} de 5 estrellas`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={i < review.rating ? "text-brand-gold" : "text-brand-border"} aria-hidden="true">★</span>
                        ))}
                        {review.title && <span className="ml-2 text-sm font-semibold text-brand-ink">{review.title}</span>}
                      </div>
                      <p className="text-sm text-brand-muted">{review.comment}</p>
                      {review.reviewer && (
                        <p className="mt-2 text-xs text-brand-muted">— {review.reviewer.displayName}</p>
                      )}
                    </Card>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-5" aria-label="Acciones y datos del artista">

            {/* ACTIONS */}
            <Card className="p-5">
              <h2 className="mb-4 font-black text-brand-ink">Conectar</h2>
              <div className="space-y-2">
                <Link to="/login" className={primaryActionLink}>
                  <Send size={15} aria-hidden="true" />
                  Solicitar booking
                </Link>
                <Link to="/login" className={secondaryActionLink}>
                  <Heart size={15} aria-hidden="true" />
                  Seguir artista
                </Link>
                <Link to="/login" className={outlineActionLink}>
                  <BookmarkPlus size={15} aria-hidden="true" />
                  Guardar perfil
                </Link>
                <Link to="/login" className={ghostActionLink}>
                  <Send size={15} aria-hidden="true" />
                  Proponer colaboración
                </Link>
              </div>
            </Card>

            {/* SERVICES */}
            {artist.services?.length ? (
              <Card className="p-5">
                <h2 className="mb-4 font-black text-brand-ink">Servicios</h2>
                <div className="space-y-4">
                  {artist.services.map((service) => (
                    <div key={service.id} className="border-b border-brand-border pb-4 last:border-0 last:pb-0">
                      <p className="font-bold text-brand-ink text-sm">{service.title}</p>
                      {service.description && <p className="mt-1 text-xs text-brand-muted">{service.description}</p>}
                      {service.priceFrom && (
                        <p className="mt-1.5 text-sm font-black text-brand-dark">
                          Desde {formatCurrency(service.priceFrom, service.currency)}
                        </p>
                      )}
                      <Badge variant="mint" className="mt-1.5 text-xs">{service.locationMode}</Badge>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            {/* SOCIAL LINKS */}
            {artist.socialLinks?.length ? (
              <Card className="p-5">
                <h2 className="mb-4 font-black text-brand-ink">Redes y enlaces</h2>
                <div className="space-y-2">
                  {artist.socialLinks.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex items-center justify-between rounded-xl bg-brand-bgGreen px-4 py-2.5 text-sm font-semibold text-brand-ink transition hover:bg-brand-mintLight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark"
                      aria-label={`${link.platform} (abre en pestaña nueva)`}
                    >
                      <span>{link.platform}</span>
                      <ExternalLink size={13} className="text-brand-muted" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </Card>
            ) : null}

            {/* REPORT */}
            <div className="text-center">
              <Link to="/login" className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-brand-muted transition hover:bg-brand-mintLight hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark">
                <Flag size={12} aria-hidden="true" />
                Reportar este perfil
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

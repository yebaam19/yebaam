import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  Camera,
  CalendarDays,
  Image,
  MapPin,
  Mic,
  Music,
  Palette,
  Search,
  Sparkles,
  Star,
  UserPlus,
  Users,
  Zap
} from "lucide-react";
import { useState } from "react";
import { useApiQuery } from "../hooks/useApiQuery";
import type { ArtistProfile, Campaign, EventItem, Opportunity, PortfolioItem } from "../types";
import { ArtistCard } from "../components/cards/ArtistCard";
import { OpportunityCard } from "../components/cards/OpportunityCard";
import { ContentCard } from "../components/cards/ContentCard";
import { YebaamLogo } from "../components/brand/YebaamLogo";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { SectionHeader } from "../components/ui/SectionHeader";
import { Skeleton, SkeletonCard } from "../components/ui/Skeleton";

type HomeData = {
  featuredArtists: ArtistProfile[];
  recentArtists: ArtistProfile[];
  mostViewedArtists: ArtistProfile[];
  featuredPortfolio: PortfolioItem[];
  upcomingEvents: EventItem[];
  activeCampaigns: Campaign[];
  openOpportunities: Opportunity[];
  categories: Array<{ id: string; name: string; description?: string | null; color?: string | null; icon?: string | null }>;
};

const CATEGORY_ICONS = [Music, Camera, Palette, Mic];
const CATEGORY_COLORS = ["#16A44C", "#43AF64", "#EC8437", "#F7AA00"];
const SKELETON_KEYS = ["one", "two", "three", "four"];

const BENEFITS_ARTIST = [
  {
    icon: Star,
    title: "Perfil profesional",
    description: "Una vitrina curada para biografía, trayectoria, servicios, disponibilidad y marca personal."
  },
  {
    icon: Users,
    title: "Comunidad cultural",
    description: "Seguidores, managers y aliados descubren talento desde una experiencia confiable."
  },
  {
    icon: Briefcase,
    title: "Oportunidades reales",
    description: "Convocatorias, castings, colaboraciones y festivales conectados con portafolios."
  },
  {
    icon: Zap,
    title: "Marca personal",
    description: "Herramientas para presentar una identidad artística consistente en Colombia y Latinoamérica."
  }
];

const linkBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark focus-visible:ring-offset-2";
const primaryLink = `${linkBase} bg-brand-greenDark text-white shadow-green hover:bg-brand-greenDeep`;
const lightLink = `${linkBase} border border-white/25 bg-white/10 text-white hover:bg-white/20 focus-visible:ring-white`;
const outlineLink = `${linkBase} border border-brand-green/40 bg-white text-brand-greenDark hover:bg-brand-mintLight`;
const textLink =
  "inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-bold text-brand-greenDark transition hover:bg-brand-mintLight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark";

function getSearchDestination(search: string) {
  const trimmedSearch = search.trim();
  return trimmedSearch ? `/artists?search=${encodeURIComponent(trimmedSearch)}` : "/artists";
}

function PortfolioPreviewCard({ item }: { item: PortfolioItem }) {
  return (
    <Link
      to="/portfolio"
      className="group overflow-hidden rounded-2xl border border-brand-border bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark focus-visible:ring-offset-2"
      aria-label={`Ver portafolio destacado: ${item.title}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-hero">
        {item.thumbnailUrl || item.mediaUrl ? (
          <img
            src={item.thumbnailUrl ?? item.mediaUrl}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-white/70" aria-hidden="true">
            <Image size={28} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/65 via-transparent to-transparent" aria-hidden="true" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-brand-ink">
          {item.mediaType}
        </span>
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-sm font-black leading-snug text-brand-ink transition group-hover:text-brand-greenDark">
          {item.title}
        </h3>
        {item.artistProfile ? (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-brand-muted">
            <MapPin size={12} aria-hidden="true" />
            <span>{item.artistProfile.stageName}</span>
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export function HomePage() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useApiQuery<HomeData>("/home", []);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(getSearchDestination(search));
  }

  return (
    <div className="bg-brand-bg">
      <section className="relative overflow-hidden bg-brand-hero text-white" aria-labelledby="home-hero-title">
        <div className="absolute inset-0" aria-hidden="true">
          <img
            src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1800&q=80"
            alt=""
            className="h-full w-full object-cover opacity-20 mix-blend-multiply"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,31,23,0.88)_0%,rgba(16,32,22,0.70)_52%,rgba(236,132,55,0.34)_100%)]" />
        </div>

        <div className="relative mx-auto grid min-h-[640px] max-w-7xl content-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:py-24">
          <div className="max-w-3xl">
            <YebaamLogo className="mb-7 h-12 w-[190px] text-white drop-shadow" title="Yebaam" />

            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-bold text-white">
              <Sparkles size={15} aria-hidden="true" />
              PerfilArtístico por Yebaam
            </p>

            <h1 id="home-hero-title" className="text-balance text-5xl font-black leading-tight tracking-normal md:text-6xl lg:text-7xl">
              Tu talento merece una vitrina profesional
            </h1>
            <p className="mt-5 max-w-2xl text-balance text-xl font-semibold leading-relaxed text-white/86">
              Crea tu perfil artístico, muestra tu portafolio, conecta con oportunidades y haz crecer tu marca personal dentro de una comunidad creativa cercana y auténtica.
            </p>

            <form
              onSubmit={submitSearch}
              className="mt-8 max-w-2xl rounded-2xl border border-white/10 bg-white p-2 shadow-card"
              role="search"
              aria-label="Buscar talento artístico"
            >
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" aria-hidden="true" />
                  <label htmlFor="home-search" className="sr-only">
                    Buscar por artista, disciplina, ciudad o categoría
                  </label>
                  <Input
                    id="home-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Artista, disciplina, ciudad o categoría"
                    className="min-h-12 border-0 pl-10 focus:ring-brand-greenDark/25"
                    autoComplete="off"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-greenDark px-5 py-3 text-sm font-bold text-white shadow-green transition hover:bg-brand-greenDeep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark focus-visible:ring-offset-2"
                >
                  Buscar talento
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap gap-3" aria-label="Acciones principales">
              <Link to="/register" className={primaryLink}>
                <UserPlus size={18} aria-hidden="true" />
                Crear perfil artístico
              </Link>
              <Link to="/artists" className={lightLink}>
                <Sparkles size={18} aria-hidden="true" />
                Explorar artistas
              </Link>
            </div>
          </div>

          <aside className="hidden rounded-3xl border border-white/35 bg-white/92 p-5 text-brand-ink shadow-soft backdrop-blur lg:block" aria-label="Resumen de la plataforma" aria-live="polite">
            <div className="mb-5 rounded-2xl bg-brand-mintLight p-4">
              <p className="text-xs font-black uppercase tracking-widest text-brand-greenDark">Marca Yebaam</p>
              <p className="mt-2 text-sm leading-relaxed text-brand-muted">
                Una experiencia visual cálida, tecnológica y cultural para descubrir talento artístico profesional.
              </p>
            </div>
            <dl className="grid gap-4">
              <div className="rounded-xl border border-brand-border bg-white p-4">
                <dt className="text-sm font-semibold text-brand-muted">Artistas destacados</dt>
                <dd className="mt-1 text-3xl font-black text-brand-greenDark">{isLoading ? "..." : data?.featuredArtists.length ?? 0}</dd>
              </div>
              <div className="rounded-xl border border-brand-border bg-white p-4">
                <dt className="text-sm font-semibold text-brand-muted">Oportunidades abiertas</dt>
                <dd className="mt-1 text-3xl font-black text-brand-orange">{isLoading ? "..." : data?.openOpportunities.length ?? 0}</dd>
              </div>
              <div className="rounded-xl border border-brand-border bg-white p-4">
                <dt className="text-sm font-semibold text-brand-muted">Eventos próximos</dt>
                <dd className="mt-1 text-3xl font-black text-brand-greenDark">{isLoading ? "..." : data?.upcomingEvents.length ?? 0}</dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-20 px-4 py-16 sm:px-6">
        {error ? (
          <ErrorState description={error} onRetry={refetch} />
        ) : (
          <>
            <section>
              <SectionHeader
                accent="Explorar"
                title="Disciplinas artísticas"
                description="Categorías para descubrir talento por escena, formato y especialidad."
                action={
                  <Link to="/artists" className={textLink}>
                    Ver catálogo
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                }
              />
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {SKELETON_KEYS.map((key) => <Skeleton key={key} className="h-32" />)}
                </div>
              ) : data?.categories.length ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {data.categories.map((category, index) => {
                    const Icon = CATEGORY_ICONS[index % CATEGORY_ICONS.length];
                    const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];

                    return (
                      <Link
                        key={category.id}
                        to={`/artists?search=${encodeURIComponent(category.name)}`}
                        className="group relative min-h-36 overflow-hidden rounded-2xl border border-brand-border bg-white p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-greenDark"
                        aria-label={`Explorar artistas de ${category.name}`}
                      >
                        <span
                          className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-soft transition group-hover:scale-105"
                          style={{ backgroundColor: color }}
                          aria-hidden="true"
                        >
                          <Icon size={21} />
                        </span>
                        <h3 className="text-base font-black text-brand-ink">{category.name}</h3>
                        {category.description ? (
                          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-brand-muted">{category.description}</p>
                        ) : null}
                        <span className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 transition group-hover:scale-x-100" style={{ backgroundColor: color }} aria-hidden="true" />
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <EmptyState title="No hay categorías activas" />
              )}
            </section>

            <section>
              <SectionHeader
                accent="Talento"
                title="Artistas destacados"
                description="Perfiles con portafolio activo, trayectoria y presencia profesional."
                action={
                  <Link to="/artists" className={outlineLink}>
                    Ver todos
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                }
              />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {isLoading ? (
                  SKELETON_KEYS.map((key) => <SkeletonCard key={key} />)
                ) : data?.featuredArtists.length ? (
                  data.featuredArtists.slice(0, 4).map((artist) => <ArtistCard key={artist.id} artist={artist} />)
                ) : (
                  <div className="sm:col-span-2 lg:col-span-4">
                    <EmptyState title="No hay artistas destacados" description="Los perfiles destacados aparecerán aquí cuando estén disponibles." />
                  </div>
                )}
              </div>
            </section>

            <section>
              <SectionHeader
                accent="Portafolio"
                title="Obra y material multimedia"
                description="Piezas destacadas para revisar evidencia artística, visual, sonora y audiovisual."
                action={
                  <Link to="/portfolio" className={textLink}>
                    Ver portafolio
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                }
              />
              {isLoading ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {SKELETON_KEYS.map((key) => <Skeleton key={key} className="h-72" />)}
                </div>
              ) : data?.featuredPortfolio.length ? (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {data.featuredPortfolio.slice(0, 4).map((item) => <PortfolioPreviewCard key={item.id} item={item} />)}
                </div>
              ) : (
                <EmptyState title="No hay portafolios destacados" description="Las piezas destacadas aparecerán aquí cuando los artistas publiquen material." />
              )}
            </section>

            <section className="rounded-3xl bg-brand-play p-6 text-white shadow-soft sm:p-8 lg:p-10">
              <SectionHeader
                dark
                accent="Oportunidades"
                title="Convocatorias abiertas"
                description="Castings, audiciones, colaboraciones, festivales y campañas para artistas."
                action={
                  <Link to="/opportunities" className={`${linkBase} bg-white text-brand-greenDark shadow-soft hover:bg-brand-mintLight focus-visible:ring-white`}>
                    Ver todas
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                }
              />
              <div className="grid gap-5 md:grid-cols-3">
                {isLoading ? (
                  SKELETON_KEYS.slice(0, 3).map((key) => <Skeleton key={key} className="h-56 bg-white/20" />)
                ) : data?.openOpportunities.length ? (
                  data.openOpportunities.slice(0, 3).map((opportunity) => <OpportunityCard key={opportunity.id} opportunity={opportunity} />)
                ) : (
                  <div className="md:col-span-3">
                    <EmptyState title="No hay oportunidades abiertas" />
                  </div>
                )}
              </div>
            </section>

            <section className="grid gap-10 lg:grid-cols-2">
              <div>
                <SectionHeader
                  accent="Agenda"
                  title="Eventos próximos"
                  action={
                    <Link to="/events" className={textLink}>
                      Ver eventos
                      <CalendarDays size={14} aria-hidden="true" />
                    </Link>
                  }
                />
                <div className="space-y-3">
                  {isLoading ? (
                    <Skeleton className="h-56" />
                  ) : data?.upcomingEvents.length ? (
                    data.upcomingEvents.slice(0, 3).map((event) => (
                      <ContentCard
                        key={event.id}
                        to={`/events/${event.slug}`}
                        title={event.title}
                        description={event.description}
                        image={event.coverImageUrl}
                        date={event.startsAt}
                        badge="Evento"
                      />
                    ))
                  ) : (
                    <EmptyState title="No hay eventos próximos" description="Los eventos publicados aparecerán aquí." />
                  )}
                </div>
              </div>

              <div>
                <SectionHeader
                  accent="Campañas"
                  title="Campañas activas"
                  action={
                    <Link to="/campaigns" className={textLink}>
                      Ver campañas
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  }
                />
                <div className="space-y-3">
                  {isLoading ? (
                    <Skeleton className="h-56" />
                  ) : data?.activeCampaigns.length ? (
                    data.activeCampaigns.slice(0, 3).map((campaign) => (
                      <ContentCard
                        key={campaign.id}
                        to={`/campaigns/${campaign.slug}`}
                        title={campaign.title}
                        description={campaign.description}
                        image={campaign.coverImageUrl}
                        badge="Campaña"
                      />
                    ))
                  ) : (
                    <EmptyState title="No hay campañas activas" description="Las campañas de artistas aparecerán aquí." />
                  )}
                </div>
              </div>
            </section>

            <section>
              <div className="mb-10 max-w-3xl">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-greenDark">Plataforma SaaS cultural</p>
                <h2 className="mt-3 text-balance text-3xl font-black text-brand-ink md:text-4xl">
                  Una base profesional para crecer como artista
                </h2>
                <p className="mt-4 text-base leading-relaxed text-brand-muted">
                  PerfilArtístico reúne marca personal, portafolio, solicitudes, oportunidades y métricas en una experiencia preparada para talento creativo profesional.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {BENEFITS_ARTIST.map(({ icon: Icon, title, description }) => (
                  <article key={title} className="rounded-2xl border border-brand-border bg-white p-6 shadow-card">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-mintLight text-brand-greenDark" aria-hidden="true">
                      <Icon size={23} />
                    </div>
                    <h3 className="text-base font-black text-brand-ink">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-brand-muted">{description}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="overflow-hidden rounded-3xl bg-brand-warm p-6 text-white shadow-soft sm:p-8 lg:p-10" aria-labelledby="home-cta-title">
              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div>
                  <YebaamLogo title="" className="mb-4 h-10 w-[158px] text-white" />
                  <h2 id="home-cta-title" className="text-balance text-3xl font-black md:text-4xl">
                    Haz visible tu marca artística
                  </h2>
                  <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/84">
                    Crea tu perfil profesional, publica tu portafolio y conecta con oportunidades culturales desde una presencia digital consistente.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                  <Link to="/register" className={`${linkBase} bg-white text-brand-ink hover:bg-brand-mintLight focus-visible:ring-white`}>
                    <UserPlus size={18} aria-hidden="true" />
                    Crear perfil
                  </Link>
                  <Link to="/artists" className={lightLink}>
                    Explorar talento
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

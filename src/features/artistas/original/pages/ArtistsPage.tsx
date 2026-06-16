import { useLocation, useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useArtists } from "../hooks/useArtists";
import { ArtistCard } from "../components/cards/ArtistCard";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { ErrorState } from "../components/ui/ErrorState";
import { Pagination } from "../components/ui/Pagination";
import { PublicPageHero } from "../components/sections/PublicPageHero";

const ARTIST_TYPES = [
  ["SINGER","Cantante"], ["MUSICIAN","Músico/a"], ["DANCER","Bailarín/a"],
  ["ACTOR","Actor/Actriz"], ["VISUAL_ARTIST","Artista visual"], ["PHOTOGRAPHER","Fotógrafo/a"],
  ["FILMMAKER","Realizador/a"], ["WRITER","Escritor/a"], ["PRODUCER","Productor/a"],
  ["DJ","DJ"], ["COMEDIAN","Comediante"], ["PERFORMER","Performer"],
  ["MODEL","Modelo"], ["MULTIDISCIPLINARY","Multidisciplinar"]
];

export function ArtistsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [city, setCity] = useState(params.get("city") ?? "");
  const [artistType, setArtistType] = useState(params.get("artistType") ?? "");
  const [sort, setSort] = useState(params.get("sort") ?? "");
  const [showFilters, setShowFilters] = useState(false);
  const { data, isLoading, error, refetch } = useArtists(location.search);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams();
    if (search) next.set("search", search);
    if (city) next.set("city", city);
    if (artistType) next.set("artistType", artistType);
    if (sort) next.set("sort", sort);
    navigate(`/artists?${next.toString()}`);
  }

  function goPage(page: number) {
    const next = new URLSearchParams(location.search);
    next.set("page", String(page));
    navigate(`/artists?${next.toString()}`);
  }

  return (
    <div className="bg-brand-bg">
      <PublicPageHero
        eyebrow="Catálogo de talento"
        title="Descubre artistas profesionales"
        description="Explora perfiles artísticos por disciplina, ciudad y tipo de talento creativo. Encuentra portafolios reales, servicios y trayectorias listas para conectar."
      >
          {/* Search form */}
          <form onSubmit={submit} className="flex flex-wrap gap-3" role="search" aria-label="Buscar artistas">
            <div className="relative min-w-[12rem] flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" aria-hidden="true" />
              <label htmlFor="artists-search" className="sr-only">Buscar por nombre, disciplina o palabra clave</label>
              <Input
                id="artists-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre, disciplina o palabra clave"
                className="pl-10"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              icon={<SlidersHorizontal size={15} aria-hidden="true" />}
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              aria-controls="artists-filters"
            >
              Filtros
            </Button>
            <Button type="submit" icon={<Search size={15} aria-hidden="true" />}>Buscar</Button>
          </form>

          {/* Expanded filters */}
          {showFilters && (
            <div id="artists-filters" className="mt-3 flex flex-wrap gap-3 animate-slide-up">
              <label htmlFor="artists-city" className="sr-only">Ciudad</label>
              <Input
                id="artists-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ciudad (ej. Bogotá)"
                className="w-48"
              />
              <label htmlFor="artists-type" className="sr-only">Tipo de artista</label>
              <Select id="artists-type" value={artistType} onChange={(e) => setArtistType(e.target.value)} className="w-52">
                <option value="">Tipo de artista</option>
                {ARTIST_TYPES.map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </Select>
              <label htmlFor="artists-sort" className="sr-only">Ordenar resultados</label>
              <Select id="artists-sort" value={sort} onChange={(e) => setSort(e.target.value)} className="w-52">
                <option value="">Orden recomendado</option>
                <option value="featured">Destacados primero</option>
                <option value="recent">Más recientes</option>
                <option value="popular">Populares</option>
                <option value="followers">Más seguidores</option>
                <option value="views">Más vistos</option>
              </Select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setSearch(""); setCity(""); setArtistType(""); setSort(""); navigate("/artists"); }}
                aria-label="Limpiar todos los filtros"
              >
                Limpiar
              </Button>
            </div>
          )}
      </PublicPageHero>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {error ? (
          <ErrorState description={error} onRetry={refetch} />
        ) : isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Cargando artistas">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-brand-border bg-white shadow-card overflow-hidden" aria-hidden="true">
                <div className="h-36 bg-brand-mintLight" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-brand-mintLight rounded w-3/4" />
                  <div className="h-3 bg-brand-mintLight rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.items.length ? (
          <>
            <p className="mb-4 text-sm text-brand-muted" aria-live="polite">
              <span className="font-semibold text-brand-ink">{data.meta.total}</span> artistas encontrados
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {data.items.map((artist) => <ArtistCard key={artist.id} artist={artist} />)}
            </div>
            <Pagination meta={data.meta} onPage={goPage} />
          </>
        ) : (
          <EmptyState
            title="No encontramos artistas"
            description="Ajusta tu búsqueda o explora otras ciudades y disciplinas."
            icon={<Users size={28} />}
            action={<Button variant="outline" size="sm" onClick={() => navigate("/artists")}>Ver todos los artistas</Button>}
          />
        )}
      </div>
    </div>
  );
}

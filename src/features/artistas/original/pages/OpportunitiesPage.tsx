import { useLocation, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { Briefcase, Search } from "lucide-react";
import { useOpportunities } from "../hooks/useOpportunities";
import { OpportunityCard } from "../components/cards/OpportunityCard";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { Pagination } from "../components/ui/Pagination";
import { PublicPageHero } from "../components/sections/PublicPageHero";

const OPP_TYPES = [
  ["CASTING","Casting"], ["AUDITION","Audición"], ["COLLABORATION","Colaboración"],
  ["FESTIVAL","Festival"], ["CULTURAL_CALL","Convocatoria"], ["BRAND_CAMPAIGN","Campaña de marca"],
  ["JOB","Empleo"], ["EXHIBITION","Exhibición"], ["CONTEST","Concurso"]
];

export function OpportunitiesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [search, setSearch] = useState(params.get("search") ?? "");
  const [type, setType] = useState(params.get("type") ?? "");
  const { data, isLoading, error, refetch } = useOpportunities(location.search);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams();
    if (search) next.set("search", search);
    if (type) next.set("type", type);
    navigate(`/opportunities?${next.toString()}`);
  }

  function goPage(page: number) {
    const next = new URLSearchParams(location.search);
    next.set("page", String(page));
    navigate(`/opportunities?${next.toString()}`);
  }

  return (
    <div className="bg-brand-bg">
      <PublicPageHero
        eyebrow="Convocatorias y conexiones"
        title="Oportunidades para artistas"
        description="Encuentra castings, audiciones, colaboraciones, festivales y campañas para impulsar tu carrera artística con una presencia profesional."
        tone="warm"
      >
          <form onSubmit={submit} className="flex flex-wrap gap-3" role="search" aria-label="Buscar oportunidades">
            <div className="relative min-w-[12rem] flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted" aria-hidden="true" />
              <label htmlFor="opp-search" className="sr-only">Buscar oportunidad</label>
              <Input id="opp-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar oportunidad…" className="pl-10" />
            </div>
            <label htmlFor="opp-type" className="sr-only">Tipo de oportunidad</label>
            <Select id="opp-type" value={type} onChange={(e) => setType(e.target.value)} className="w-52">
              <option value="">Tipo de oportunidad</option>
              {OPP_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
            <Button type="submit" icon={<Search size={15} aria-hidden="true" />}>Buscar</Button>
          </form>
      </PublicPageHero>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {error ? (
          <ErrorState description={error} onRetry={refetch} />
        ) : isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52" />)}
          </div>
        ) : data?.items.length ? (
          <>
            <p className="mb-4 text-sm text-brand-muted" aria-live="polite">
              <span className="font-semibold text-brand-ink">{data.meta.total}</span> oportunidades disponibles
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((item) => <OpportunityCard key={item.id} opportunity={item} />)}
            </div>
            <Pagination meta={data.meta} onPage={goPage} />
          </>
        ) : (
          <EmptyState
            title="No hay oportunidades abiertas"
            description="Pronto aparecerán convocatorias, castings y colaboraciones para artistas."
            icon={<Briefcase size={28} />}
          />
        )}
      </div>
    </div>
  );
}

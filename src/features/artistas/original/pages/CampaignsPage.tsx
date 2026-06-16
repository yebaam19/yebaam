import { useLocation, useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { ContentCard } from "../components/cards/ContentCard";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { Pagination } from "../components/ui/Pagination";
import { useCampaigns } from "../hooks/useCampaigns";
import { PublicPageHero } from "../components/sections/PublicPageHero";

export function CampaignsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useCampaigns(location.search);

  function goPage(page: number) {
    const next = new URLSearchParams(location.search);
    next.set("page", String(page));
    navigate(`/campaigns?${next.toString()}`);
  }

  return (
    <div className="bg-brand-bg">
      <PublicPageHero
        eyebrow="Visibilidad y comunidad"
        title="Campañas artísticas"
        description="Promociones, lanzamientos, colaboraciones de marca y convocatorias culturales activas para amplificar proyectos creativos."
        tone="warm"
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {error ? (
          <ErrorState description={error} onRetry={refetch} />
        ) : isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : data?.items.length ? (
          <>
            <p className="mb-4 text-sm text-brand-muted" aria-live="polite">
              <span className="font-semibold text-brand-ink">{data.meta.total}</span> campañas activas
            </p>
            <div className="grid gap-4">
              {data.items.map((item) => (
                <ContentCard key={item.id} to={`/campaigns/${item.slug}`} title={item.title} description={item.description} image={item.coverImageUrl} badge="Campaña" />
              ))}
            </div>
            <Pagination meta={data.meta} onPage={goPage} />
          </>
        ) : (
          <EmptyState
            title="No hay campañas activas"
            description="Las campañas de artistas y plataforma aparecerán aquí."
            icon={<Zap size={28} />}
          />
        )}
      </div>
    </div>
  );
}

import { useParams } from "react-router-dom";
import { useOpportunityDetail } from "../hooks/useOpportunities";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { PublicPageHero } from "../components/sections/PublicPageHero";
import { formatDate } from "../lib/formatters";

export function OpportunityDetailPage() {
  const { slug = "" } = useParams();
  const { data, isLoading, error, refetch } = useOpportunityDetail(slug);

  if (isLoading) return <div className="mx-auto max-w-4xl px-4 py-10" aria-busy="true"><Skeleton className="h-72" /></div>;
  if (error)     return <div className="mx-auto max-w-4xl px-4 py-10"><ErrorState description={error} onRetry={refetch} /></div>;
  if (!data)     return <EmptyState title="Oportunidad no encontrada" />;

  return (
    <div className="animate-fade-in bg-brand-bg">
      <PublicPageHero eyebrow="Oportunidad cultural" title={data.title} description={data.description} tone="warm">
        <div className="flex flex-wrap gap-2" aria-label="Detalles de la oportunidad">
          <Badge variant="orange">{data.type}</Badge>
          <Badge>{data.city ?? "Latinoamérica"}</Badge>
          <Badge variant="gold">Cierre {formatDate(data.deadline)}</Badge>
        </div>
      </PublicPageHero>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Card className="p-6">
          <p className="leading-7 text-brand-muted">{data.description}</p>
          <Button type="button" className="mt-6" aria-label={`Aplicar a la oportunidad: ${data.title}`}>
            Aplicar a esta oportunidad
          </Button>
        </Card>
      </div>
    </div>
  );
}

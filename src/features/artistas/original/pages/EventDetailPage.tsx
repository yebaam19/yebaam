import { useParams } from "react-router-dom";
import { useEventDetail } from "../hooks/useEvents";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { PublicPageHero } from "../components/sections/PublicPageHero";
import { formatDate } from "../lib/formatters";

export function EventDetailPage() {
  const { slug = "" } = useParams();
  const { data, isLoading, error, refetch } = useEventDetail(slug);

  if (isLoading) return <div className="mx-auto max-w-4xl px-4 py-10" aria-busy="true"><Skeleton className="h-72" /></div>;
  if (error)     return <div className="mx-auto max-w-4xl px-4 py-10"><ErrorState description={error} onRetry={refetch} /></div>;
  if (!data)     return <EmptyState title="Evento no encontrado" />;

  return (
    <div className="animate-fade-in bg-brand-bg">
      <PublicPageHero
        eyebrow="Evento artístico"
        title={data.title}
        description={`${formatDate(data.startsAt)} · ${data.city ?? "Latinoamérica"}`}
      />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Card className="overflow-hidden">
          {data.coverImageUrl ? (
            <img src={data.coverImageUrl} alt={`Portada del evento: ${data.title}`} className="h-80 w-full object-cover" />
          ) : null}
          <div className="p-6">
            <p className="leading-7 text-brand-muted">{data.description}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

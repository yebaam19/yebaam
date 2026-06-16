import { useParams } from "react-router-dom";
import { useCampaignDetail } from "../hooks/useCampaigns";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { PublicPageHero } from "../components/sections/PublicPageHero";

export function CampaignDetailPage() {
  const { slug = "" } = useParams();
  const { data, isLoading, error, refetch } = useCampaignDetail(slug);

  if (isLoading) return <div className="mx-auto max-w-4xl px-4 py-10" aria-busy="true"><Skeleton className="h-72" /></div>;
  if (error)     return <div className="mx-auto max-w-4xl px-4 py-10"><ErrorState description={error} onRetry={refetch} /></div>;
  if (!data)     return <EmptyState title="Campaña no encontrada" />;

  return (
    <div className="animate-fade-in bg-brand-bg">
      <PublicPageHero eyebrow="Campaña artística" title={data.title} description={data.type} tone="warm" />
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <Card className="p-6">
          <p className="leading-7 text-brand-muted">{data.description}</p>
        </Card>
      </div>
    </div>
  );
}

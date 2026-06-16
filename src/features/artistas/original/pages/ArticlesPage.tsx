import { ContentCard } from "../components/cards/ContentCard";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { PublicPageHero } from "../components/sections/PublicPageHero";
import { useArticles } from "../hooks/useArticles";

export function ArticlesPage() {
  const { data, isLoading, error, refetch } = useArticles();
  return (
    <div className="min-h-screen bg-brand-bg">
      <PublicPageHero
        eyebrow="Contenido cultural"
        title="Artículos para marca personal artística"
        description="Guías y notas sobre portafolio, industria creativa, circulación cultural y crecimiento profesional."
      />
      <div className="mx-auto max-w-7xl px-4 py-10">
        {error ? <ErrorState description={error} onRetry={refetch} /> : isLoading ? <Skeleton className="h-80" /> : data?.items.length ? (
          <div className="grid gap-5 md:grid-cols-3">{data.items.map((item) => <ContentCard key={item.id} to={`/articles/${item.slug}`} title={item.title} description={item.excerpt} image={item.coverImageUrl} />)}</div>
        ) : <EmptyState title="No hay artículos publicados" description="Las guías y notas de la plataforma aparecerán aquí." />}
      </div>
    </div>
  );
}

import { useParams } from "react-router-dom";
import { useArticleDetail } from "../hooks/useArticles";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { PublicPageHero } from "../components/sections/PublicPageHero";

export function ArticleDetailPage() {
  const { slug = "" } = useParams();
  const { data, isLoading, error, refetch } = useArticleDetail(slug);
  if (isLoading) return <div className="mx-auto max-w-3xl px-4 py-10"><Skeleton className="h-72" /></div>;
  if (error) return <div className="mx-auto max-w-3xl px-4 py-10"><ErrorState description={error} onRetry={refetch} /></div>;
  if (!data) return <EmptyState title="Artículo no encontrado" />;
  return (
    <article className="bg-brand-bg">
      <PublicPageHero eyebrow="Artículo" title={data.title} description={data.excerpt ?? undefined} />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="max-w-none rounded-2xl border border-brand-border bg-white p-6 leading-7 text-brand-muted shadow-card [&_a]:text-brand-dark [&_a]:underline [&_a]:decoration-brand-green [&_h2]:text-xl [&_h2]:font-black [&_h2]:text-brand-ink [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-brand-ink [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:text-brand-muted [&_strong]:font-bold [&_strong]:text-brand-ink [&_ul]:list-disc [&_ul]:pl-5">{data.content}</div>
      </div>
    </article>
  );
}

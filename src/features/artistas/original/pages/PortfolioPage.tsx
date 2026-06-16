import { usePortfolio } from "../hooks/usePortfolio";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton } from "../components/ui/Skeleton";
import { Badge } from "../components/ui/Badge";
import { ErrorState } from "../components/ui/ErrorState";
import { Pagination } from "../components/ui/Pagination";
import { useNavigate, useLocation } from "react-router-dom";
import { Music } from "lucide-react";
import { PublicPageHero } from "../components/sections/PublicPageHero";

const MEDIA_LABEL: Record<string, string> = {
  IMAGE: "Imagen", VIDEO: "Video", AUDIO: "Audio", DOCUMENT: "Documento", LINK: "Enlace"
};
const MEDIA_BADGE: Record<string, "green" | "orange" | "gold" | "mint" | "default"> = {
  IMAGE: "mint", VIDEO: "orange", AUDIO: "gold", DOCUMENT: "default", LINK: "green"
};

export function PortfolioPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = usePortfolio(location.search);

  function goPage(page: number) {
    const next = new URLSearchParams(location.search);
    next.set("page", String(page));
    navigate(`/portfolio?${next.toString()}`);
  }

  return (
    <div className="bg-brand-bg">
      <PublicPageHero
        eyebrow="Vitrina multimedia"
        title="Portafolios que muestran talento real"
        description="Explora piezas destacadas de artistas profesionales: imagen, video, audio, documentos y enlaces curados para evaluar trayectoria y estilo."
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {error ? (
          <ErrorState description={error} onRetry={refetch} />
        ) : isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64" />)}
          </div>
        ) : data?.items.length ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((item) => (
                <Card key={item.id} hover className="overflow-hidden">
                  <div className="relative h-52 overflow-hidden bg-brand-mintLight">
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt={item.title} className="h-full w-full object-cover transition group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Music size={32} className="text-brand-greenDark" />
                      </div>
                    )}
                    {item.isFeatured && (
                      <span className="absolute right-2 top-2 rounded-full bg-brand-orange px-2 py-0.5 text-xs font-bold text-brand-ink">Destacada</span>
                    )}
                  </div>
                  <div className="p-4">
                    <Badge variant={MEDIA_BADGE[item.mediaType] ?? "default"}>
                      {MEDIA_LABEL[item.mediaType] ?? item.mediaType}
                    </Badge>
                    <h3 className="mt-2 font-black text-brand-ink">{item.title}</h3>
                    {item.description && (
                      <p className="mt-1.5 line-clamp-2 text-sm text-brand-muted">{item.description}</p>
                    )}
                    {item.artistProfile?.stageName && (
                      <p className="mt-3 text-xs font-semibold text-brand-muted">{item.artistProfile.stageName}</p>
                    )}
                    {item.tags?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map((tag) => <Badge key={tag} variant="mint">{tag}</Badge>)}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
            {data.meta && <Pagination meta={data.meta} onPage={goPage} />}
          </>
        ) : (
          <EmptyState title="No hay portafolios publicados" description="Las piezas de artistas aparecerán aquí cuando sean publicadas." icon={<Music size={28} />} />
        )}
      </div>
    </div>
  );
}

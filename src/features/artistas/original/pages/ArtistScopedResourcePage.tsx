import { useAuth } from "../contexts/AuthContext";
import { useApiQuery } from "../hooks/useApiQuery";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/Skeleton";

function asRecord(value: unknown) {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function firstText(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim().length) return value;
    if (typeof value === "number") return String(value);
  }
  return "Sin título";
}

function ArtistScopedResourceList({
  artistId,
  title,
  description,
  resource
}: {
  artistId: string;
  title: string;
  description: string;
  resource: "experience" | "achievements" | "education" | "social-links";
}) {
  const path = `/artists/${artistId}/${resource}`;
  const { data, isLoading, error, refetch } = useApiQuery<unknown[]>(path, [path]);

  return (
    <div className="animate-fade-in">
      <PageHeader title={title} description={description} />
      {error ? (
        <ErrorState title={`No se pudo cargar ${title.toLowerCase()}`} description={error} onRetry={refetch} />
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-36" />)}
        </div>
      ) : data?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((item) => {
            const record = asRecord(item);
            const id = typeof record.id === "string" ? record.id : firstText(record, ["title", "platform", "url"]);
            return (
              <Card key={id} className="p-5">
                <h2 className="font-black text-brand-ink">{firstText(record, ["title", "platform", "label"])}</h2>
                <p className="mt-1 text-sm font-semibold text-brand-muted">
                  {firstText(record, ["organization", "issuer", "institution", "field", "url"])}
                </p>
                <p className="mt-3 line-clamp-3 text-sm text-brand-muted">
                  {firstText(record, ["description"])}
                </p>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState title={`Sin ${title.toLowerCase()}`} description="Cuando exista información registrada aparecerá aquí." />
      )}
    </div>
  );
}

export function ArtistScopedResourcePage({
  title,
  description,
  resource
}: {
  title: string;
  description: string;
  resource: "experience" | "achievements" | "education" | "social-links";
}) {
  const { user } = useAuth();
  const artistId = user?.artistProfileId;

  if (!artistId) {
    return <EmptyState title="No tienes perfil artístico" description="No se encontró un perfil asociado a esta cuenta." />;
  }

  return <ArtistScopedResourceList artistId={artistId} title={title} description={description} resource={resource} />;
}

import { useApiQuery } from "../hooks/useApiQuery";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { Table } from "../components/ui/Table";
import { ErrorState } from "../components/ui/ErrorState";

type ResourceResponse = {
  items?: unknown[];
  meta?: unknown;
};

function extractItems(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && data !== null && "items" in data) {
    const maybeItems = (data as ResourceResponse).items;
    return Array.isArray(maybeItems) ? maybeItems : [];
  }
  return [];
}

function cellValue(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  }
  return "-";
}

export function ResourceTablePage({ title, description, endpoint }: { title: string; description: string; endpoint: string }) {
  const { data, isLoading, error, refetch } = useApiQuery<unknown>(endpoint, [endpoint]);
  const items = extractItems(data);

  return (
    <div className="animate-fade-in">
      <PageHeader title={title} description={description} />
      {error ? <ErrorState description={error} onRetry={refetch} /> : isLoading ? <Skeleton className="h-72" /> : items.length ? (
        <Table
          headers={["Nombre", "Tipo/estado", "Ciudad/email", "Creado"]}
          rows={items.map((item) => {
            const record = item as Record<string, unknown>;
            return [
              cellValue(record, ["stageName", "title", "displayName", "name", "email", "action"]),
              cellValue(record, ["role", "status", "type", "artistType"]),
              cellValue(record, ["city", "email", "targetType"]),
              cellValue(record, ["createdAt"])
            ];
          })}
        />
      ) : <EmptyState title="No hay datos para mostrar" />}
    </div>
  );
}

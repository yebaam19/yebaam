import { useState } from "react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { PageHeader } from "../components/ui/PageHeader";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { useToast } from "../contexts/ToastContext";
import { useApiQuery } from "../hooks/useApiQuery";
import { api } from "../lib/api";
import { getApiErrorMessage } from "../lib/apiErrors";
import type { ArtistProfile, Paginated } from "../types";

const profileStatuses = ["DRAFT", "PUBLISHED", "SUSPENDED", "ARCHIVED"] as const;

function statusVariant(status: string): "green" | "error" | "warning" | "default" {
  if (status === "PUBLISHED") return "green";
  if (status === "SUSPENDED") return "error";
  if (status === "ARCHIVED") return "warning";
  return "default";
}

export function AdminArtistsPage() {
  const { showToast } = useToast();
  const { data, isLoading, error, refetch } = useApiQuery<Paginated<ArtistProfile>>("/admin/artists?limit=50");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const artists = data?.items ?? [];

  async function patchArtistFlag(artist: ArtistProfile, field: "verify" | "feature") {
    const nextValue = field === "verify" ? !artist.isVerified : !artist.isFeatured;
    const key = `${field}:${artist.id}`;

    try {
      setBusyKey(key);
      await api.patch(`/artists/${artist.id}/${field}`, { value: nextValue });
      showToast(field === "verify" ? "Verificación actualizada" : "Destacado actualizado", "success");
      await refetch();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "No se pudo actualizar el artista"), "error");
    } finally {
      setBusyKey(null);
    }
  }

  async function changeStatus(artist: ArtistProfile, status: string) {
    if (status === artist.status) return;

    try {
      setBusyKey(`status:${artist.id}`);
      await api.patch(`/artists/${artist.id}/status`, { status });
      showToast("Estado del perfil actualizado", "success");
      await refetch();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "No se pudo cambiar el estado"), "error");
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Artistas"
        description="Moderación operativa de perfiles: estado, verificación y destacados."
      />

      {isLoading ? <Skeleton className="h-80" /> : null}
      {error ? <ErrorState description={error} onRetry={refetch} /> : null}

      {!isLoading && !error && artists.length === 0 ? (
        <EmptyState title="No hay artistas" description="Cuando existan perfiles artísticos aparecerán aquí." />
      ) : null}

      {!isLoading && !error && artists.length > 0 ? (
        <div className="grid gap-4">
          {artists.map((artist) => (
            <Card key={artist.id} className="p-5">
              <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-brand-ink">{artist.stageName}</h2>
                    <Badge variant={statusVariant(artist.status)}>{artist.status}</Badge>
                    {artist.isVerified ? <Badge variant="green">Verificado</Badge> : null}
                    {artist.isFeatured ? <Badge variant="gold">Destacado</Badge> : null}
                  </div>
                  <p className="text-sm text-brand-muted">
                    {artist.artistType} · {artist.city}, {artist.country}
                  </p>
                  <p className="text-sm text-brand-muted">
                    Responsable: {artist.owner?.displayName ?? "Sin responsable"} {artist.owner?.email ? `(${artist.owner.email})` : ""}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
                  <Button
                    type="button"
                    variant={artist.isVerified ? "secondary" : "primary"}
                    onClick={() => patchArtistFlag(artist, "verify")}
                    disabled={busyKey === `verify:${artist.id}`}
                  >
                    {artist.isVerified ? "Quitar verificación" : "Verificar"}
                  </Button>

                  <Button
                    type="button"
                    variant={artist.isFeatured ? "secondary" : "primary"}
                    onClick={() => patchArtistFlag(artist, "feature")}
                    disabled={busyKey === `feature:${artist.id}`}
                  >
                    {artist.isFeatured ? "Quitar destacado" : "Destacar"}
                  </Button>

                  <label className="grid gap-2 text-sm font-semibold text-brand-ink">
                    Estado
                    <Select
                      value={artist.status}
                      onChange={(event) => changeStatus(artist, event.target.value)}
                      disabled={busyKey === `status:${artist.id}`}
                      aria-label={`Estado de ${artist.stageName}`}
                    >
                      {profileStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </Select>
                  </label>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  );
}

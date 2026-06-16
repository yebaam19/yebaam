import { useEffect, useState } from "react";
import { Briefcase, CalendarDays, Megaphone, ShieldCheck, UserRound } from "lucide-react";
import { useApiQuery } from "../hooks/useApiQuery";
import { formatDate } from "../lib/formatters";
import type { ArtistRequest, Campaign, EventItem, ManagerArtistAssignment } from "../types";
import { PortfolioManagerPanel } from "./ArtistPortfolioManagerPage";
import { ServicesManagerPanel } from "./ArtistServicesManagerPage";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { StatusBadge } from "../components/ui/StatusBadge";

type ManagerSection = "artists" | "requests" | "events" | "campaigns";

function ManagerRequestsList() {
  const { data, isLoading, error, refetch } = useApiQuery<ArtistRequest[]>("/manager/requests", []);

  if (error) return <ErrorState title="No se pudieron cargar las solicitudes" description={error} onRetry={refetch} />;
  if (isLoading) return <Skeleton className="h-56" />;
  if (!data?.length) return <EmptyState title="Sin solicitudes asignadas" />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {data.map((request) => (
        <Card key={`${request.type}-${request.id}`} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Badge variant="mint">{request.type}</Badge>
              <h3 className="mt-2 font-black text-brand-ink">{request.name}</h3>
              <p className="text-sm font-semibold text-brand-muted">{request.artistProfile?.stageName ?? "Artista asignado"}</p>
            </div>
            <StatusBadge status={request.status} />
          </div>
          <p className="mt-3 line-clamp-3 text-sm text-brand-muted">{request.message ?? request.proposal ?? "Sin mensaje"}</p>
          <p className="mt-4 border-t border-brand-border pt-3 text-xs font-semibold text-brand-muted">{formatDate(request.createdAt)}</p>
        </Card>
      ))}
    </div>
  );
}

function ManagerEventsList() {
  const { data, isLoading, error, refetch } = useApiQuery<EventItem[]>("/manager/events", []);

  if (error) return <ErrorState title="No se pudieron cargar los eventos" description={error} onRetry={refetch} />;
  if (isLoading) return <Skeleton className="h-56" />;
  if (!data?.length) return <EmptyState title="Sin eventos asignados" />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {data.map((event) => (
        <Card key={event.id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-black text-brand-ink">{event.title}</h3>
              <p className="text-sm font-semibold text-brand-muted">{event.artistProfile?.stageName ?? "Artista asignado"}</p>
            </div>
            <StatusBadge status={event.status} />
          </div>
          <p className="mt-3 line-clamp-2 text-sm text-brand-muted">{event.description}</p>
          <p className="mt-4 border-t border-brand-border pt-3 text-xs font-semibold text-brand-muted">{formatDate(event.startsAt)}</p>
        </Card>
      ))}
    </div>
  );
}

function ManagerCampaignsList() {
  const { data, isLoading, error, refetch } = useApiQuery<Campaign[]>("/manager/campaigns", []);

  if (error) return <ErrorState title="No se pudieron cargar las campañas" description={error} onRetry={refetch} />;
  if (isLoading) return <Skeleton className="h-56" />;
  if (!data?.length) return <EmptyState title="Sin campañas asignadas" />;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {data.map((campaign) => (
        <Card key={campaign.id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-black text-brand-ink">{campaign.title}</h3>
              <p className="text-sm font-semibold text-brand-muted">{campaign.artistProfile?.stageName ?? "Artista asignado"}</p>
            </div>
            <StatusBadge status={campaign.status} />
          </div>
          <p className="mt-3 line-clamp-2 text-sm text-brand-muted">{campaign.description}</p>
          <p className="mt-4 border-t border-brand-border pt-3 text-xs font-semibold text-brand-muted">{campaign.type}</p>
        </Card>
      ))}
    </div>
  );
}

export function ManagerWorkspacePage({ section }: { section: ManagerSection }) {
  const { data, isLoading, error, refetch } = useApiQuery<ManagerArtistAssignment[]>("/manager/artists", []);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedArtistId && data?.length) {
      setSelectedArtistId(data[0].artistProfileId);
    }
  }, [data, selectedArtistId]);

  const selected = data?.find((assignment) => assignment.artistProfileId === selectedArtistId) ?? data?.[0] ?? null;

  if (section === "requests") {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Solicitudes asignadas" description="Solicitudes recibidas por artistas bajo tu gestión." />
        <ManagerRequestsList />
      </div>
    );
  }

  if (section === "events") {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Eventos asignados" description="Eventos vinculados a los artistas que administras." />
        <ManagerEventsList />
      </div>
    );
  }

  if (section === "campaigns") {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Campañas asignadas" description="Campañas vinculadas a los artistas que administras." />
        <ManagerCampaignsList />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Artistas asignados" description="Solo puedes operar artistas que la plataforma asignó a tu cuenta manager." />

      {error ? (
        <ErrorState title="No se pudieron cargar tus artistas" description={error} onRetry={refetch} />
      ) : isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-40" />)}
        </div>
      ) : data?.length ? (
        <div className="space-y-8">
          <div className="grid gap-4 lg:grid-cols-3">
            {data.map((assignment) => {
              const artist = assignment.artistProfile;
              const isSelected = assignment.artistProfileId === selected?.artistProfileId;
              return (
                <Card key={assignment.id} className={`p-5 ${isSelected ? "ring-2 ring-brand-green" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-mintLight text-brand-green" aria-hidden="true">
                      <UserRound size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="truncate font-black text-brand-ink">{artist.stageName}</h2>
                      <p className="text-sm text-brand-muted">{artist.city}, {artist.country}</p>
                    </div>
                    {artist.isVerified ? <ShieldCheck className="text-brand-green" size={18} aria-label="Verificado" /> : null}
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm text-brand-muted">{artist.shortBio ?? artist.biography ?? "Perfil asignado para gestión."}</p>
                  <Button type="button" size="sm" className="mt-4 w-full" variant={isSelected ? "secondary" : "outline"} onClick={() => setSelectedArtistId(assignment.artistProfileId)}>
                    {isSelected ? "Seleccionado" : "Detalle operativo"}
                  </Button>
                </Card>
              );
            })}
          </div>

          {selected ? (
            <Card className="p-5">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-brand-border pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-green">Detalle operativo</p>
                  <h2 className="text-xl font-black text-brand-ink">{selected.artistProfile.stageName}</h2>
                  <p className="text-sm text-brand-muted">Las acciones usan ownership de manager en backend.</p>
                </div>
                <StatusBadge status={selected.artistProfile.status} />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-brand-border bg-brand-bgGreen p-4">
                  <Briefcase size={18} className="text-brand-green" aria-hidden="true" />
                  <p className="mt-2 text-sm font-black text-brand-ink">{selected.artistProfile.portfolioItems?.length ?? 0} piezas visibles</p>
                </div>
                <div className="rounded-xl border border-brand-border bg-brand-bgGreen p-4">
                  <CalendarDays size={18} className="text-brand-green" aria-hidden="true" />
                  <p className="mt-2 text-sm font-black text-brand-ink">{selected.artistProfile.profileViews.toLocaleString("es-CO")} vistas</p>
                </div>
                <div className="rounded-xl border border-brand-border bg-brand-bgGreen p-4">
                  <Megaphone size={18} className="text-brand-green" aria-hidden="true" />
                  <p className="mt-2 text-sm font-black text-brand-ink">{selected.artistProfile.followerCount.toLocaleString("es-CO")} seguidores</p>
                </div>
              </div>
            </Card>
          ) : null}

          {selected ? <PortfolioManagerPanel artistId={selected.artistProfileId} title={`Portafolio de ${selected.artistProfile.stageName}`} /> : null}
          {selected ? <ServicesManagerPanel artistId={selected.artistProfileId} title={`Servicios de ${selected.artistProfile.stageName}`} /> : null}
        </div>
      ) : (
        <EmptyState title="No tienes artistas asignados" description="La plataforma debe asignarte artistas para activar este panel." />
      )}
    </div>
  );
}

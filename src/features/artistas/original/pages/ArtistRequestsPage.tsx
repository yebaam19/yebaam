import { Mail, MessageSquare } from "lucide-react";
import { useMemo, useState } from "react";
import { useApiQuery } from "../hooks/useApiQuery";
import { useAuth } from "../contexts/AuthContext";
import { formatDate } from "../lib/formatters";
import type { ArtistRequest, Paginated } from "../types";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { PageHeader } from "../components/ui/PageHeader";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { StatusBadge } from "../components/ui/StatusBadge";

const REQUEST_TYPE_LABEL: Record<string, string> = {
  all: "Todas",
  contact: "Contacto",
  booking: "Booking",
  collaboration: "Colaboración"
};

function ArtistRequestsList({ artistId }: { artistId: string }) {
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("");
  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("type", type);
    if (status) params.set("status", status);
    return params.toString();
  }, [status, type]);

  const path = `/artists/${artistId}/requests?${query}`;
  const { data, isLoading, error, refetch } = useApiQuery<Paginated<ArtistRequest>>(path, [path]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Solicitudes recibidas" description="Consulta contactos, bookings y colaboraciones asociadas a tu perfil artístico.">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="request-type" className="mb-1.5 block text-sm font-semibold text-brand-ink">Tipo</label>
            <Select id="request-type" value={type} onChange={(event) => setType(event.target.value)}>
              <option value="all">Todas</option>
              <option value="contact">Contacto</option>
              <option value="booking">Booking</option>
              <option value="collaboration">Colaboración</option>
            </Select>
          </div>
          <div>
            <label htmlFor="request-status" className="mb-1.5 block text-sm font-semibold text-brand-ink">Estado</label>
            <Select id="request-status" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">Todos los estados</option>
              <option value="PENDING">Pendiente</option>
              <option value="CONTACTED">Contactado</option>
              <option value="APPROVED">Aprobado</option>
              <option value="REJECTED">Rechazado</option>
              <option value="ARCHIVED">Archivado</option>
            </Select>
          </div>
        </div>
      </PageHeader>

      {error ? (
        <ErrorState title="No se pudieron cargar las solicitudes" description={error} onRetry={refetch} />
      ) : isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-44" />)}
        </div>
      ) : data?.items.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.items.map((request) => (
            <Card key={`${request.type}-${request.id}`} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Badge variant="mint">{REQUEST_TYPE_LABEL[request.type] ?? request.type}</Badge>
                  <h2 className="mt-2 font-black text-brand-ink">{request.name}</h2>
                  <a href={`mailto:${request.email}`} className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-green hover:underline">
                    <Mail size={14} aria-hidden="true" />
                    {request.email}
                  </a>
                </div>
                <StatusBadge status={request.status} />
              </div>
              <p className="mt-4 line-clamp-3 text-sm text-brand-muted">
                {request.message ?? request.proposal ?? "Solicitud sin mensaje adicional."}
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-brand-border pt-3 text-xs font-semibold text-brand-muted">
                <span>{formatDate(request.createdAt)}</span>
                <span className="inline-flex items-center gap-1">
                  <MessageSquare size={13} aria-hidden="true" />
                  Gestión de estado desde administración
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No hay solicitudes" description="Cuando recibas contactos, bookings o colaboraciones aparecerán aquí." />
      )}
    </div>
  );
}

export function ArtistRequestsPage() {
  const { user } = useAuth();
  if (!user?.artistProfileId) {
    return <EmptyState title="No tienes perfil artístico" description="No se encontró un perfil asociado a esta cuenta." />;
  }
  return <ArtistRequestsList artistId={user.artistProfileId} />;
}

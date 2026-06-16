import { Badge } from "./Badge";

const statusMap: Record<string, { label: string; variant: "green" | "orange" | "gold" | "error" | "default" | "mint" }> = {
  PUBLISHED:  { label: "Publicado",    variant: "green" },
  ACTIVE:     { label: "Activo",       variant: "green" },
  OPEN:       { label: "Abierta",      variant: "green" },
  DRAFT:      { label: "Borrador",     variant: "default" },
  PAUSED:     { label: "Pausado",      variant: "gold" },
  PENDING:    { label: "Pendiente",    variant: "gold" },
  CLOSED:     { label: "Cerrada",      variant: "orange" },
  CANCELLED:  { label: "Cancelado",    variant: "error" },
  SUSPENDED:  { label: "Suspendido",   variant: "error" },
  ARCHIVED:   { label: "Archivado",    variant: "default" },
  FINISHED:   { label: "Finalizado",   variant: "mint" },
  CONTACTED:  { label: "Contactado",   variant: "mint" },
  REVIEWED:   { label: "Revisado",     variant: "mint" },
  APPROVED:   { label: "Aprobado",     variant: "green" },
  REJECTED:   { label: "Rechazado",    variant: "error" }
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = statusMap[status] ?? { label: status, variant: "default" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

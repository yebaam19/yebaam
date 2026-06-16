import { useState } from "react";
import { Badge } from "../components/ui/Badge";
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
import type { ReportItem } from "../types";

const reportStatuses = ["PENDING", "REVIEWED", "RESOLVED", "DISMISSED"] as const;

function statusVariant(status: string): "warning" | "green" | "mint" | "default" {
  if (status === "PENDING") return "warning";
  if (status === "RESOLVED") return "green";
  if (status === "REVIEWED") return "mint";
  return "default";
}

export function AdminReportsPage() {
  const { showToast } = useToast();
  const { data, isLoading, error, refetch } = useApiQuery<ReportItem[]>("/admin/reports");
  const [busyId, setBusyId] = useState<string | null>(null);
  const reports = data ?? [];

  async function changeStatus(report: ReportItem, status: string) {
    if (status === report.status) return;

    try {
      setBusyId(report.id);
      await api.patch(`/admin/reports/${report.id}/status`, { status });
      showToast("Estado del reporte actualizado", "success");
      await refetch();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "No se pudo cambiar el estado del reporte"), "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Reportes"
        description="Moderación de contenido reportado por la comunidad."
      />

      {isLoading ? <Skeleton className="h-72" /> : null}
      {error ? <ErrorState description={error} onRetry={refetch} /> : null}

      {!isLoading && !error && reports.length === 0 ? (
        <EmptyState title="No hay reportes abiertos" description="Los reportes creados por usuarios aparecerán en esta bandeja." />
      ) : null}

      {!isLoading && !error && reports.length > 0 ? (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="p-5">
              <div className="grid gap-4 lg:grid-cols-[1fr_220px] lg:items-center">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-brand-ink">{report.targetType}</h2>
                    <Badge variant={statusVariant(report.status)}>{report.status}</Badge>
                  </div>
                  <p className="text-sm text-brand-muted">{report.reason}</p>
                  {report.details ? <p className="text-sm text-brand-ink">{report.details}</p> : null}
                  <p className="text-xs text-brand-muted">
                    Reportado por {report.reporter?.displayName ?? "Usuario"} · ID objetivo {report.targetId}
                  </p>
                </div>

                <label className="grid gap-2 text-sm font-semibold text-brand-ink">
                  Estado del reporte
                  <Select
                    value={report.status}
                    onChange={(event) => changeStatus(report, event.target.value)}
                    disabled={busyId === report.id}
                    aria-label={`Estado del reporte ${report.id}`}
                  >
                    {reportStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  );
}

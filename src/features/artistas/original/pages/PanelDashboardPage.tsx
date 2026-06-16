import { Activity, Calendar, FileText, Heart, Users, Eye, TrendingUp, Award, Zap } from "lucide-react";
import { useDashboard } from "../hooks/useDashboard";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { StatCard } from "../components/ui/StatCard";
import { Table } from "../components/ui/Table";
import { ErrorState } from "../components/ui/ErrorState";
import { EmptyState } from "../components/ui/EmptyState";

function num(value: unknown) {
  return typeof value === "number" ? value : 0;
}

const STAT_ICONS = [Users, Heart, Calendar, FileText, Eye, TrendingUp, Award, Zap];

type StatConfig = { label: string; key: string; altKey?: string; iconIndex: number; color?: "green" | "orange" | "gold" | "default" };

const adminStats: StatConfig[] = [
  { label: "Usuarios",      key: "users",         iconIndex: 0, color: "green"   },
  { label: "Artistas",      key: "artists",       iconIndex: 1, color: "green"   },
  { label: "Portafolios",   key: "portfolio",     iconIndex: 5, color: "default" },
  { label: "Eventos",       key: "events",        iconIndex: 2, color: "default" },
  { label: "Campañas",      key: "campaigns",     iconIndex: 7, color: "orange"  },
  { label: "Oportunidades", key: "opportunities", iconIndex: 6, color: "orange"  },
  { label: "Solicitudes",   key: "requests",      iconIndex: 3, color: "gold"    },
];

const artistStats: StatConfig[] = [
  { label: "Vistas del perfil", key: "profileViews",  iconIndex: 4, color: "green"   },
  { label: "Seguidores",        key: "followers",     iconIndex: 0, color: "green"   },
  { label: "Favoritos",         key: "favorites",     iconIndex: 1, color: "orange"  },
  { label: "Portafolio",        key: "portfolio",     iconIndex: 5, color: "default" },
  { label: "Solicitudes",       key: "requests",      iconIndex: 3, color: "gold"    },
  { label: "Oportunidades",     key: "opportunities", iconIndex: 6, color: "orange"  },
];

const managerStats: StatConfig[] = [
  { label: "Artistas asignados", key: "totalArtists",  iconIndex: 0, color: "green"   },
  { label: "Campañas",           key: "totalCampaigns", iconIndex: 7, color: "orange"  },
  { label: "Eventos",            key: "totalEvents",   iconIndex: 2, color: "default" },
  { label: "Solicitudes",        key: "totalRequests", iconIndex: 3, color: "gold"    },
];

function getStats(endpoint: string) {
  if (endpoint.includes("admin"))  return adminStats;
  if (endpoint.includes("artist")) return artistStats;
  return managerStats;
}

export function PanelDashboardPage({ title, description, endpoint }: { title: string; description: string; endpoint: string }) {
  const { data, isLoading, error, refetch } = useDashboard(endpoint);
  const interactions = Array.isArray(data?.interactions) ? data.interactions : [];
  const activity     = Array.isArray(data?.activity)     ? data.activity     : [];
  const allActivity  = [...interactions, ...activity].slice(0, 10);
  const stats        = getStats(endpoint);

  return (
    <div className="animate-fade-in">
      <PageHeader title={title} description={description} />

      {error ? (
        <ErrorState title="No se pudo cargar el dashboard" description={error} onRetry={refetch} />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.slice(0, 4).map((stat) => {
              const Icon  = STAT_ICONS[stat.iconIndex];
              const value = num(data?.[stat.key as keyof typeof data] ?? data?.[stat.altKey as keyof typeof data]);
              return (
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  value={value.toLocaleString("es-CO")}
                  icon={<Icon size={20} aria-hidden="true" />}
                />
              );
            })}
          </div>

          {/* Secondary stats */}
          {stats.length > 4 && (
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {stats.slice(4).map((stat) => {
                const Icon  = STAT_ICONS[stat.iconIndex];
                const value = num(data?.[stat.key as keyof typeof data] ?? data?.[stat.altKey as keyof typeof data]);
                return (
                  <StatCard
                    key={stat.label}
                    label={stat.label}
                    value={value.toLocaleString("es-CO")}
                    icon={<Icon size={18} aria-hidden="true" />}
                  />
                );
              })}
            </div>
          )}

          {/* Activity */}
          <div className="mt-10">
            <div className="mb-4 flex items-center gap-2">
              <Activity size={18} className="text-brand-greenDark" aria-hidden="true" />
              <h2 className="text-lg font-black text-brand-ink">Actividad reciente</h2>
            </div>
            {allActivity.length ? (
              <Table
                caption="Actividad reciente de la plataforma"
                headers={["Tipo / Acción", "Entidad", "Fecha"]}
                rows={allActivity.map((item) => {
                  const record = item as { type?: string; action?: string; targetType?: string; entityType?: string; createdAt?: string };
                  return [
                    record.type ?? record.action ?? "Actividad",
                    record.targetType ?? record.entityType ?? "Sistema",
                    record.createdAt ? new Date(record.createdAt).toLocaleString("es-CO") : "—"
                  ];
                })}
              />
            ) : (
              <EmptyState
                title="Sin actividad reciente"
                description="Las interacciones y acciones del sistema aparecerán aquí."
                icon={<Activity size={24} />}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

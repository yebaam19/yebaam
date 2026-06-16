import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/Skeleton";
import { Table } from "../components/ui/Table";
import { useApiQuery } from "../hooks/useApiQuery";
import type { Paginated, User } from "../types";

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    FOLLOWER: "Seguidor",
    ARTIST: "Artista",
    MANAGER: "Manager",
    PLATFORM_ADMIN: "Admin"
  };

  return labels[role] ?? role;
}

export function AdminUsersPage() {
  const { data, isLoading, error, refetch } = useApiQuery<Paginated<User>>("/users?limit=50");
  const users = data?.items ?? [];

  return (
    <section className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Listado real de usuarios registrados, roles y estado de cuenta en PerfilArtístico."
      />

      {isLoading ? <Skeleton className="h-72" /> : null}
      {error ? <ErrorState description={error} onRetry={refetch} /> : null}

      {!isLoading && !error && users.length === 0 ? (
        <EmptyState title="No hay usuarios registrados" description="Cuando existan usuarios aparecerán en este panel." />
      ) : null}

      {!isLoading && !error && users.length > 0 ? (
        <>
          <div className="hidden lg:block">
            <Table
              caption="Usuarios registrados"
              headers={["Nombre", "Email", "Rol", "Estado", "Ubicación"]}
              rows={users.map((user) => [
                user.displayName,
                user.email,
                roleLabel(user.role),
                user.status,
                [user.city, user.country].filter(Boolean).join(", ") || "Sin ubicación"
              ])}
            />
          </div>

          <div className="grid gap-4 lg:hidden">
            {users.map((user) => (
              <Card key={user.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-brand-ink">{user.displayName}</h2>
                    <p className="text-sm text-brand-muted">{user.email}</p>
                  </div>
                  <Badge variant={user.status === "ACTIVE" ? "green" : "warning"}>{user.status}</Badge>
                </div>
                <p className="text-sm text-brand-muted">
                  {roleLabel(user.role)} · {[user.city, user.country].filter(Boolean).join(", ") || "Sin ubicación"}
                </p>
              </Card>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

import { useEffect, useState } from 'react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../../components/admin/AdminState';
import api from '../../lib/api';

interface ActivityLog {
  id: string;
  action: string;
  details?: string | null;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string } | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ActivityAdmin() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function fetchLogs() {
    setLoading(true);
    api.get<{ ok: boolean; data: ActivityLog[] }>('/admin/activity')
      .then((response) => {
        setLogs(response.data.data);
        setError(null);
      })
      .catch((err: { message?: string }) => setError(err.message ?? 'No se pudo cargar la actividad'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Actividad"
        description="Registro administrativo de acciones relevantes de la plataforma."
      />

      {loading ? (
        <AdminLoadingState rows={6} />
      ) : error ? (
        <AdminErrorState message={error} onRetry={fetchLogs} />
      ) : !logs.length ? (
        <AdminEmptyState title="Sin actividad registrada" description="Las acciones administrativas aparecerán aquí cuando el backend las registre." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Acción</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Detalle</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{log.action}</td>
                  <td className="px-4 py-3 text-slate-600">{log.details ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Sistema'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

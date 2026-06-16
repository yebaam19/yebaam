import { useState } from 'react';
import { useTrialClasses } from '../../hooks/useTrialClasses';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import type { TrialClass, TrialStatus } from '../../types';

type FilterOption = TrialStatus | 'ALL';

const STATUS_LABELS: Record<TrialStatus, string> = {
  REQUESTED: 'Solicitada',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
};

const STATUS_BADGE: Record<TrialStatus, 'info' | 'success' | 'default' | 'warning'> = {
  REQUESTED: 'info',
  CONFIRMED: 'success',
  CANCELLED: 'default',
  COMPLETED: 'warning',
};

const NEXT_STATUSES: Record<TrialStatus, TrialStatus[]> = {
  REQUESTED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'CANCELLED'],
  CANCELLED: ['REQUESTED'],
  COMPLETED: [],
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function TrialClassesAdmin() {
  const { trials, loading, error, updateStatus } = useTrialClasses();
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState<FilterOption>('ALL');
  const [query, setQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedTrial, setSelectedTrial] = useState<TrialClass | null>(null);

  const filtered = trials.filter((trial) => {
    const matchesStatus = statusFilter === 'ALL' || trial.status === statusFilter;
    const text = `${trial.name} ${trial.email} ${trial.phone} ${trial.message ?? ''} ${trial.program?.name ?? ''} ${trial.school?.name ?? ''}`.toLowerCase();
    return matchesStatus && text.includes(query.toLowerCase().trim());
  });

  async function handleStatusChange(id: string, newStatus: TrialStatus) {
    setUpdatingId(id);
    try {
      await updateStatus(id, newStatus);
      showToast(`Clase actualizada a "${STATUS_LABELS[newStatus]}"`, 'success');
    } catch {
      showToast('No se pudo actualizar el estado', 'error');
    } finally {
      setUpdatingId(null);
    }
  }

  const FILTERS: FilterOption[] = ['ALL', 'REQUESTED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
  const FILTER_LABELS: Record<FilterOption, string> = { ALL: 'Todas', ...STATUS_LABELS };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Clases de prueba"
        description="Bandeja real de solicitudes para clases abiertas o sesiones de prueba."
        meta={<Badge variant="info">{trials.filter((trial) => trial.status === 'REQUESTED').length} solicitadas</Badge>}
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre, email, teléfono, programa o escuela..."
          className="h-10 min-w-0 rounded-xl border border-slate-200 px-4 text-sm focus:border-[#006b2d] focus:outline-none lg:w-96"
        />
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                statusFilter === f
                  ? 'bg-[#006b2d] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {FILTER_LABELS[f]}
              {f !== 'ALL' && (
                <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                  {trials.filter((t) => t.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="56px" className="w-full" />
          ))}
        </div>
      ) : error ? (
        <EmptyState title="Error" description={error} />
      ) : !filtered.length ? (
        <EmptyState
          title={statusFilter === 'ALL' ? 'Sin solicitudes aún' : `Sin clases con estado "${FILTER_LABELS[statusFilter]}"`}
          description="Las solicitudes de clase de prueba aparecerán aquí."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Solicitado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Contacto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Fecha preferida</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Programa</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Escuela</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((trial) => (
                <tr key={trial.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(trial.createdAt)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{trial.name}</p>
                    {trial.message && (
                      <p className="line-clamp-1 max-w-xs text-xs text-slate-400">{trial.message}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{trial.email}</p>
                    <p className="text-xs text-slate-400">{trial.phone}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatDate(trial.preferredDate)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {trial.program?.name ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {trial.school?.name ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_BADGE[trial.status]}>{STATUS_LABELS[trial.status]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => setSelectedTrial(trial)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-100"
                      >
                        Ver detalle
                      </button>
                      {NEXT_STATUSES[trial.status].map((next) => (
                        <button
                          key={next}
                          disabled={updatingId === trial.id}
                          onClick={() => handleStatusChange(trial.id, next)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-100 disabled:opacity-50"
                        >
                          {updatingId === trial.id ? '...' : STATUS_LABELS[next]}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!selectedTrial} onClose={() => setSelectedTrial(null)} title="Detalle de clase de prueba" maxWidth="max-w-2xl">
        {selectedTrial && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><p className="text-xs font-semibold uppercase text-slate-400">Nombre</p><p className="font-semibold text-slate-900">{selectedTrial.name}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Estado</p><Badge variant={STATUS_BADGE[selectedTrial.status]}>{STATUS_LABELS[selectedTrial.status]}</Badge></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Email</p><p>{selectedTrial.email}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Teléfono</p><p>{selectedTrial.phone}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Fecha preferida</p><p>{formatDate(selectedTrial.preferredDate)}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Solicitada</p><p>{formatDate(selectedTrial.createdAt)}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Programa</p><p>{selectedTrial.program?.name ?? 'Sin preferencia'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Escuela</p><p>{selectedTrial.school?.name ?? '—'}</p></div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Mensaje</p>
              <p className="mt-1 rounded-2xl bg-slate-50 p-4 leading-6 text-slate-700">{selectedTrial.message || 'Sin mensaje adicional.'}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

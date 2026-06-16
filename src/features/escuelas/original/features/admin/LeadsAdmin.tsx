import { useState } from 'react';
import { useLeads } from '../../hooks/useLeads';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import Modal from '../../components/ui/Modal';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import type { EnrollmentLead, LeadStatus } from '../../types';

type FilterOption = LeadStatus | 'ALL';

const STATUS_LABELS: Record<LeadStatus, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  CONVERTED: 'Convertido',
  LOST: 'Perdido',
};

const STATUS_BADGE: Record<LeadStatus, 'info' | 'warning' | 'success' | 'default'> = {
  NEW: 'info',
  CONTACTED: 'warning',
  CONVERTED: 'success',
  LOST: 'default',
};

const NEXT_STATUSES: Record<LeadStatus, LeadStatus[]> = {
  NEW: ['CONTACTED', 'LOST'],
  CONTACTED: ['CONVERTED', 'LOST'],
  CONVERTED: [],
  LOST: ['NEW'],
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function LeadsAdmin() {
  const { leads, loading, error, updateStatus } = useLeads();
  const { showToast } = useToast();
  const [statusFilter, setStatusFilter] = useState<FilterOption>('ALL');
  const [query, setQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<EnrollmentLead | null>(null);

  const filtered = leads.filter((lead) => {
    const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
    const text = `${lead.name} ${lead.email} ${lead.phone} ${lead.message ?? ''} ${lead.program?.name ?? ''} ${lead.school?.name ?? ''}`.toLowerCase();
    return matchesStatus && text.includes(query.toLowerCase().trim());
  });

  async function handleStatusChange(id: string, newStatus: LeadStatus) {
    setUpdatingId(id);
    try {
      await updateStatus(id, newStatus);
      showToast(`Lead actualizado a "${STATUS_LABELS[newStatus]}"`, 'success');
    } catch {
      showToast('No se pudo actualizar el estado', 'error');
    } finally {
      setUpdatingId(null);
    }
  }

  const FILTERS: FilterOption[] = ['ALL', 'NEW', 'CONTACTED', 'CONVERTED', 'LOST'];
  const FILTER_LABELS: Record<FilterOption, string> = { ALL: 'Todos', ...STATUS_LABELS };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Solicitudes de información"
        description="Bandeja real de leads enviados desde perfiles, programas y formularios públicos."
        meta={<Badge variant="info">{leads.filter((lead) => lead.status === 'NEW').length} nuevos</Badge>}
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
                  {leads.filter((l) => l.status === f).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height="56px" className="w-full" />
          ))}
        </div>
      ) : error ? (
        <EmptyState title="Error" description={error} />
      ) : !filtered.length ? (
        <EmptyState
          title={statusFilter === 'ALL' ? 'Sin leads aún' : `Sin leads con estado "${FILTER_LABELS[statusFilter]}"`}
          description="Los leads aparecerán aquí cuando alguien complete el formulario de contacto."
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase text-xs tracking-wide">Fecha</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase text-xs tracking-wide">Nombre</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase text-xs tracking-wide">Contacto</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase text-xs tracking-wide">Programa</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase text-xs tracking-wide">Escuela</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase text-xs tracking-wide">Estado</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-500 uppercase text-xs tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(lead.createdAt)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{lead.name}</p>
                    {lead.message && (
                      <p className="text-xs text-slate-400 line-clamp-1 max-w-xs">{lead.message}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-700">{lead.email}</p>
                    <p className="text-xs text-slate-400">{lead.phone}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {lead.program?.name ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {lead.school?.name ?? <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_BADGE[lead.status]}>{STATUS_LABELS[lead.status]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => setSelectedLead(lead)}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-100"
                      >
                        Ver detalle
                      </button>
                      {NEXT_STATUSES[lead.status].map((next) => (
                        <button
                          key={next}
                          disabled={updatingId === lead.id}
                          onClick={() => handleStatusChange(lead.id, next)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-100 disabled:opacity-50"
                        >
                          {updatingId === lead.id ? '...' : STATUS_LABELS[next]}
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

      <Modal open={!!selectedLead} onClose={() => setSelectedLead(null)} title="Detalle de solicitud" maxWidth="max-w-2xl">
        {selectedLead && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><p className="text-xs font-semibold uppercase text-slate-400">Nombre</p><p className="font-semibold text-slate-900">{selectedLead.name}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Estado</p><Badge variant={STATUS_BADGE[selectedLead.status]}>{STATUS_LABELS[selectedLead.status]}</Badge></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Email</p><p>{selectedLead.email}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Teléfono</p><p>{selectedLead.phone}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Método preferido</p><p>{selectedLead.preferredContactMethod}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Fecha</p><p>{formatDate(selectedLead.createdAt)}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Programa</p><p>{selectedLead.program?.name ?? 'Sin preferencia'}</p></div>
              <div><p className="text-xs font-semibold uppercase text-slate-400">Escuela</p><p>{selectedLead.school?.name ?? '—'}</p></div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Mensaje</p>
              <p className="mt-1 rounded-2xl bg-slate-50 p-4 leading-6 text-slate-700">{selectedLead.message || 'Sin mensaje adicional.'}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

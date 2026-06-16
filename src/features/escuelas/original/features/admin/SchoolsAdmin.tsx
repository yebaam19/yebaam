import { useState } from 'react';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useAdminSchools, type AdminSchoolOption } from '../../hooks/useAdminSchools';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../../components/admin/AdminState';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Badge from '../../components/ui/Badge';

const CATEGORY_LABELS: Record<string, string> = {
  MUSIC: 'Música',
  ARTS: 'Artes Plásticas',
  DANCE: 'Danza',
  THEATER: 'Teatro',
  MULTIDISCIPLINARY: 'Multidisciplinario',
};

const SCHOOL_TYPE_LABELS: Record<string, string> = {
  PRIVATE: 'Privada',
  PUBLIC: 'Pública',
  NON_PROFIT: 'Sin fines de lucro',
  COLLEGE: 'Universidad',
};

type ConfirmAction = 'activate' | 'deactivate' | 'verify' | 'unverify';

interface ConfirmTarget {
  school: AdminSchoolOption;
  action: ConfirmAction;
}

const CONFIRM_CONFIG: Record<ConfirmAction, { title: string; description: string; confirmLabel: string; tone: 'danger' | 'default' }> = {
  activate: {
    title: 'Activar escuela',
    description: 'La escuela volverá a ser visible en listados públicos.',
    confirmLabel: 'Activar',
    tone: 'default',
  },
  deactivate: {
    title: 'Desactivar escuela',
    description: 'La escuela dejará de aparecer en listados públicos. Los datos se conservan.',
    confirmLabel: 'Desactivar',
    tone: 'danger',
  },
  verify: {
    title: 'Verificar escuela',
    description: 'Se mostrará el sello de escuela verificada en su perfil público.',
    confirmLabel: 'Verificar',
    tone: 'default',
  },
  unverify: {
    title: 'Retirar verificación',
    description: 'Se eliminará el sello de verificación del perfil público de la escuela.',
    confirmLabel: 'Retirar verificación',
    tone: 'danger',
  },
};

export default function SchoolsAdmin() {
  const { showToast } = useToast();
  const { schools, loading, error, refetch } = useAdminSchools();

  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filtered = schools.filter((school) => {
    const matchesText = `${school.name} ${school.city}`.toLowerCase().includes(query.toLowerCase().trim());
    const matchesCategory = categoryFilter === 'ALL' || school.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'active' && school.isActive) ||
      (statusFilter === 'inactive' && !school.isActive);
    return matchesText && matchesCategory && matchesStatus;
  });

  async function handleConfirm() {
    if (!confirmTarget) return;
    const { school, action } = confirmTarget;
    setSubmitting(true);
    try {
      if (action === 'activate' || action === 'deactivate') {
        await api.patch(`/schools/${school.id}/status`, { isActive: action === 'activate' });
        showToast(action === 'activate' ? 'Escuela activada' : 'Escuela desactivada', 'success');
      } else {
        await api.patch(`/schools/${school.id}`, { isVerified: action === 'verify' });
        showToast(action === 'verify' ? 'Escuela verificada' : 'Verificación retirada', 'success');
      }
      refetch();
      setConfirmTarget(null);
    } catch {
      showToast('No se pudo completar la acción', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const activeCount = schools.filter((s) => s.isActive).length;
  const verifiedCount = schools.filter((s) => s.isVerified).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gestión de escuelas"
        description="Administra todas las escuelas de la plataforma: activa, desactiva y verifica perfiles."
        meta={
          <div className="flex gap-2">
            <Badge variant="success">{activeCount} activas</Badge>
            <Badge variant="info">{verifiedCount} verificadas</Badge>
          </div>
        }
      />

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_auto_auto]">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nombre o ciudad..."
          className="h-10 rounded-xl border border-slate-200 px-4 text-sm focus:border-[#006b2d] focus:outline-none"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 px-4 text-sm focus:border-[#006b2d] focus:outline-none"
        >
          <option value="ALL">Todas las disciplinas</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-slate-200 px-4 text-sm focus:border-[#006b2d] focus:outline-none"
        >
          <option value="ALL">Todos los estados</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
        </select>
      </div>

      {loading ? (
        <AdminLoadingState rows={6} />
      ) : error ? (
        <AdminErrorState message={error} onRetry={refetch} />
      ) : !filtered.length ? (
        <AdminEmptyState
          title="Sin escuelas"
          description={query || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
            ? 'No hay escuelas que coincidan con los filtros.'
            : 'Aún no hay escuelas registradas en la plataforma.'}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Escuela</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Ciudad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Disciplina</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((school) => (
                <tr key={school.id} className={`hover:bg-slate-50 ${!school.isActive ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{school.name}</p>
                      <p className="text-xs text-slate-400">{school.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{school.city}</td>
                  <td className="px-4 py-3">
                    <Badge variant="default">{CATEGORY_LABELS[school.category] ?? school.category}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{SCHOOL_TYPE_LABELS[school.schoolType] ?? school.schoolType}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {school.isActive ? (
                        <Badge variant="success">Activa</Badge>
                      ) : (
                        <Badge variant="default">Inactiva</Badge>
                      )}
                      {school.isVerified && <Badge variant="info">Verificada</Badge>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {school.isActive ? (
                        <button
                          onClick={() => setConfirmTarget({ school, action: 'deactivate' })}
                          className="rounded-full border border-red-100 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Desactivar
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmTarget({ school, action: 'activate' })}
                          className="rounded-full border border-green-200 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                        >
                          Activar
                        </button>
                      )}
                      {school.isVerified ? (
                        <button
                          onClick={() => setConfirmTarget({ school, action: 'unverify' })}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          Quitar verificación
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmTarget({ school, action: 'verify' })}
                          className="rounded-full border border-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                        >
                          Verificar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmTarget && (
        <ConfirmDialog
          open
          title={CONFIRM_CONFIG[confirmTarget.action].title}
          description={`${CONFIRM_CONFIG[confirmTarget.action].description} Escuela: "${confirmTarget.school.name}".`}
          confirmLabel={CONFIRM_CONFIG[confirmTarget.action].confirmLabel}
          tone={CONFIRM_CONFIG[confirmTarget.action].tone}
          loading={submitting}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmTarget(null)}
        />
      )}
    </div>
  );
}

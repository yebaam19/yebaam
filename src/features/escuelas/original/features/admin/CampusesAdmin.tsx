import { FormEvent, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAdminSchools } from '../../hooks/useAdminSchools';
import { useCampusesAdmin, type CampusAdminPayload } from '../../hooks/useCampusesAdmin';
import type { Campus } from '../../types';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../../components/admin/AdminState';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

type CampusForm = {
  schoolId: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  latitude: string;
  longitude: string;
  isActive: boolean;
};

const EMPTY_FORM: CampusForm = {
  schoolId: '',
  name: '',
  city: '',
  address: '',
  phone: '',
  latitude: '',
  longitude: '',
  isActive: true,
};

function inputCls() {
  return 'mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#006b2d] focus:outline-none';
}

function labelCls() {
  return 'block text-xs font-semibold uppercase tracking-wide text-slate-500';
}

function campusToForm(campus: Campus): CampusForm {
  return {
    schoolId: campus.schoolId ?? '',
    name: campus.name,
    city: campus.city,
    address: campus.address,
    phone: campus.phone,
    latitude: campus.latitude != null ? String(campus.latitude) : '',
    longitude: campus.longitude != null ? String(campus.longitude) : '',
    isActive: campus.isActive,
  };
}

export default function CampusesAdmin() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { schools } = useAdminSchools();
  const { campuses, loading, error, refetch, createCampus, updateCampus, deactivateCampus } = useCampusesAdmin();
  const isPlatformAdmin = user?.role === 'PLATFORM_ADMIN';

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CampusForm>(EMPTY_FORM);
  const [query, setQuery] = useState('');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<Campus | null>(null);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, schoolId: schools[0]?.id ?? '' });
    setFormErrors([]);
    setModalOpen(true);
  }

  function openEdit(campus: Campus) {
    setEditingId(campus.id);
    setForm(campusToForm(campus));
    setFormErrors([]);
    setModalOpen(true);
  }

  function validateForm() {
    const errors: string[] = [];
    if (isPlatformAdmin && !form.schoolId) errors.push('Selecciona la escuela asociada.');
    if (form.name.trim().length < 3) errors.push('El nombre debe tener al menos 3 caracteres.');
    if (form.city.trim().length < 2) errors.push('La ciudad es obligatoria.');
    if (form.address.trim().length < 5) errors.push('La dirección debe tener al menos 5 caracteres.');
    if (form.phone.trim().length < 6) errors.push('El teléfono debe tener al menos 6 caracteres.');
    if (form.latitude && Number.isNaN(Number(form.latitude))) errors.push('La latitud debe ser numérica.');
    if (form.longitude && Number.isNaN(Number(form.longitude))) errors.push('La longitud debe ser numérica.');
    setFormErrors(errors);
    return errors.length === 0;
  }

  function buildPayload(): CampusAdminPayload {
    return {
      ...(isPlatformAdmin ? { schoolId: form.schoolId } : {}),
      name: form.name.trim(),
      city: form.city.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      isActive: form.isActive,
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await updateCampus(editingId, buildPayload());
        showToast('Sede actualizada', 'success');
      } else {
        await createCampus(buildPayload());
        showToast('Sede creada', 'success');
      }
      setModalOpen(false);
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'Error al guardar sede', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    setSubmitting(true);
    try {
      await deactivateCampus(deactivateTarget.id);
      showToast('Sede desactivada', 'success');
      setDeactivateTarget(null);
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'No se pudo desactivar la sede', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const visibleCampuses = campuses.filter((campus) => `${campus.name} ${campus.city} ${campus.address}`.toLowerCase().includes(query.toLowerCase().trim()));
  const activeCount = campuses.filter((campus) => campus.isActive).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Sedes"
        description="Gestiona las ubicaciones físicas donde se imparten programas, talleres, muestras y clases de prueba."
        meta={<Badge variant="success">{activeCount} activas</Badge>}
        actions={<button type="button" onClick={openCreate} className="rounded-full bg-[#006b2d] px-5 py-2 text-sm font-semibold text-white hover:bg-[#005723]">Nueva sede</button>}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por sede, ciudad o dirección..." className="h-10 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-[#006b2d] focus:outline-none sm:w-96" />
      </div>

      {loading ? (
        <AdminLoadingState rows={5} />
      ) : error ? (
        <AdminErrorState message={error} onRetry={refetch} />
      ) : !visibleCampuses.length ? (
        <AdminEmptyState title="Sin sedes" description="Agrega al menos una sede para asociarla a programas y horarios." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Sede</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Ciudad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Teléfono</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {visibleCampuses.map((campus) => (
                <tr key={campus.id} className={`hover:bg-slate-50 ${!campus.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3"><p className="font-semibold text-slate-900">{campus.name}</p><p className="text-xs text-slate-500">{campus.address}</p></td>
                  <td className="px-4 py-3 text-slate-600">{campus.city}</td>
                  <td className="px-4 py-3 text-slate-600">{campus.phone}</td>
                  <td className="px-4 py-3">{campus.isActive ? <Badge variant="success">Activa</Badge> : <Badge variant="default">Inactiva</Badge>}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEdit(campus)} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-100">Editar</button>
                      {campus.isActive ? <button type="button" onClick={() => setDeactivateTarget(campus)} className="rounded-full border border-red-100 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Desactivar</button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar sede' : 'Nueva sede'} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formErrors.length ? <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{formErrors.map((item) => <p key={item}>{item}</p>)}</div> : null}
          {isPlatformAdmin ? <div><label className={labelCls()}>Escuela asociada *</label><select value={form.schoolId} onChange={(event) => setForm({ ...form, schoolId: event.target.value })} required className={inputCls()}><option value="">Seleccionar escuela</option>{schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}</select></div> : null}
          <div><label className={labelCls()}>Nombre *</label><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required className={inputCls()} /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className={labelCls()}>Ciudad *</label><input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} required className={inputCls()} /></div>
            <div><label className={labelCls()}>Teléfono *</label><input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required className={inputCls()} /></div>
          </div>
          <div><label className={labelCls()}>Dirección *</label><input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} required className={inputCls()} /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className={labelCls()}>Latitud</label><input value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} className={inputCls()} /></div>
            <div><label className={labelCls()}>Longitud</label><input value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} className={inputCls()} /></div>
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} className="accent-[#006b2d]" /> Sede activa</label>
          <button type="submit" disabled={submitting} className="w-full rounded-full bg-[#006b2d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#005723] disabled:opacity-60">{submitting ? 'Guardando...' : 'Guardar sede'}</button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deactivateTarget} title="Desactivar sede" description="La sede dejará de estar disponible para programas y horarios nuevos." confirmLabel="Desactivar" tone="danger" loading={submitting} onConfirm={handleDeactivate} onCancel={() => setDeactivateTarget(null)} />
    </div>
  );
}

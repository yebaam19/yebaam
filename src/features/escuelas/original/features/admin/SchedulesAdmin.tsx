import { FormEvent, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { useSchedulesAdmin, type ScheduleAdminPayload } from '../../hooks/useSchedulesAdmin';
import type { ScheduleSlot } from '../../types';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../../components/admin/AdminState';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

type ScheduleForm = {
  programId: string;
  campusId: string;
  weekday: string;
  startsAt: string;
  endsAt: string;
  capacity: string;
  isActive: boolean;
};

const EMPTY_FORM: ScheduleForm = {
  programId: '',
  campusId: '',
  weekday: '1',
  startsAt: '18:00',
  endsAt: '20:00',
  capacity: '10',
  isActive: true,
};

const WEEKDAY_LABELS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function inputCls() {
  return 'mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#006b2d] focus:outline-none';
}

function labelCls() {
  return 'block text-xs font-semibold uppercase tracking-wide text-slate-500';
}

function scheduleToForm(schedule: ScheduleSlot): ScheduleForm {
  return {
    programId: schedule.programId ?? '',
    campusId: schedule.campusId ?? '',
    weekday: String(schedule.weekday),
    startsAt: schedule.startsAt,
    endsAt: schedule.endsAt,
    capacity: String(schedule.capacity),
    isActive: schedule.isActive ?? true,
  };
}

export default function SchedulesAdmin() {
  const { showToast } = useToast();
  const { schedules, programs, campuses, loading, error, refetch, createSchedule, updateSchedule, deactivateSchedule } = useSchedulesAdmin();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScheduleForm>(EMPTY_FORM);
  const [query, setQuery] = useState('');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<ScheduleSlot | null>(null);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, programId: programs[0]?.id ?? '' });
    setFormErrors([]);
    setModalOpen(true);
  }

  function openEdit(schedule: ScheduleSlot) {
    setEditingId(schedule.id);
    setForm(scheduleToForm(schedule));
    setFormErrors([]);
    setModalOpen(true);
  }

  function validateForm() {
    const errors: string[] = [];
    if (!form.programId) errors.push('Selecciona el programa.');
    if (!/^\d{2}:\d{2}$/.test(form.startsAt)) errors.push('La hora inicio debe tener formato HH:mm.');
    if (!/^\d{2}:\d{2}$/.test(form.endsAt)) errors.push('La hora fin debe tener formato HH:mm.');
    if (form.endsAt <= form.startsAt) errors.push('La hora fin debe ser posterior a la hora inicio.');
    if (!form.capacity || Number(form.capacity) < 1) errors.push('El cupo debe ser mayor a cero.');
    setFormErrors(errors);
    return errors.length === 0;
  }

  function buildPayload(): ScheduleAdminPayload {
    return {
      programId: form.programId,
      campusId: form.campusId || null,
      weekday: Number(form.weekday),
      startsAt: form.startsAt,
      endsAt: form.endsAt,
      capacity: Number(form.capacity),
      isActive: form.isActive,
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await updateSchedule(editingId, buildPayload());
        showToast('Horario actualizado', 'success');
      } else {
        await createSchedule(buildPayload());
        showToast('Horario creado', 'success');
      }
      setModalOpen(false);
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'Error al guardar horario', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    setSubmitting(true);
    try {
      await deactivateSchedule(deactivateTarget.id);
      showToast('Horario desactivado', 'success');
      setDeactivateTarget(null);
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'No se pudo desactivar el horario', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const visibleSchedules = schedules.filter((schedule) => {
    const text = `${schedule.program?.name ?? ''} ${schedule.campus?.name ?? ''} ${WEEKDAY_LABELS[schedule.weekday]}`.toLowerCase();
    return text.includes(query.toLowerCase().trim());
  });
  const activeCount = schedules.filter((schedule) => schedule.isActive !== false).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Horarios"
        description="Crea horarios por programa, sede, día, hora y cupos. Estos datos ayudan a orientar solicitudes y clases de prueba."
        meta={<Badge variant="success">{activeCount} activos</Badge>}
        actions={<button type="button" onClick={openCreate} className="rounded-full bg-[#006b2d] px-5 py-2 text-sm font-semibold text-white hover:bg-[#005723]">Nuevo horario</button>}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por programa, sede o día..." className="h-10 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-[#006b2d] focus:outline-none sm:w-96" />
      </div>

      {loading ? (
        <AdminLoadingState rows={5} />
      ) : error ? (
        <AdminErrorState message={error} onRetry={refetch} />
      ) : !visibleSchedules.length ? (
        <AdminEmptyState title="Sin horarios" description="Agrega horarios para que los programas tengan cupos y franjas claras." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Programa</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Sede</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Horario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Cupos</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {visibleSchedules.map((schedule) => (
                <tr key={schedule.id} className={`hover:bg-slate-50 ${schedule.isActive === false ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3 font-semibold text-slate-900">{schedule.program?.name ?? 'Programa'}</td>
                  <td className="px-4 py-3 text-slate-600">{schedule.campus?.name ?? 'Sin sede'}</td>
                  <td className="px-4 py-3 text-slate-600">{WEEKDAY_LABELS[schedule.weekday]} · {schedule.startsAt}-{schedule.endsAt}</td>
                  <td className="px-4 py-3 text-slate-600">{schedule.capacity}</td>
                  <td className="px-4 py-3">{schedule.isActive !== false ? <Badge variant="success">Activo</Badge> : <Badge variant="default">Inactivo</Badge>}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => openEdit(schedule)} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-100">Editar</button>
                      {schedule.isActive !== false ? <button type="button" onClick={() => setDeactivateTarget(schedule)} className="rounded-full border border-red-100 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Desactivar</button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar horario' : 'Nuevo horario'} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formErrors.length ? <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{formErrors.map((item) => <p key={item}>{item}</p>)}</div> : null}
          <div><label className={labelCls()}>Programa *</label><select value={form.programId} onChange={(event) => setForm({ ...form, programId: event.target.value })} required className={inputCls()}><option value="">Seleccionar programa</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></div>
          <div><label className={labelCls()}>Sede</label><select value={form.campusId} onChange={(event) => setForm({ ...form, campusId: event.target.value })} className={inputCls()}><option value="">Sin sede específica</option>{campuses.map((campus) => <option key={campus.id} value={campus.id}>{campus.name} · {campus.city}</option>)}</select></div>
          <div className="grid gap-4 md:grid-cols-3">
            <div><label className={labelCls()}>Día *</label><select value={form.weekday} onChange={(event) => setForm({ ...form, weekday: event.target.value })} className={inputCls()}>{WEEKDAY_LABELS.map((label, index) => <option key={label} value={index}>{label}</option>)}</select></div>
            <div><label className={labelCls()}>Inicio *</label><input type="time" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} className={inputCls()} /></div>
            <div><label className={labelCls()}>Fin *</label><input type="time" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} className={inputCls()} /></div>
          </div>
          <div><label className={labelCls()}>Cupos *</label><input type="number" min="1" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} className={inputCls()} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} className="accent-[#006b2d]" /> Horario activo</label>
          <button type="submit" disabled={submitting} className="w-full rounded-full bg-[#006b2d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#005723] disabled:opacity-60">{submitting ? 'Guardando...' : 'Guardar horario'}</button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deactivateTarget} title="Desactivar horario" description="El horario dejará de estar disponible para referencia pública y gestión de cupos." confirmLabel="Desactivar" tone="danger" loading={submitting} onConfirm={handleDeactivate} onCancel={() => setDeactivateTarget(null)} />
    </div>
  );
}

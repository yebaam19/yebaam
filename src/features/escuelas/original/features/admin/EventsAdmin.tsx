import { FormEvent, useMemo, useState } from 'react';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../../components/admin/AdminState';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import ImageUploadField from '../../components/admin/ImageUploadField';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAdminSchools } from '../../hooks/useAdminSchools';
import { useEventsAdmin, type EventAdminPayload } from '../../hooks/useEventsAdmin';
import type { SchoolEvent } from '../../types';

const EVENT_LABELS: Record<SchoolEvent['eventType'], string> = {
  RECITAL: 'Recital',
  SHOWCASE: 'Muestra',
  AUDITION: 'Audición',
  EXHIBITION: 'Exposición',
  OPEN_CLASS: 'Clase abierta',
  PRESENTATION: 'Presentación',
  WORKSHOP: 'Taller',
};

type EventFilter = 'ALL' | 'UPCOMING' | 'ARCHIVED';

interface EventForm {
  schoolId: string;
  title: string;
  description: string;
  eventType: SchoolEvent['eventType'];
  imageUrl: string;
  startsAt: string;
  endsAt: string;
  location: string;
}

const EMPTY_FORM: EventForm = {
  schoolId: '',
  title: '',
  description: '',
  eventType: 'RECITAL',
  imageUrl: '',
  startsAt: '',
  endsAt: '',
  location: '',
};

function inputCls() {
  return 'mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#006b2d] focus:outline-none';
}

const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-500';

function formatDateTime(iso?: string) {
  if (!iso) return 'Sin fecha';
  return new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function toDateTimeInput(value?: string) {
  return value ? value.slice(0, 16) : '';
}

function eventToForm(event: SchoolEvent): EventForm {
  return {
    schoolId: event.school?.id ?? '',
    title: event.title,
    description: event.description,
    eventType: event.eventType,
    imageUrl: event.imageUrl ?? '',
    startsAt: toDateTimeInput(event.startsAt),
    endsAt: toDateTimeInput(event.endsAt),
    location: event.location,
  };
}

function optionalString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function validUrl(value: string) {
  if (!value.trim()) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export default function EventsAdmin() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { events, loading, error, refetch, createEvent, updateEvent, archiveEvent } = useEventsAdmin();
  const { schools } = useAdminSchools();
  const isPlatformAdmin = user?.role === 'PLATFORM_ADMIN';

  const [filter, setFilter] = useState<EventFilter>('UPCOMING');
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<SchoolEvent | null>(null);

  const filteredEvents = useMemo(() => {
    const now = Date.now();
    return events.filter((event) => {
      const matchesStatus =
        filter === 'ALL' ||
        (filter === 'UPCOMING' && !event.isArchived && new Date(event.startsAt).getTime() >= now) ||
        (filter === 'ARCHIVED' && event.isArchived);
      const text = `${event.title} ${event.description} ${event.location} ${event.school?.name ?? ''}`.toLowerCase();
      return matchesStatus && text.includes(query.toLowerCase().trim());
    });
  }, [events, filter, query]);

  function validate() {
    const errors: string[] = [];
    if (isPlatformAdmin && !form.schoolId) errors.push('Selecciona la escuela asociada.');
    if (form.title.trim().length < 5) errors.push('El título debe tener al menos 5 caracteres.');
    if (form.description.trim().length < 10) errors.push('La descripción debe tener al menos 10 caracteres.');
    if (form.location.trim().length < 3) errors.push('La sede o lugar debe tener al menos 3 caracteres.');
    if (!form.startsAt) errors.push('La fecha y hora de inicio son obligatorias.');
    if (!form.endsAt) errors.push('La fecha y hora de fin son obligatorias.');
    if (form.startsAt && form.endsAt && new Date(form.endsAt) < new Date(form.startsAt)) {
      errors.push('La fecha de fin no puede ser anterior a la fecha de inicio.');
    }
    if (!validUrl(form.imageUrl)) errors.push('La imagen debe ser una URL válida.');
    setFormErrors(errors);
    return errors.length === 0;
  }

  function buildPayload(): EventAdminPayload {
    return {
      ...(isPlatformAdmin ? { schoolId: form.schoolId } : {}),
      title: form.title.trim(),
      description: form.description.trim(),
      eventType: form.eventType,
      imageUrl: optionalString(form.imageUrl),
      startsAt: form.startsAt,
      endsAt: form.endsAt,
      location: form.location.trim(),
    };
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, schoolId: schools[0]?.id ?? '' });
    setFormErrors([]);
    setModalOpen(true);
  }

  function openEdit(event: SchoolEvent) {
    setEditingId(event.id);
    setForm(eventToForm(event));
    setFormErrors([]);
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (editingId) {
        await updateEvent(editingId, buildPayload());
        showToast('Evento actualizado', 'success');
      } else {
        await createEvent(buildPayload());
        showToast('Evento creado', 'success');
      }
      setModalOpen(false);
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'No se pudo guardar el evento', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmArchive() {
    if (!archiveTarget) return;
    setSubmitting(true);
    try {
      await archiveEvent(archiveTarget.id);
      showToast('Evento archivado', 'success');
      setArchiveTarget(null);
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'No se pudo archivar el evento', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const upcomingCount = events.filter((event) => !event.isArchived && new Date(event.startsAt).getTime() >= Date.now()).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Eventos"
        description="Administra recitales, muestras, audiciones, exposiciones, clases abiertas y presentaciones."
        meta={<Badge variant="success">{upcomingCount} próximos</Badge>}
        actions={(
          <button type="button" onClick={openCreate} className="rounded-full bg-[#006b2d] px-5 py-2 text-sm font-semibold text-white hover:bg-[#005723]">
            Nuevo evento
          </button>
        )}
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por evento, sede o escuela..."
          className="h-10 min-w-0 rounded-xl border border-slate-200 px-4 text-sm focus:border-[#006b2d] focus:outline-none sm:w-80"
        />
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'UPCOMING', 'ARCHIVED'] as EventFilter[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-full px-4 py-2 text-xs font-semibold ${filter === item ? 'bg-[#006b2d] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {item === 'ALL' ? 'Todos' : item === 'UPCOMING' ? 'Próximos' : 'Archivados'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <AdminLoadingState rows={5} />
      ) : error ? (
        <AdminErrorState message={error} onRetry={refetch} />
      ) : !filteredEvents.length ? (
        <AdminEmptyState title="Sin eventos" description="Crea un evento para anunciar actividades, muestras o clases abiertas." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Evento</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo</th>
                {isPlatformAdmin && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Escuela</th>}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Inicio</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Sede</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEvents.map((event) => (
                <tr key={event.id} className={event.isArchived ? 'bg-slate-50 opacity-70' : 'hover:bg-slate-50'}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {event.imageUrl ? (
                        <img src={event.imageUrl} alt="" className="h-12 w-16 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-[#e8f5ec] text-[#006b2d]">
                          <span className="material-symbols-outlined text-xl">event</span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">{event.title}</p>
                        <p className="line-clamp-1 max-w-xs text-xs text-slate-500">{event.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge variant="info">{EVENT_LABELS[event.eventType]}</Badge></td>
                  {isPlatformAdmin && <td className="px-4 py-3 text-slate-600">{event.school?.name ?? 'Sin escuela'}</td>}
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDateTime(event.startsAt)}</td>
                  <td className="px-4 py-3 text-slate-600">{event.location}</td>
                  <td className="px-4 py-3">{event.isArchived ? <Badge>Archivado</Badge> : <Badge variant="success">Activo</Badge>}</td>
                  <td className="px-4 py-3">
                    {!event.isArchived ? (
                      <div className="flex gap-2">
                        <button type="button" onClick={() => openEdit(event)} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold hover:bg-slate-100">
                          Editar
                        </button>
                        <button type="button" onClick={() => setArchiveTarget(event)} className="rounded-full border border-red-100 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
                          Archivar
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar evento' : 'Nuevo evento'} maxWidth="max-w-3xl">
        <form onSubmit={handleSubmit} className="max-h-[76vh] space-y-5 overflow-y-auto pr-1">
          {formErrors.length > 0 && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              {formErrors.map((item) => <p key={item}>{item}</p>)}
            </div>
          )}
          {isPlatformAdmin && (
            <div>
              <label className={labelCls}>Escuela asociada *</label>
              <select value={form.schoolId} onChange={(event) => setForm({ ...form, schoolId: event.target.value })} className={inputCls()} required>
                <option value="">Seleccionar escuela</option>
                {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
              </select>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Título *</label>
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={inputCls()} required />
            </div>
            <div>
              <label className={labelCls}>Tipo *</label>
              <select value={form.eventType} onChange={(event) => setForm({ ...form, eventType: event.target.value as SchoolEvent['eventType'] })} className={inputCls()}>
                {Object.entries(EVENT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Descripción *</label>
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} className={inputCls()} required />
          </div>
          <ImageUploadField
            label="Imagen del evento"
            description="Imagen principal usada en el evento y en listados públicos."
            recommended="1200 x 675 px"
            maxSizeMb={3}
            minWidth={900}
            aspectRatio={1200 / 675}
            currentUrl={form.imageUrl}
            schoolId={form.schoolId || undefined}
            onChange={(url) => setForm({ ...form, imageUrl: url ?? '' })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Fecha y hora de inicio *</label>
              <input type="datetime-local" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} className={inputCls()} required />
            </div>
            <div>
              <label className={labelCls}>Fecha y hora de fin *</label>
              <input type="datetime-local" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} className={inputCls()} required />
            </div>
          </div>
          <div>
            <label className={labelCls}>Sede o lugar *</label>
            <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className={inputCls()} required placeholder="Auditorio, sede centro, galería..." />
          </div>
          <button type="submit" disabled={submitting} className="w-full rounded-full bg-[#006b2d] px-6 py-3 text-sm font-semibold text-white hover:bg-[#005723] disabled:opacity-60">
            {submitting ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear evento'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!archiveTarget}
        title="Archivar evento"
        description="El evento dejará de aparecer en listados públicos y quedará solo como histórico administrativo."
        confirmLabel="Archivar"
        tone="danger"
        loading={submitting}
        onConfirm={confirmArchive}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  );
}

import { FormEvent, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useProgramsAdmin, type AdminProgram, type ProgramAdminPayload } from '../../hooks/useProgramsAdmin';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../../components/admin/AdminState';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import ImageUploadField from '../../components/admin/ImageUploadField';
import { useAdminSchools } from '../../hooks/useAdminSchools';

const MODALITY_LABELS: Record<string, string> = {
  PRESENTIAL: 'Presencial', VIRTUAL: 'Virtual', HYBRID: 'Híbrido',
};
const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: 'Inicial', INTERMEDIATE: 'Intermedio',
  ADVANCED: 'Avanzado', PROFESSIONAL: 'Profesional',
};
const PROGRAM_TYPE_LABELS: Record<string, string> = {
  COURSE: 'Curso', WORKSHOP: 'Taller', CLASS: 'Clase',
  INTENSIVE: 'Intensivo', DIPLOMA: 'Diplomado',
};

type ProgramForm = {
  schoolId: string; name: string; disciplineId: string; campusId: string; instructorId: string;
  modality: string; level: string; programType: string;
  shortDescription: string; description: string;
  monthlyPrice: string; registrationFee: string; currency: string;
  ageRange: string; duration: string; scheduleSummary: string; imageUrl: string; sortOrder: string;
  trialClassAvailable: boolean; enrollmentOpen: boolean; materialsIncluded: boolean; isFeatured: boolean;
};

const EMPTY_FORM: ProgramForm = {
  schoolId: '', name: '', disciplineId: '', campusId: '', instructorId: '',
  modality: 'PRESENTIAL', level: 'BEGINNER', programType: 'COURSE',
  shortDescription: '', description: '',
  monthlyPrice: '', registrationFee: '', currency: 'EUR',
  ageRange: '', duration: '', scheduleSummary: '', imageUrl: '', sortOrder: '0',
  trialClassAvailable: false, enrollmentOpen: true, materialsIncluded: false, isFeatured: false,
};

function programToForm(p: AdminProgram): ProgramForm {
  return {
    name: p.name,
    schoolId: p.schoolId,
    disciplineId: p.disciplineId,
    campusId: p.campusId ?? '',
    instructorId: p.instructorId ?? '',
    modality: p.modality,
    level: p.level,
    programType: p.programType ?? 'COURSE',
    shortDescription: p.shortDescription,
    description: p.description,
    monthlyPrice: p.monthlyPrice != null ? String(p.monthlyPrice) : '',
    registrationFee: p.registrationFee != null ? String(p.registrationFee) : '',
    currency: p.currency,
    ageRange: p.ageRange,
    duration: p.duration,
    scheduleSummary: p.scheduleSummary,
    imageUrl: p.imageUrl ?? '',
    sortOrder: p.sortOrder != null ? String(p.sortOrder) : '0',
    trialClassAvailable: p.trialClassAvailable,
    enrollmentOpen: p.enrollmentOpen,
    materialsIncluded: p.materialsIncluded,
    isFeatured: p.isFeatured,
  };
}

function inputCls() {
  return 'mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#006b2d] focus:outline-none';
}
function labelCls() {
  return 'block text-xs font-semibold uppercase tracking-wide text-slate-500';
}

export default function ProgramsAdmin() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const {
    programs,
    disciplines,
    campuses,
    instructors,
    loading,
    error,
    refetch,
    createProgram,
    updateProgram,
    deactivateProgram,
  } = useProgramsAdmin();
  const { schools } = useAdminSchools();
  const isPlatformAdmin = user?.role === 'PLATFORM_ADMIN';

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProgramForm>(EMPTY_FORM);
  const [query, setQuery] = useState('');
  const [modalityFilter, setModalityFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminProgram | null>(null);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, schoolId: schools[0]?.id ?? '' });
    setFormErrors([]);
    setModalOpen(true);
  }

  function openEdit(program: AdminProgram) {
    setEditingId(program.id);
    setForm(programToForm(program));
    setFormErrors([]);
    setModalOpen(true);
  }

  function validateForm() {
    const errors: string[] = [];
    if (isPlatformAdmin && !form.schoolId) errors.push('Selecciona la escuela asociada.');
    if (form.name.trim().length < 3) errors.push('El nombre debe tener al menos 3 caracteres.');
    if (!form.disciplineId) errors.push('Selecciona una disciplina.');
    if (form.shortDescription.trim().length < 10) errors.push('La descripción corta debe tener al menos 10 caracteres.');
    if ((form.description || form.shortDescription).trim().length < 20) errors.push('La descripción completa debe tener al menos 20 caracteres.');
    if (form.monthlyPrice && Number(form.monthlyPrice) < 0) errors.push('El precio mensual no puede ser negativo.');
    if (form.registrationFee && Number(form.registrationFee) < 0) errors.push('La matrícula no puede ser negativa.');
    if (form.imageUrl) {
      try {
        new URL(form.imageUrl);
      } catch {
        errors.push('La URL de imagen debe ser válida.');
      }
    }
    setFormErrors(errors);
    return errors.length === 0;
  }

  function buildPayload(): ProgramAdminPayload {
    const payload: ProgramAdminPayload = {
      ...(isPlatformAdmin ? { schoolId: form.schoolId } : {}),
      name: form.name,
      disciplineId: form.disciplineId,
      modality: form.modality,
      level: form.level,
      programType: form.programType,
      shortDescription: form.shortDescription,
      description: form.description || form.shortDescription,
      trialClassAvailable: form.trialClassAvailable,
      enrollmentOpen: form.enrollmentOpen,
      currency: form.currency || 'EUR',
      materialsIncluded: form.materialsIncluded,
      isFeatured: form.isFeatured,
      sortOrder: form.sortOrder ? Number(form.sortOrder) : 0,
    };
    if (form.campusId) payload.campusId = form.campusId;
    if (form.instructorId) payload.instructorId = form.instructorId;
    if (form.ageRange) payload.ageRange = form.ageRange;
    if (form.duration) payload.duration = form.duration;
    if (form.scheduleSummary) payload.scheduleSummary = form.scheduleSummary;
    if (form.imageUrl) payload.imageUrl = form.imageUrl;
    if (form.monthlyPrice) payload.monthlyPrice = parseFloat(form.monthlyPrice);
    if (form.registrationFee) payload.registrationFee = parseFloat(form.registrationFee);
    return payload;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await updateProgram(editingId, buildPayload());
        showToast('Programa actualizado', 'success');
      } else {
        await createProgram(buildPayload());
        showToast('Programa creado', 'success');
      }
      setModalOpen(false);
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'Error al guardar', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    setSubmitting(true);
    try {
      await deactivateProgram(deactivateTarget.id);
      showToast('Programa desactivado', 'success');
      setDeactivateTarget(null);
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'No se pudo desactivar el programa', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const active = programs.filter((p) => p.isActive);
  const inactive = programs.filter((p) => !p.isActive);
  const visiblePrograms = active.concat(inactive).filter((program) => {
    const matchesText = `${program.name} ${program.shortDescription} ${program.school?.name ?? ''} ${program.discipline?.name ?? ''}`.toLowerCase().includes(query.toLowerCase().trim());
    const matchesModality = modalityFilter === 'ALL' || program.modality === modalityFilter;
    const matchesLevel = levelFilter === 'ALL' || program.level === levelFilter;
    return matchesText && matchesModality && matchesLevel;
  });
  const availableCampuses = campuses.filter((campus) => !form.schoolId || campus.schoolId === form.schoolId);
  const availableInstructors = instructors.filter((instructor) => !form.schoolId || instructor.schoolId === form.schoolId);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Programas"
        description="Gestiona cursos, talleres y masterclasses con disciplina, sede, docente, precios, horarios e imagen pública."
        meta={<Badge variant="success">{active.length} activos</Badge>}
        actions={(
          <button
            type="button"
            onClick={openCreate}
            className="rounded-full bg-[#006b2d] px-5 py-2 text-sm font-semibold text-white hover:bg-[#005723]"
          >
            Nuevo programa
          </button>
        )}
      />

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[1fr_auto_auto]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre, disciplina o escuela..."
          className="h-10 rounded-xl border border-slate-200 px-4 text-sm focus:border-[#006b2d] focus:outline-none"
        />
        <select value={modalityFilter} onChange={(event) => setModalityFilter(event.target.value)} className="h-10 rounded-xl border border-slate-200 px-4 text-sm focus:border-[#006b2d] focus:outline-none">
          <option value="ALL">Todas las modalidades</option>
          {Object.entries(MODALITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)} className="h-10 rounded-xl border border-slate-200 px-4 text-sm focus:border-[#006b2d] focus:outline-none">
          <option value="ALL">Todos los niveles</option>
          {Object.entries(LEVEL_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      {loading ? (
        <AdminLoadingState rows={5} />
      ) : error ? (
        <AdminErrorState message={error} onRetry={refetch} />
      ) : !visiblePrograms.length ? (
        <AdminEmptyState title="Sin programas" description="No hay programas que coincidan con los filtros actuales." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Programa</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Disciplina</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Modalidad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Nivel</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Precio</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {visiblePrograms.map((program) => (
                <tr key={program.id} className={`hover:bg-slate-50 ${!program.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {program.imageUrl ? (
                        <img src={program.imageUrl} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400 shrink-0 text-xs font-bold">
                          {program.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{program.name}</p>
                        <p className="text-xs text-slate-400 line-clamp-1 max-w-[200px]">{program.shortDescription}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{program.discipline?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant="info">{MODALITY_LABELS[program.modality] ?? program.modality}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{LEVEL_LABELS[program.level] ?? program.level}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {program.monthlyPrice != null ? `${program.currency} ${program.monthlyPrice}` : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {program.isActive
                      ? <Badge variant="success">Activo</Badge>
                      : <Badge variant="default">Inactivo</Badge>
                    }
                  </td>
                  <td className="px-4 py-3">
                    {program.isActive && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEdit(program)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-100"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeactivateTarget(program)}
                          className="rounded-full border border-red-100 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          Desactivar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar programa' : 'Nuevo programa'}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {formErrors.length > 0 && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              {formErrors.map((error) => <p key={error}>{error}</p>)}
            </div>
          )}
          {isPlatformAdmin && (
            <div>
              <label className={labelCls()}>Escuela asociada *</label>
              <select value={form.schoolId} onChange={(e) => setForm({ ...form, schoolId: e.target.value, campusId: '', instructorId: '' })}
                required className={inputCls()}>
                <option value="">Seleccionar escuela</option>
                {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className={labelCls()}>Nombre del programa *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              required minLength={3} className={inputCls()} />
          </div>
          <div>
            <label className={labelCls()}>Disciplina *</label>
            <select value={form.disciplineId} onChange={(e) => setForm({ ...form, disciplineId: e.target.value })}
              required className={inputCls()}>
              <option value="">Seleccionar disciplina</option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls()}>Sede</label>
              <select value={form.campusId} onChange={(e) => setForm({ ...form, campusId: e.target.value })}
                className={inputCls()}>
                <option value="">Sin sede específica</option>
                {availableCampuses.map((campus) => (
                  <option key={campus.id} value={campus.id}>{campus.name} · {campus.city}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls()}>Instructor</label>
              <select value={form.instructorId} onChange={(e) => setForm({ ...form, instructorId: e.target.value })}
                className={inputCls()}>
                <option value="">Sin instructor asignado</option>
                {availableInstructors.map((instructor) => (
                  <option key={instructor.id} value={instructor.id}>{instructor.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls()}>Tipo de programa *</label>
              <select value={form.programType} onChange={(e) => setForm({ ...form, programType: e.target.value })}
                className={inputCls()}>
                {Object.entries(PROGRAM_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls()}>Modalidad *</label>
              <select value={form.modality} onChange={(e) => setForm({ ...form, modality: e.target.value })}
                className={inputCls()}>
                <option value="PRESENTIAL">Presencial</option>
                <option value="VIRTUAL">Virtual</option>
                <option value="HYBRID">Híbrido</option>
              </select>
            </div>
            <div>
              <label className={labelCls()}>Nivel *</label>
              <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}
                className={inputCls()}>
                <option value="BEGINNER">Inicial</option>
                <option value="INTERMEDIATE">Intermedio</option>
                <option value="ADVANCED">Avanzado</option>
                <option value="PROFESSIONAL">Profesional</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls()}>Descripción corta *</label>
            <textarea value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })}
              required minLength={10} rows={2} className={inputCls()} />
          </div>
          <div>
            <label className={labelCls()}>Descripción completa</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4} className={inputCls()} placeholder="Deja vacío para usar la descripción corta" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelCls()}>Precio mensual</label>
              <input type="number" min="0" step="0.01" value={form.monthlyPrice}
                onChange={(e) => setForm({ ...form, monthlyPrice: e.target.value })}
                className={inputCls()} placeholder="0" />
            </div>
            <div>
              <label className={labelCls()}>Matrícula</label>
              <input type="number" min="0" step="0.01" value={form.registrationFee}
                onChange={(e) => setForm({ ...form, registrationFee: e.target.value })}
                className={inputCls()} placeholder="0" />
            </div>
            <div>
              <label className={labelCls()}>Moneda</label>
              <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className={inputCls()} placeholder="EUR" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls()}>Rango de edad</label>
              <input value={form.ageRange} onChange={(e) => setForm({ ...form, ageRange: e.target.value })}
                className={inputCls()} placeholder="8-16 años" />
            </div>
            <div>
              <label className={labelCls()}>Duración</label>
              <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
                className={inputCls()} placeholder="12 semanas" />
            </div>
          </div>
          <div>
            <label className={labelCls()}>Resumen de horario</label>
            <input value={form.scheduleSummary} onChange={(e) => setForm({ ...form, scheduleSummary: e.target.value })}
              className={inputCls()} placeholder="Lunes y miércoles 18:00–20:00" />
          </div>
          <div>
            <label className={labelCls()}>Orden de visualización</label>
            <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              className={inputCls()} placeholder="0" />
          </div>
          <div>
            <ImageUploadField
              label="Imagen del programa"
              description="Imagen usada en cards públicas y en el detalle del programa."
              recommended="1200 x 800 px"
              maxSizeMb={3}
              minWidth={900}
              aspectRatio={1200 / 800}
              currentUrl={form.imageUrl}
              schoolId={form.schoolId || undefined}
              onChange={(url) => setForm({ ...form, imageUrl: url ?? '' })}
            />
          </div>
          <div className="flex flex-wrap gap-4 pt-1">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.trialClassAvailable}
                onChange={(e) => setForm({ ...form, trialClassAvailable: e.target.checked })}
                className="accent-[#006b2d]" />
              Clase de prueba disponible
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.enrollmentOpen}
                onChange={(e) => setForm({ ...form, enrollmentOpen: e.target.checked })}
                className="accent-[#006b2d]" />
              Inscripción abierta
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.materialsIncluded}
                onChange={(e) => setForm({ ...form, materialsIncluded: e.target.checked })}
                className="accent-[#006b2d]" />
              Materiales incluidos
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="accent-[#006b2d]" />
              Destacado en el perfil
            </label>
          </div>
          <button type="submit" disabled={submitting}
            className="w-full rounded-full bg-[#006b2d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#005723] disabled:opacity-60">
            {submitting ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear programa'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deactivateTarget}
        title="Desactivar programa"
        description="El programa dejará de aparecer en listados públicos, pero se conservará en el histórico administrativo."
        confirmLabel="Desactivar"
        tone="danger"
        loading={submitting}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
}

import { FormEvent, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { useInstructorsAdmin, type AdminInstructor, type InstructorAdminPayload } from '../../hooks/useInstructorsAdmin';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../../components/admin/AdminState';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import ImageUploadField from '../../components/admin/ImageUploadField';
import { useAuth } from '../../context/AuthContext';
import { useAdminSchools } from '../../hooks/useAdminSchools';

type InstructorForm = {
  schoolId: string; name: string; bio: string; specialties: string;
  experience: string; education: string; photoUrl: string; instagram: string; portfolioUrl: string;
};
const EMPTY_FORM: InstructorForm = {
  schoolId: '', name: '', bio: '', specialties: '', experience: '', education: '', photoUrl: '', instagram: '', portfolioUrl: '',
};

function inputCls() {
  return 'mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#006b2d] focus:outline-none';
}
function labelCls() {
  return 'block text-xs font-semibold uppercase tracking-wide text-slate-500';
}

export default function InstructorsAdmin() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const {
    instructors,
    loading,
    error,
    refetch,
    createInstructor,
    updateInstructor,
    deactivateInstructor,
  } = useInstructorsAdmin();
  const { schools } = useAdminSchools();
  const isPlatformAdmin = user?.role === 'PLATFORM_ADMIN';

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<InstructorForm>(EMPTY_FORM);
  const [query, setQuery] = useState('');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminInstructor | null>(null);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, schoolId: schools[0]?.id ?? '' });
    setFormErrors([]);
    setModalOpen(true);
  }

  function openEdit(instructor: AdminInstructor) {
    setEditingId(instructor.id);
    setForm({
      schoolId: instructor.schoolId,
      name: instructor.name,
      bio: instructor.bio,
      specialties: instructor.specialties,
      experience: instructor.experience ?? '',
      education: instructor.education ?? '',
      photoUrl: instructor.photoUrl ?? '',
      instagram: instructor.instagram ?? '',
      portfolioUrl: instructor.portfolioUrl ?? '',
    });
    setFormErrors([]);
    setModalOpen(true);
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

  function validateForm() {
    const errors: string[] = [];
    if (isPlatformAdmin && !form.schoolId) errors.push('Selecciona la escuela asociada.');
    if (form.name.trim().length < 3) errors.push('El nombre debe tener al menos 3 caracteres.');
    if (form.specialties.trim().length < 3) errors.push('Agrega al menos una especialidad.');
    if (form.bio.trim().length < 20) errors.push('La biografía debe tener al menos 20 caracteres.');
    if (!validUrl(form.photoUrl)) errors.push('La URL de foto debe ser válida.');
    if (!validUrl(form.portfolioUrl)) errors.push('La URL de portafolio debe ser válida.');
    setFormErrors(errors);
    return errors.length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    const payload: InstructorAdminPayload = {
      ...(isPlatformAdmin ? { schoolId: form.schoolId } : {}),
      name: form.name.trim(),
      bio: form.bio.trim(),
      specialties: form.specialties.trim(),
      experience: form.experience.trim() || null,
      education: form.education.trim() || null,
      photoUrl: form.photoUrl.trim() || null,
      instagram: form.instagram.trim() || null,
      portfolioUrl: form.portfolioUrl.trim() || null,
    };
    try {
      if (editingId) {
        await updateInstructor(editingId, payload);
        showToast('Instructor actualizado', 'success');
      } else {
        await createInstructor(payload);
        showToast('Instructor creado', 'success');
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
      await deactivateInstructor(deactivateTarget.id);
      showToast('Instructor desactivado', 'success');
      setDeactivateTarget(null);
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'No se pudo desactivar', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const active = instructors.filter((i) => i.isActive);
  const inactive = instructors.filter((i) => !i.isActive);
  const visibleInstructors = active.concat(inactive).filter((instructor) => {
    const text = `${instructor.name} ${instructor.bio} ${instructor.specialties} ${instructor.school?.name ?? ''}`.toLowerCase();
    return text.includes(query.toLowerCase().trim());
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Instructores"
        description="Gestiona docentes, biografías, especialidades, foto pública y redes."
        meta={<Badge variant="success">{active.length} activos</Badge>}
        actions={(
          <button onClick={openCreate} className="rounded-full bg-[#006b2d] px-5 py-2 text-sm font-semibold text-white hover:bg-[#005723]">
            Nuevo instructor
          </button>
        )}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre, especialidad o escuela..."
          className="h-10 w-full rounded-xl border border-slate-200 px-4 text-sm focus:border-[#006b2d] focus:outline-none sm:w-96"
        />
      </div>

      {loading ? (
        <AdminLoadingState rows={5} />
      ) : error ? (
        <AdminErrorState message={error} onRetry={refetch} />
      ) : !visibleInstructors.length ? (
        <AdminEmptyState title="Sin instructores" description="No hay instructores que coincidan con la búsqueda actual." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Instructor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Especialidades</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Bio</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {visibleInstructors.map((instructor) => (
                <tr key={instructor.id} className={`hover:bg-slate-50 ${!instructor.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {instructor.photoUrl ? (
                        <img src={instructor.photoUrl} alt={instructor.name}
                          className="h-10 w-10 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e8f5ec] text-sm font-bold text-[#006b2d] shrink-0">
                          {instructor.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900">{instructor.name}</p>
                        {instructor.instagram && (
                          <p className="text-xs text-slate-400">@{instructor.instagram.replace('@', '')}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {instructor.specialties.split(',').slice(0, 3).map((s, i) => (
                        <Badge key={i} variant="info">{s.trim()}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <p className="line-clamp-2 max-w-xs text-sm">{instructor.bio}</p>
                  </td>
                  <td className="px-4 py-3">
                    {instructor.isActive
                      ? <Badge variant="success">Activo</Badge>
                      : <Badge variant="default">Inactivo</Badge>
                    }
                  </td>
                  <td className="px-4 py-3">
                    {instructor.isActive && (
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(instructor)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-100">
                          Editar
                        </button>
                        <button onClick={() => setDeactivateTarget(instructor)}
                          className="rounded-full border border-red-100 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingId ? 'Editar instructor' : 'Nuevo instructor'} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="max-h-[76vh] space-y-4 overflow-y-auto pr-1">
          {formErrors.length > 0 && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              {formErrors.map((error) => <p key={error}>{error}</p>)}
            </div>
          )}
          {isPlatformAdmin && (
            <div>
              <label className={labelCls()}>Escuela asociada *</label>
              <select value={form.schoolId} onChange={(e) => setForm({ ...form, schoolId: e.target.value })} required className={inputCls()}>
                <option value="">Seleccionar escuela</option>
                {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className={labelCls()}>Nombre *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              required minLength={3} className={inputCls()} />
          </div>
          <div>
            <label className={labelCls()}>Especialidades *</label>
            <input value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })}
              required className={inputCls()} placeholder="Piano, Música clásica, Jazz (separadas por coma)" />
          </div>
          <div>
            <label className={labelCls()}>Bio *</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
              required minLength={5} rows={3} className={inputCls()} />
          </div>
          <div>
            <label className={labelCls()}>Experiencia</label>
            <textarea value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })}
              rows={2} className={inputCls()} placeholder="Ej. 10 años formando estudiantes para audiciones y recitales" />
          </div>
          <div>
            <label className={labelCls()}>Formación</label>
            <textarea value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })}
              rows={2} className={inputCls()} placeholder="Conservatorio, universidad, certificaciones o trayectoria artística" />
          </div>
          <div>
            <ImageUploadField
              label="Foto del instructor"
              description="Foto pública del docente en cards y perfil de la escuela."
              recommended="800 x 800 px"
              maxSizeMb={2}
              minWidth={600}
              minHeight={600}
              aspectRatio={1}
              currentUrl={form.photoUrl}
              mediaType="PROFILE_IMAGE"
              schoolId={form.schoolId || undefined}
              onChange={(url) => setForm({ ...form, photoUrl: url ?? '' })}
            />
          </div>
          <div>
            <label className={labelCls()}>Instagram (usuario, sin @)</label>
            <input value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })}
              className={inputCls()} placeholder="nombredeusuario" />
          </div>
          <div>
            <label className={labelCls()}>Portafolio o enlace externo</label>
            <input type="url" value={form.portfolioUrl} onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })}
              className={inputCls()} placeholder="https://..." />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full rounded-full bg-[#006b2d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#005723] disabled:opacity-60">
            {submitting ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear instructor'}
          </button>
        </form>
      </Modal>
      <ConfirmDialog
        open={!!deactivateTarget}
        title="Desactivar instructor"
        description="El instructor dejará de aparecer en el perfil público de la escuela, pero se conservará en el histórico administrativo."
        confirmLabel="Desactivar"
        tone="danger"
        loading={submitting}
        onConfirm={handleDeactivate}
        onCancel={() => setDeactivateTarget(null)}
      />
    </div>
  );
}

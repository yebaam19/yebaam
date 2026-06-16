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
import { useCampaignsAdmin, type CampaignAdminPayload } from '../../hooks/useCampaignsAdmin';
import type { Campaign } from '../../types';

const CAMPAIGN_LABELS: Record<Campaign['campaignType'], string> = {
  SCHOLARSHIP: 'Beca',
  DISCOUNT: 'Descuento',
  OPEN_ENROLLMENT: 'Matrícula abierta',
  OPEN_CLASS: 'Clase abierta',
  ENROLLMENT_PROMOTION: 'Promoción de inscripción',
};

type CampaignFilter = 'ALL' | 'ACTIVE' | 'ARCHIVED';

interface CampaignForm {
  schoolId: string;
  title: string;
  campaignType: Campaign['campaignType'];
  subtitle: string;
  description: string;
  imageUrl: string;
  ctaLabel: string;
  ctaUrl: string;
  startsAt: string;
  endsAt: string;
}

const EMPTY_FORM: CampaignForm = {
  schoolId: '',
  title: '',
  campaignType: 'OPEN_ENROLLMENT',
  subtitle: '',
  description: '',
  imageUrl: '',
  ctaLabel: '',
  ctaUrl: '',
  startsAt: '',
  endsAt: '',
};

function inputCls() {
  return 'mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#006b2d] focus:outline-none';
}

const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-500';

function formatDate(iso?: string) {
  if (!iso) return 'Sin fecha';
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function toDateInput(value?: string) {
  return value ? value.slice(0, 10) : '';
}

function campaignToForm(campaign: Campaign): CampaignForm {
  return {
    schoolId: campaign.school?.id ?? '',
    title: campaign.title,
    campaignType: campaign.campaignType ?? 'OPEN_ENROLLMENT',
    subtitle: campaign.subtitle ?? '',
    description: campaign.description,
    imageUrl: campaign.imageUrl ?? '',
    ctaLabel: campaign.ctaLabel ?? '',
    ctaUrl: campaign.ctaUrl ?? '',
    startsAt: toDateInput(campaign.startsAt),
    endsAt: toDateInput(campaign.endsAt),
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

export default function CampaignsAdmin() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { campaigns, loading, error, refetch, createCampaign, updateCampaign, archiveCampaign } = useCampaignsAdmin();
  const { schools } = useAdminSchools();
  const isPlatformAdmin = user?.role === 'PLATFORM_ADMIN';

  const [filter, setFilter] = useState<CampaignFilter>('ACTIVE');
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CampaignForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Campaign | null>(null);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesStatus =
        filter === 'ALL' ||
        (filter === 'ACTIVE' && !campaign.isArchived) ||
        (filter === 'ARCHIVED' && campaign.isArchived);
      const text = `${campaign.title} ${campaign.subtitle ?? ''} ${campaign.description} ${campaign.school?.name ?? ''}`.toLowerCase();
      return matchesStatus && text.includes(query.toLowerCase().trim());
    });
  }, [campaigns, filter, query]);

  function validate() {
    const errors: string[] = [];
    if (isPlatformAdmin && !form.schoolId) errors.push('Selecciona la escuela asociada.');
    if (form.title.trim().length < 5) errors.push('El título debe tener al menos 5 caracteres.');
    if (form.description.trim().length < 10) errors.push('La descripción debe tener al menos 10 caracteres.');
    if (!form.startsAt) errors.push('La fecha de inicio es obligatoria.');
    if (!form.endsAt) errors.push('La fecha de fin es obligatoria.');
    if (form.startsAt && form.endsAt && new Date(form.endsAt) < new Date(form.startsAt)) {
      errors.push('La fecha de fin no puede ser anterior a la fecha de inicio.');
    }
    if (!validUrl(form.imageUrl)) errors.push('La imagen debe ser una URL válida.');
    if (!validUrl(form.ctaUrl)) errors.push('El enlace del CTA debe ser una URL válida.');
    setFormErrors(errors);
    return errors.length === 0;
  }

  function buildPayload(): CampaignAdminPayload {
    return {
      ...(isPlatformAdmin ? { schoolId: form.schoolId } : {}),
      title: form.title.trim(),
      campaignType: form.campaignType,
      subtitle: optionalString(form.subtitle),
      description: form.description.trim(),
      imageUrl: optionalString(form.imageUrl),
      ctaLabel: optionalString(form.ctaLabel),
      ctaUrl: optionalString(form.ctaUrl),
      startsAt: form.startsAt,
      endsAt: form.endsAt,
    };
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, schoolId: schools[0]?.id ?? '' });
    setFormErrors([]);
    setModalOpen(true);
  }

  function openEdit(campaign: Campaign) {
    setEditingId(campaign.id);
    setForm(campaignToForm(campaign));
    setFormErrors([]);
    setModalOpen(true);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (editingId) {
        await updateCampaign(editingId, buildPayload());
        showToast('Campaña actualizada', 'success');
      } else {
        await createCampaign(buildPayload());
        showToast('Campaña creada', 'success');
      }
      setModalOpen(false);
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'No se pudo guardar la campaña', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmArchive() {
    if (!archiveTarget) return;
    setSubmitting(true);
    try {
      await archiveCampaign(archiveTarget.id);
      showToast('Campaña archivada', 'success');
      setArchiveTarget(null);
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'No se pudo archivar la campaña', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const activeCount = campaigns.filter((campaign) => !campaign.isArchived).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Campañas"
        description="Gestiona becas, descuentos, matrículas abiertas y convocatorias visibles en la plataforma."
        meta={<Badge variant="success">{activeCount} activas</Badge>}
        actions={(
          <button
            type="button"
            onClick={openCreate}
            className="rounded-full bg-[#006b2d] px-5 py-2 text-sm font-semibold text-white hover:bg-[#005723]"
          >
            Nueva campaña
          </button>
        )}
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por campaña o escuela..."
          className="h-10 min-w-0 rounded-xl border border-slate-200 px-4 text-sm focus:border-[#006b2d] focus:outline-none sm:w-80"
        />
        <div className="flex flex-wrap gap-2">
          {(['ALL', 'ACTIVE', 'ARCHIVED'] as CampaignFilter[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-full px-4 py-2 text-xs font-semibold ${filter === item ? 'bg-[#006b2d] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {item === 'ALL' ? 'Todas' : item === 'ACTIVE' ? 'Activas' : 'Archivadas'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <AdminLoadingState rows={5} />
      ) : error ? (
        <AdminErrorState message={error} onRetry={refetch} />
      ) : !filteredCampaigns.length ? (
        <AdminEmptyState title="Sin campañas" description="Crea una campaña para promocionar inscripciones, becas o clases abiertas." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Campaña</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tipo</th>
                {isPlatformAdmin && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Escuela</th>}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Vigencia</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCampaigns.map((campaign) => (
                <tr key={campaign.id} className={campaign.isArchived ? 'bg-slate-50 opacity-70' : 'hover:bg-slate-50'}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {campaign.imageUrl ? (
                        <img src={campaign.imageUrl} alt="" className="h-12 w-16 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-12 w-16 items-center justify-center rounded-lg bg-[#e8f5ec] text-[#006b2d]">
                          <span className="material-symbols-outlined text-xl">campaign</span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">{campaign.title}</p>
                        <p className="line-clamp-1 max-w-xs text-xs text-slate-500">{campaign.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge variant="info">{CAMPAIGN_LABELS[campaign.campaignType]}</Badge></td>
                  {isPlatformAdmin && <td className="px-4 py-3 text-slate-600">{campaign.school?.name ?? 'Sin escuela'}</td>}
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatDate(campaign.startsAt)} - {formatDate(campaign.endsAt)}</td>
                  <td className="px-4 py-3">{campaign.isArchived ? <Badge>Archivada</Badge> : <Badge variant="success">Activa</Badge>}</td>
                  <td className="px-4 py-3">
                    {!campaign.isArchived ? (
                      <div className="flex gap-2">
                        <button type="button" onClick={() => openEdit(campaign)} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold hover:bg-slate-100">
                          Editar
                        </button>
                        <button type="button" onClick={() => setArchiveTarget(campaign)} className="rounded-full border border-red-100 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar campaña' : 'Nueva campaña'} maxWidth="max-w-3xl">
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
              <select value={form.campaignType} onChange={(event) => setForm({ ...form, campaignType: event.target.value as Campaign['campaignType'] })} className={inputCls()}>
                {Object.entries(CAMPAIGN_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Subtítulo</label>
            <input value={form.subtitle} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} className={inputCls()} />
          </div>
          <div>
            <label className={labelCls}>Descripción *</label>
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} className={inputCls()} required />
          </div>
          <ImageUploadField
            label="Imagen de campaña"
            description="Imagen principal usada en campañas y cards públicas."
            recommended="1200 x 628 px"
            maxSizeMb={3}
            minWidth={900}
            aspectRatio={1200 / 628}
            currentUrl={form.imageUrl}
            schoolId={form.schoolId || undefined}
            onChange={(url) => setForm({ ...form, imageUrl: url ?? '' })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Fecha inicio *</label>
              <input type="date" value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} className={inputCls()} required />
            </div>
            <div>
              <label className={labelCls}>Fecha fin *</label>
              <input type="date" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} className={inputCls()} required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Texto del CTA</label>
              <input value={form.ctaLabel} onChange={(event) => setForm({ ...form, ctaLabel: event.target.value })} className={inputCls()} placeholder="Solicitar información" />
            </div>
            <div>
              <label className={labelCls}>Enlace del CTA</label>
              <input type="url" value={form.ctaUrl} onChange={(event) => setForm({ ...form, ctaUrl: event.target.value })} className={inputCls()} placeholder="https://..." />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="w-full rounded-full bg-[#006b2d] px-6 py-3 text-sm font-semibold text-white hover:bg-[#005723] disabled:opacity-60">
            {submitting ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear campaña'}
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!archiveTarget}
        title="Archivar campaña"
        description="La campaña dejará de aparecer en listados públicos y quedará solo como histórico administrativo."
        confirmLabel="Archivar"
        tone="danger"
        loading={submitting}
        onConfirm={confirmArchive}
        onCancel={() => setArchiveTarget(null)}
      />
    </div>
  );
}

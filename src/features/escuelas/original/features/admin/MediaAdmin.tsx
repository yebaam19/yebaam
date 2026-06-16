import { FormEvent, useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useAdminSchools } from '../../hooks/useAdminSchools';
import { useMediaAdmin, type MediaAdminPayload, type MediaUpdatePayload } from '../../hooks/useMediaAdmin';
import type { MediaAsset, MediaType } from '../../types';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../../components/admin/AdminState';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import ImageUploadField from '../../components/admin/ImageUploadField';
import MediaGalleryManager from '../../components/admin/MediaGalleryManager';
import VideoUploadField from '../../components/admin/VideoUploadField';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

type ExternalMediaForm = {
  schoolId: string;
  type: MediaType;
  url: string;
  thumbnailUrl: string;
  title: string;
  description: string;
  caption: string;
  isPrimary: boolean;
};

type EditMediaForm = {
  title: string;
  description: string;
  caption: string;
  thumbnailUrl: string;
  sortOrder: string;
  isPrimary: boolean;
};

const EMPTY_EXTERNAL: ExternalMediaForm = {
  schoolId: '',
  type: 'REEL',
  url: '',
  thumbnailUrl: '',
  title: '',
  description: '',
  caption: '',
  isPrimary: false,
};

function inputCls() {
  return 'mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#006b2d] focus:outline-none';
}

function labelCls() {
  return 'block text-xs font-semibold uppercase tracking-wide text-slate-500';
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

export default function MediaAdmin() {
  const { user } = useAuth();
  const { schools } = useAdminSchools();
  const { showToast } = useToast();
  const { media, loading, error, refetch, createExternalMedia, updateMedia, setPrimary, deactivateMedia } = useMediaAdmin();
  const isPlatformAdmin = user?.role === 'PLATFORM_ADMIN';

  const [externalForm, setExternalForm] = useState<ExternalMediaForm>({ ...EMPTY_EXTERNAL, schoolId: schools[0]?.id ?? '' });
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [editing, setEditing] = useState<MediaAsset | null>(null);
  const [editForm, setEditForm] = useState<EditMediaForm>({ title: '', description: '', caption: '', thumbnailUrl: '', sortOrder: '0', isPrimary: false });
  const [deactivateTarget, setDeactivateTarget] = useState<MediaAsset | null>(null);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function openEdit(asset: MediaAsset) {
    setEditing(asset);
    setEditForm({
      title: asset.title ?? '',
      description: asset.description ?? '',
      caption: asset.caption ?? '',
      thumbnailUrl: asset.thumbnailUrl ?? '',
      sortOrder: String(asset.sortOrder ?? 0),
      isPrimary: asset.isPrimary,
    });
  }

  function validateExternal() {
    const errors: string[] = [];
    if (isPlatformAdmin && !externalForm.schoolId) errors.push('Selecciona la escuela asociada.');
    if (!validUrl(externalForm.url) || !externalForm.url.trim()) errors.push('La URL externa es obligatoria y debe ser válida.');
    if (!validUrl(externalForm.thumbnailUrl)) errors.push('La URL de miniatura debe ser válida.');
    if (externalForm.title.trim().length < 3) errors.push('El título debe tener al menos 3 caracteres.');
    setFormErrors(errors);
    return errors.length === 0;
  }

  async function handleCreateExternal(event: FormEvent) {
    event.preventDefault();
    if (!validateExternal()) return;
    setSubmitting(true);
    const payload: MediaAdminPayload = {
      ...(isPlatformAdmin ? { schoolId: externalForm.schoolId } : {}),
      type: externalForm.type,
      url: externalForm.url.trim(),
      thumbnailUrl: externalForm.thumbnailUrl.trim() || null,
      title: externalForm.title.trim(),
      description: externalForm.description.trim() || null,
      caption: externalForm.caption.trim() || null,
      provider: externalForm.type === 'REEL' || externalForm.type === 'VIDEO_URL' ? 'external' : null,
      isPrimary: externalForm.isPrimary,
    };
    try {
      await createExternalMedia(payload);
      showToast('Media registrada', 'success');
      setExternalForm({ ...EMPTY_EXTERNAL, schoolId: schools[0]?.id ?? '' });
      setFormErrors([]);
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'No se pudo registrar la media', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    if (!validUrl(editForm.thumbnailUrl)) {
      setFormErrors(['La URL de miniatura debe ser válida.']);
      return;
    }
    setSubmitting(true);
    const payload: MediaUpdatePayload = {
      title: editForm.title.trim() || null,
      description: editForm.description.trim() || null,
      caption: editForm.caption.trim() || null,
      thumbnailUrl: editForm.thumbnailUrl.trim() || null,
      sortOrder: Number(editForm.sortOrder || 0),
      isPrimary: editForm.isPrimary,
    };
    try {
      await updateMedia(editing.id, payload);
      showToast('Media actualizada', 'success');
      setEditing(null);
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'No se pudo actualizar la media', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    setSubmitting(true);
    try {
      await deactivateMedia(deactivateTarget.id);
      showToast('Media desactivada', 'success');
      setDeactivateTarget(null);
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'No se pudo desactivar la media', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const activeMedia = media.filter((item) => item.isActive !== false);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Fotos y reels"
        description="Sube fotos, registra reels o videos externos y controla la galería pública de la escuela."
        meta={<Badge variant="success">{activeMedia.length} publicados</Badge>}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-black text-slate-900">Subir foto de galería</h2>
          <p className="text-sm text-slate-500">Las fotos de galería deben tener buena iluminación y mínimo 1200 px de ancho.</p>
          {isPlatformAdmin ? (
            <select value={externalForm.schoolId} onChange={(event) => setExternalForm({ ...externalForm, schoolId: event.target.value })} className={inputCls()}>
              <option value="">Seleccionar escuela</option>
              {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
            </select>
          ) : null}
          <ImageUploadField
            label="Foto de galería"
            description="Se guarda inmediatamente como imagen de galería; puedes editar título y descripción después."
            recommended="mínimo 1200 px de ancho"
            maxSizeMb={4}
            minWidth={1200}
            currentUrl={uploadedPreview}
            mediaType="GALLERY"
            schoolId={externalForm.schoolId || undefined}
            onChange={(url) => {
              setUploadedPreview(url);
              showToast('Imagen subida a la galería', 'success');
              refetch();
            }}
          />
        </section>

        <form onSubmit={handleCreateExternal} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div>
            <h2 className="text-sm font-black text-slate-900">Registrar reel o URL externa</h2>
            <p className="mt-1 text-sm text-slate-500">Los reels ayudan a mostrar clases, presentaciones, audiciones o muestras artísticas.</p>
          </div>
          {formErrors.length ? <div className="rounded-xl bg-red-50 p-3 text-xs text-red-700">{formErrors.map((item) => <p key={item}>{item}</p>)}</div> : null}
          <div>
            <label className={labelCls()}>Tipo</label>
            <select value={externalForm.type} onChange={(event) => setExternalForm({ ...externalForm, type: event.target.value as MediaType })} className={inputCls()}>
              <option value="REEL">Reel</option>
              <option value="VIDEO_URL">Video externo</option>
              <option value="IMAGE">Imagen por URL</option>
            </select>
          </div>
          <div><label className={labelCls()}>Título *</label><input value={externalForm.title} onChange={(event) => setExternalForm({ ...externalForm, title: event.target.value })} className={inputCls()} /></div>
          <div><label className={labelCls()}>Descripción</label><textarea value={externalForm.description} onChange={(event) => setExternalForm({ ...externalForm, description: event.target.value })} rows={3} className={inputCls()} /></div>
          <VideoUploadField label="URL del reel o video" description="Pega el enlace público de Instagram, TikTok, YouTube Shorts o un archivo externo." currentUrl={externalForm.url} onChange={(url) => setExternalForm({ ...externalForm, url: url ?? '' })} />
          <div><label className={labelCls()}>Miniatura opcional</label><input type="url" value={externalForm.thumbnailUrl} onChange={(event) => setExternalForm({ ...externalForm, thumbnailUrl: event.target.value })} placeholder="https://..." className={inputCls()} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={externalForm.isPrimary} onChange={(event) => setExternalForm({ ...externalForm, isPrimary: event.target.checked })} className="accent-[#006b2d]" /> Marcar como principal</label>
          <button type="submit" disabled={submitting} className="w-full rounded-full bg-[#006b2d] px-5 py-3 text-sm font-semibold text-white hover:bg-[#005723] disabled:opacity-60">{submitting ? 'Guardando...' : 'Registrar media'}</button>
        </form>
      </div>

      {loading ? (
        <AdminLoadingState rows={5} />
      ) : error ? (
        <AdminErrorState message={error} onRetry={refetch} />
      ) : activeMedia.length ? (
        <MediaGalleryManager
          media={activeMedia}
          onEdit={openEdit}
          onSetPrimary={setPrimary}
          onDeactivate={(id) => setDeactivateTarget(activeMedia.find((asset) => asset.id === id) ?? null)}
        />
      ) : (
        <AdminEmptyState title="Sin fotos ni reels" description="Sube una foto o registra una URL externa para mostrar mejor la experiencia de tu escuela." />
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Editar media" maxWidth="max-w-2xl">
        <form onSubmit={handleEdit} className="space-y-4">
          <div><label className={labelCls()}>Título</label><input value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} className={inputCls()} /></div>
          <div><label className={labelCls()}>Descripción</label><textarea value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} rows={3} className={inputCls()} /></div>
          <div><label className={labelCls()}>Caption corto</label><input value={editForm.caption} onChange={(event) => setEditForm({ ...editForm, caption: event.target.value })} className={inputCls()} /></div>
          <div><label className={labelCls()}>Miniatura</label><input type="url" value={editForm.thumbnailUrl} onChange={(event) => setEditForm({ ...editForm, thumbnailUrl: event.target.value })} className={inputCls()} /></div>
          <div><label className={labelCls()}>Orden</label><input type="number" value={editForm.sortOrder} onChange={(event) => setEditForm({ ...editForm, sortOrder: event.target.value })} className={inputCls()} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editForm.isPrimary} onChange={(event) => setEditForm({ ...editForm, isPrimary: event.target.checked })} className="accent-[#006b2d]" /> Media principal</label>
          <button type="submit" disabled={submitting} className="w-full rounded-full bg-[#006b2d] px-5 py-3 text-sm font-semibold text-white hover:bg-[#005723] disabled:opacity-60">{submitting ? 'Guardando...' : 'Guardar cambios'}</button>
        </form>
      </Modal>

      <ConfirmDialog open={!!deactivateTarget} title="Desactivar media" description="La foto o reel dejará de aparecer en el perfil público, pero se conservará en el administrador." confirmLabel="Desactivar" tone="danger" loading={submitting} onConfirm={handleDeactivate} onCancel={() => setDeactivateTarget(null)} />
    </div>
  );
}

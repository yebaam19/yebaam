import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import ImageUploadField from '../../components/admin/ImageUploadField';
import { SkeletonCard } from '../../components/ui/Skeleton';
import Badge from '../../components/ui/Badge';
import type { MediaAsset, School } from '../../types';

const CATEGORY_OPTIONS = [
  { value: 'MUSIC', label: 'Música' },
  { value: 'ARTS', label: 'Artes plásticas' },
  { value: 'DANCE', label: 'Danza' },
  { value: 'THEATER', label: 'Teatro' },
  { value: 'MULTIDISCIPLINARY', label: 'Multidisciplinaria' },
];

const SCHOOL_TYPE_OPTIONS = [
  { value: 'PRIVATE', label: 'Privada' },
  { value: 'PUBLIC', label: 'Pública' },
  { value: 'NON_PROFIT', label: 'Sin ánimo de lucro' },
  { value: 'COLLEGE', label: 'Colegio / institución' },
];

interface SchoolOption {
  id: string;
  name: string;
  city: string;
  isActive: boolean;
  isVerified: boolean;
}

interface EditableFields {
  name: string;
  slug: string;
  category: string;
  schoolType: string;
  description: string;
  aboutArticle: string;
  generalSchedule: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  leadFormTitle: string;
  leadFormDescription: string;
  trialClassMessage: string;
  city: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  youtube: string;
  foundedAt: string;
  capacity: string;
  isVerified: boolean;
  isActive: boolean;
}

interface SchoolUpdatePayload {
  name: string;
  slug: string;
  category: string;
  schoolType: string;
  description: string;
  aboutArticle: string;
  generalSchedule: string | null;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  leadFormTitle: string;
  leadFormDescription: string;
  trialClassMessage: string | null;
  city: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  youtube: string | null;
  foundedAt: string | null;
  capacity: number | null;
  isVerified?: boolean;
  isActive?: boolean;
}

function toDateInput(value?: string | null) {
  if (!value) return '';
  return value.slice(0, 10);
}

function toEditable(school: School): EditableFields {
  return {
    name: school.name,
    slug: school.slug,
    category: school.category,
    schoolType: school.schoolType,
    description: school.description,
    aboutArticle: school.aboutArticle,
    generalSchedule: school.generalSchedule ?? '',
    primaryCtaLabel: school.primaryCtaLabel ?? 'Solicitar información',
    secondaryCtaLabel: school.secondaryCtaLabel ?? 'Seguir',
    leadFormTitle: school.leadFormTitle ?? 'Solicitar información',
    leadFormDescription: school.leadFormDescription ?? 'La escuela recibirá tus datos y te contactará directamente.',
    trialClassMessage: school.trialClassMessage ?? '',
    city: school.city,
    address: school.address,
    phone: school.phone,
    whatsapp: school.whatsapp,
    email: school.email,
    website: school.website ?? '',
    instagram: school.instagram ?? '',
    facebook: school.facebook ?? '',
    tiktok: school.tiktok ?? '',
    youtube: school.youtube ?? '',
    foundedAt: toDateInput(school.foundedAt),
    capacity: school.capacity != null ? String(school.capacity) : '',
    isVerified: school.isVerified,
    isActive: school.isActive,
  };
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function optionalString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function isValidUrl(value: string) {
  if (!value.trim()) return true;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function isValidSocialValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith('@')) return trimmed.length > 1;
  if (/^[a-zA-Z0-9._-]+$/.test(trimmed)) return true;
  return isValidUrl(trimmed);
}

function validateForm(form: EditableFields) {
  const errors: string[] = [];
  const phonePattern = /^[+\d\s().-]{6,}$/;

  if (form.name.trim().length < 3) errors.push('El nombre debe tener al menos 3 caracteres.');
  if (!/^[a-z0-9-]{3,}$/.test(form.slug)) errors.push('El slug debe tener al menos 3 caracteres y solo usar minúsculas, números o guiones.');
  if (form.description.trim().length < 10) errors.push('La descripción corta debe tener al menos 10 caracteres.');
  if (form.aboutArticle.trim().length < 20) errors.push('El artículo institucional debe tener al menos 20 caracteres.');
  if (form.city.trim().length < 2) errors.push('La ciudad es obligatoria.');
  if (form.address.trim().length < 5) errors.push('La dirección debe tener al menos 5 caracteres.');
  if (!phonePattern.test(form.phone)) errors.push('El teléfono debe tener un formato válido.');
  if (!phonePattern.test(form.whatsapp)) errors.push('El WhatsApp debe tener un formato válido.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.push('El correo debe ser válido.');
  if (!isValidUrl(form.website)) errors.push('El sitio web debe ser una URL válida.');
  if (!isValidSocialValue(form.instagram)) errors.push('Instagram debe ser una URL válida o un usuario.');
  if (!isValidSocialValue(form.facebook)) errors.push('Facebook debe ser una URL válida o un usuario.');
  if (!isValidSocialValue(form.tiktok)) errors.push('TikTok debe ser una URL válida o un usuario.');
  if (!isValidSocialValue(form.youtube)) errors.push('YouTube debe ser una URL válida o un canal.');
  if (form.capacity && Number(form.capacity) < 0) errors.push('La capacidad no puede ser negativa.');
  if (form.primaryCtaLabel.trim().length < 3) errors.push('El CTA principal debe tener al menos 3 caracteres.');
  if (form.secondaryCtaLabel.trim().length < 3) errors.push('El CTA secundario debe tener al menos 3 caracteres.');
  if (form.leadFormTitle.trim().length < 3) errors.push('El título del formulario de solicitudes debe tener al menos 3 caracteres.');
  if (form.leadFormDescription.trim().length < 10) errors.push('El mensaje del formulario de solicitudes debe tener al menos 10 caracteres.');

  return errors;
}

function buildPayload(form: EditableFields, includePlatformFields: boolean): SchoolUpdatePayload {
  const payload: SchoolUpdatePayload = {
    name: form.name.trim(),
    slug: normalizeSlug(form.slug),
    category: form.category,
    schoolType: form.schoolType,
    description: form.description.trim(),
    aboutArticle: form.aboutArticle.trim(),
    generalSchedule: optionalString(form.generalSchedule),
    primaryCtaLabel: form.primaryCtaLabel.trim(),
    secondaryCtaLabel: form.secondaryCtaLabel.trim(),
    leadFormTitle: form.leadFormTitle.trim(),
    leadFormDescription: form.leadFormDescription.trim(),
    trialClassMessage: optionalString(form.trialClassMessage),
    city: form.city.trim(),
    address: form.address.trim(),
    phone: form.phone.trim(),
    whatsapp: form.whatsapp.trim(),
    email: form.email.trim(),
    website: optionalString(form.website),
    instagram: optionalString(form.instagram),
    facebook: optionalString(form.facebook),
    tiktok: optionalString(form.tiktok),
    youtube: optionalString(form.youtube),
    foundedAt: optionalString(form.foundedAt),
    capacity: form.capacity ? Number(form.capacity) : null,
  };

  if (includePlatformFields) {
    payload.isVerified = form.isVerified;
    payload.isActive = form.isActive;
  }

  return payload;
}

function fieldClasses(hasError = false) {
  return `mt-1 w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none ${
    hasError ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-[#006b2d]'
  }`;
}

const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-500';

export default function SchoolProfileAdmin() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isPlatformAdmin = user?.role === 'PLATFORM_ADMIN';

  const [schoolOptions, setSchoolOptions] = useState<SchoolOption[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [school, setSchool] = useState<School | null>(null);
  const [form, setForm] = useState<EditableFields | null>(null);
  const [captionDrafts, setCaptionDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  async function loadSchoolById(schoolId: string) {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await api.get<{ ok: boolean; data: School }>(`/schools/${schoolId}`);
      setSelectedSchoolId(response.data.data.id);
      setSchool(response.data.data);
      setForm(toEditable(response.data.data));
      setValidationErrors([]);
    } catch (err: unknown) {
      setFetchError((err as { message?: string })?.message ?? 'No se pudo cargar la escuela.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function loadInitialSchool() {
      setLoading(true);
      setFetchError(null);
      try {
        if (isPlatformAdmin) {
          const response = await api.get<{ ok: boolean; data: SchoolOption[] }>('/schools/admin');
          setSchoolOptions(response.data.data);
          const firstSchool = response.data.data[0];
          if (firstSchool) {
            await loadSchoolById(firstSchool.id);
          } else {
            setSchool(null);
            setForm(null);
          }
          return;
        }

        const response = await api.get<{ ok: boolean; data: School }>('/admin/my-school');
        setSchool(response.data.data);
        setSelectedSchoolId(response.data.data.id);
        setForm(toEditable(response.data.data));
        setValidationErrors([]);
      } catch (err: unknown) {
        setFetchError((err as { message?: string })?.message ?? 'No se pudo cargar la escuela.');
      } finally {
        setLoading(false);
      }
    }

    loadInitialSchool();
  }, [isPlatformAdmin]);

  useEffect(() => {
    const drafts: Record<string, string> = {};
    (school?.mediaAssets ?? []).forEach((asset) => {
      drafts[asset.id] = asset.caption ?? '';
    });
    setCaptionDrafts(drafts);
  }, [school]);

  const galleryAssets = useMemo(
    () => (school?.mediaAssets ?? []).filter((asset) => asset.type === 'GALLERY'),
    [school],
  );

  function updateField<K extends keyof EditableFields>(key: K, value: EditableFields[K]) {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  async function refreshCurrentSchool() {
    if (!selectedSchoolId) return;
    await loadSchoolById(selectedSchoolId);
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!school || !form) return;

    const errors = validateForm(form);
    setValidationErrors(errors);
    if (errors.length) return;

    if (isPlatformAdmin && school.isActive && !form.isActive) {
      const confirmed = confirm('Vas a desactivar esta escuela. Dejará de aparecer en listados públicos. ¿Continuar?');
      if (!confirmed) return;
    }

    setSaving(true);
    try {
      const payload = buildPayload(form, isPlatformAdmin);
      const response = await api.patch<{ ok: boolean; data: School }>(`/schools/${school.id}`, payload);
      setSchool(response.data.data);
      setForm(toEditable(response.data.data));
      setValidationErrors([]);
      showToast('Perfil de escuela actualizado correctamente', 'success');
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'Error al guardar', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleImagePatch(payload: { profileImageUrl?: string | null; coverImageUrl?: string | null }) {
    if (!school) return;
    try {
      const response = await api.patch<{ ok: boolean; data: School }>(`/schools/${school.id}`, payload);
      setSchool(response.data.data);
      setForm(toEditable(response.data.data));
      showToast('Imagen actualizada', 'success');
    } catch {
      showToast('Error al actualizar imagen', 'error');
    }
  }

  async function handleCaptionSave(asset: MediaAsset) {
    try {
      await api.patch(`/media/${asset.id}`, { caption: captionDrafts[asset.id]?.trim() || null });
      await refreshCurrentSchool();
      showToast('Texto de imagen actualizado', 'success');
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'No se pudo actualizar la imagen', 'error');
    }
  }

  async function handleSetPrimary(asset: MediaAsset) {
    try {
      await api.patch('/media/primary', { mediaId: asset.id });
      await refreshCurrentSchool();
      showToast('Imagen marcada como principal', 'success');
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'No se pudo marcar la imagen', 'error');
    }
  }

  async function handleDeleteMedia(asset: MediaAsset) {
    if (!confirm('¿Eliminar esta imagen de la galería pública?')) return;
    try {
      await api.patch(`/media/${asset.id}/deactivate`);
      await refreshCurrentSchool();
      showToast('Imagen desactivada de la galería', 'success');
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'No se pudo eliminar la imagen', 'error');
    }
  }

  if (loading) return <SkeletonCard />;
  if (fetchError) return <p className="p-6 text-red-600">{fetchError}</p>;
  if (!form || !school) {
    return (
      <Card>
        <p className="text-sm text-slate-600">No hay una escuela disponible para editar.</p>
      </Card>
    );
  }

  const relatedSections = [
    { title: 'Artículos', count: school.articles?.length ?? 0, href: '/admin/articles', icon: 'article', description: 'Noticias, novedades y publicaciones educativas.' },
    { title: 'Programas', count: school.programs?.length ?? 0, href: '/admin/programs', icon: 'auto_stories', description: 'Cursos, modalidad, nivel, precio e imagen de programa.' },
    { title: 'Instructores', count: school.instructors?.length ?? 0, href: '/admin/instructors', icon: 'groups', description: 'Docentes, biografía, especialidades y foto.' },
    { title: 'Fotos y reels', count: school.mediaAssets?.length ?? 0, href: '/admin/media', icon: 'photo_library', description: 'Galería, imágenes destacadas y videos cortos.' },
    { title: 'Sedes', count: school.campuses?.length ?? 0, href: '/admin/campuses', icon: 'location_on', description: 'Ubicaciones donde ocurren las clases y eventos.' },
    { title: 'Horarios', count: undefined, href: '/admin/schedules', icon: 'schedule', description: 'Franjas por programa, sede y cupos disponibles.' },
    { title: 'Eventos', count: school.events?.length ?? 0, href: '/admin/events', icon: 'event', description: 'Audiciones, muestras, recitales y talleres.' },
    { title: 'Campañas', count: school.campaigns?.length ?? 0, href: '/admin/campaigns', icon: 'campaign', description: 'Promociones y convocatorias activas.' },
    { title: 'Solicitudes', count: undefined, href: '/admin/leads', icon: 'inbox', description: 'Solicitudes de inscripción e información.' },
    { title: 'Clases de prueba', count: undefined, href: '/admin/trial-classes', icon: 'fact_check', description: 'Solicitudes de clase de prueba y confirmaciones.' },
  ];

  return (
    <form onSubmit={handleSave} className="max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#006b2d]">Perfil público</p>
          <h1 className="mt-2 text-2xl font-black text-slate-950">{school.name}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Edita los datos que se publican en el perfil de la escuela. Las secciones operativas se gestionan desde sus módulos.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant={school.isActive ? 'success' : 'default'}>{school.isActive ? 'Activa' : 'Inactiva'}</Badge>
            <Badge variant={school.isVerified ? 'success' : 'warning'}>{school.isVerified ? 'Verificada' : 'Sin verificar'}</Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to={`/schools/${school.id}`}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#006b2d] hover:text-[#006b2d]"
          >
            Ver perfil público
          </Link>
          <button
            type="button"
            onClick={() => setForm(toEditable(school))}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Restaurar cambios
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[#006b2d] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#005723] disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar perfil'}
          </button>
        </div>
      </div>

      {isPlatformAdmin && (
        <Card>
          <h2 className="mb-4 text-xl font-semibold">Escuela seleccionada</h2>
          <select
            value={selectedSchoolId}
            onChange={(event) => loadSchoolById(event.target.value)}
            className={fieldClasses()}
          >
            {schoolOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} · {option.city} · {option.isActive ? 'Activa' : 'Inactiva'}
              </option>
            ))}
          </select>
        </Card>
      )}

      {validationErrors.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">Revisa estos campos antes de guardar:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {validationErrors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}

      <Card>
        <h2 className="mb-6 text-xl font-semibold">Imágenes principales</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <ImageUploadField
            label="Logo / foto de perfil"
            description="Imagen cuadrada para cards, listados y encabezado del perfil."
            recommended="512 x 512 px"
            maxSizeMb={2}
            minWidth={400}
            minHeight={400}
            aspectRatio={1}
            currentUrl={school.profileImageUrl}
            schoolId={school.id}
            mediaType="PROFILE_IMAGE"
            onChange={(url) => handleImagePatch({ profileImageUrl: url })}
          />
          <ImageUploadField
            label="Imagen de portada"
            description="Imagen horizontal para el encabezado del perfil público."
            recommended="1600 x 600 px"
            maxSizeMb={4}
            minWidth={1200}
            aspectRatio={1600 / 600}
            currentUrl={school.coverImageUrl}
            schoolId={school.id}
            mediaType="COVER_IMAGE"
            onChange={(url) => handleImagePatch({ coverImageUrl: url })}
          />
        </div>
      </Card>

      <Card>
        <h2 className="mb-6 text-xl font-semibold">Información general</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Nombre de la escuela *</label>
            <input className={fieldClasses()} required value={form.name} onChange={(event) => updateField('name', event.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Slug público *</label>
            <input
              className={fieldClasses()}
              required
              value={form.slug}
              onChange={(event) => updateField('slug', normalizeSlug(event.target.value))}
              placeholder="academia-de-musica"
            />
          </div>
          <div>
            <label className={labelCls}>Categoría *</label>
            <select className={fieldClasses()} value={form.category} onChange={(event) => updateField('category', event.target.value)}>
              {CATEGORY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Tipo de escuela *</label>
            <select className={fieldClasses()} value={form.schoolType} onChange={(event) => updateField('schoolType', event.target.value)}>
              {SCHOOL_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Año de fundación</label>
            <input type="date" className={fieldClasses()} value={form.foundedAt} onChange={(event) => updateField('foundedAt', event.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Capacidad estimada</label>
            <input type="number" min="0" className={fieldClasses()} value={form.capacity} onChange={(event) => updateField('capacity', event.target.value)} />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-6 text-xl font-semibold">Descripción y presentación</h2>
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Descripción corta *</label>
            <textarea className={fieldClasses()} rows={3} required value={form.description} onChange={(event) => updateField('description', event.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Artículo / acerca de la escuela *</label>
            <textarea className={fieldClasses()} rows={8} minLength={20} required value={form.aboutArticle} onChange={(event) => updateField('aboutArticle', event.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Horario general visible</label>
            <textarea className={fieldClasses()} rows={3} value={form.generalSchedule} onChange={(event) => updateField('generalSchedule', event.target.value)} placeholder="Lunes a viernes de 10:00 a 20:00" />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-6 text-xl font-semibold">Mensajes y llamadas a la acción</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>CTA principal *</label>
            <input className={fieldClasses()} required value={form.primaryCtaLabel} onChange={(event) => updateField('primaryCtaLabel', event.target.value)} />
          </div>
          <div>
            <label className={labelCls}>CTA secundario *</label>
            <input className={fieldClasses()} required value={form.secondaryCtaLabel} onChange={(event) => updateField('secondaryCtaLabel', event.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Título del formulario de solicitudes *</label>
            <input className={fieldClasses()} required value={form.leadFormTitle} onChange={(event) => updateField('leadFormTitle', event.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Mensaje del formulario de solicitudes *</label>
            <textarea className={fieldClasses()} rows={3} required value={form.leadFormDescription} onChange={(event) => updateField('leadFormDescription', event.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Mensaje para clase de prueba</label>
            <textarea className={fieldClasses()} rows={3} value={form.trialClassMessage} onChange={(event) => updateField('trialClassMessage', event.target.value)} />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-6 text-xl font-semibold">Contacto y ubicación</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Ciudad *</label>
            <input className={fieldClasses()} required value={form.city} onChange={(event) => updateField('city', event.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Dirección *</label>
            <input className={fieldClasses()} required value={form.address} onChange={(event) => updateField('address', event.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Teléfono *</label>
            <input className={fieldClasses()} required value={form.phone} onChange={(event) => updateField('phone', event.target.value)} />
          </div>
          <div>
            <label className={labelCls}>WhatsApp *</label>
            <input className={fieldClasses()} required value={form.whatsapp} onChange={(event) => updateField('whatsapp', event.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Correo *</label>
            <input type="email" className={fieldClasses()} required value={form.email} onChange={(event) => updateField('email', event.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Sitio web</label>
            <input type="url" className={fieldClasses()} value={form.website} onChange={(event) => updateField('website', event.target.value)} placeholder="https://..." />
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-6 text-xl font-semibold">Redes sociales</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {(['instagram', 'facebook', 'tiktok', 'youtube'] as const).map((network) => (
            <div key={network}>
              <label className={labelCls}>{network.charAt(0).toUpperCase() + network.slice(1)}</label>
              <input className={fieldClasses()} value={form[network]} onChange={(event) => updateField(network, event.target.value)} placeholder="@usuario o URL" />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Galería pública</h2>
            <p className="mt-1 text-sm text-slate-500">Estas imágenes son propias de la escuela y se usan en el perfil público.</p>
          </div>
          <div className="w-full sm:w-72">
            <ImageUploadField
              label="Agregar imagen a galería"
              description="Imagen propia de la escuela para el perfil público."
              recommended="Mínimo 1200 px de ancho"
              maxSizeMb={4}
              minWidth={1200}
              schoolId={school.id}
              mediaType="GALLERY"
              allowRemove={false}
              allowUrlInput={false}
              onChange={() => refreshCurrentSchool()}
            />
          </div>
        </div>

        {galleryAssets.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {galleryAssets.map((asset) => (
              <div key={asset.id} className="rounded-2xl border border-slate-200 p-3">
                <img src={asset.url} alt={asset.caption ?? ''} className="h-36 w-full rounded-xl object-cover" />
                <label className={`${labelCls} mt-3`}>Texto alternativo / caption</label>
                <input
                  className={fieldClasses()}
                  value={captionDrafts[asset.id] ?? ''}
                  onChange={(event) => setCaptionDrafts((prev) => ({ ...prev, [asset.id]: event.target.value }))}
                  maxLength={160}
                  placeholder="Clase de pintura, muestra, recital..."
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => handleCaptionSave(asset)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">
                    Guardar texto
                  </button>
                  <button type="button" onClick={() => handleSetPrimary(asset)} className="rounded-full border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-[#006b2d] hover:bg-emerald-50">
                    {asset.isPrimary ? 'Principal' : 'Marcar principal'}
                  </button>
                  <button type="button" onClick={() => handleDeleteMedia(asset)} className="rounded-full border border-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
            No hay imágenes de galería. Sube imágenes propias de la escuela para mostrarlas en el perfil público.
          </div>
        )}
      </Card>

      {isPlatformAdmin && (
        <Card>
          <h2 className="mb-4 text-xl font-semibold">Estado y visibilidad</h2>
          <div className="flex flex-wrap gap-6">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-[#006b2d]"
                checked={form.isVerified}
                onChange={(event) => updateField('isVerified', event.target.checked)}
              />
              Escuela verificada
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="accent-[#006b2d]"
                checked={form.isActive}
                onChange={(event) => updateField('isActive', event.target.checked)}
              />
              Escuela activa
            </label>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="mb-6 text-xl font-semibold">Secciones relacionadas del perfil público</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {relatedSections.map((section) => (
            <div key={section.title} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined rounded-full bg-[#e8f5ec] p-2 text-[#006b2d]">{section.icon}</span>
                <div>
                  <h3 className="font-semibold text-slate-900">{section.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{section.description}</p>
                  {section.count !== undefined && <p className="mt-2 text-xs font-semibold text-slate-400">{section.count} elementos activos</p>}
                </div>
              </div>
              <Link
                to={section.href}
                className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-[#006b2d] hover:text-[#006b2d]"
              >
                Gestionar {section.title.toLowerCase()}
              </Link>
            </div>
          ))}
        </div>
      </Card>

      <div className="sticky bottom-4 z-20 flex justify-end">
        <div className="flex gap-2 rounded-full border border-slate-200 bg-white p-2 shadow-lg">
          <button type="button" onClick={() => setForm(toEditable(school))} className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Restaurar
          </button>
          <button type="submit" disabled={saving} className="rounded-full bg-[#006b2d] px-6 py-2 text-sm font-semibold text-white hover:bg-[#005723] disabled:opacity-60">
            {saving ? 'Guardando...' : 'Guardar perfil'}
          </button>
        </div>
      </div>
    </form>
  );
}

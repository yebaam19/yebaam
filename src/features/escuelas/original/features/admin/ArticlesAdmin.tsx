import { FormEvent, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useAdminSchools } from '../../hooks/useAdminSchools';
import { useArticlesAdmin, type ArticleAdminPayload } from '../../hooks/useArticlesAdmin';
import type { Article, ArticleStatus } from '../../types';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import { AdminEmptyState, AdminErrorState, AdminLoadingState } from '../../components/admin/AdminState';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import ImageUploadField from '../../components/admin/ImageUploadField';
import VideoUploadField from '../../components/admin/VideoUploadField';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

type ArticleForm = {
  schoolId: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string;
  coverImageUrl: string;
  videoUrl: string;
  status: ArticleStatus;
};

const EMPTY_FORM: ArticleForm = {
  schoolId: '',
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  category: '',
  tags: '',
  coverImageUrl: '',
  videoUrl: '',
  status: 'DRAFT',
};

const STATUS_LABELS: Record<ArticleStatus, string> = {
  DRAFT: 'Borrador',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Archivado',
};

function inputCls() {
  return 'mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-[#006b2d] focus:outline-none';
}

function labelCls() {
  return 'block text-xs font-semibold uppercase tracking-wide text-slate-500';
}

function articleToForm(article: Article): ArticleForm {
  return {
    schoolId: article.schoolId,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    content: article.content,
    category: article.category ?? '',
    tags: article.tags.join(', '),
    coverImageUrl: article.coverImageUrl ?? '',
    videoUrl: article.videoUrl ?? '',
    status: article.status,
  };
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

export default function ArticlesAdmin() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { schools } = useAdminSchools();
  const { articles, loading, error, refetch, createArticle, updateArticle, publishArticle, archiveArticle } = useArticlesAdmin();
  const isPlatformAdmin = user?.role === 'PLATFORM_ADMIN';

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ArticleForm>(EMPTY_FORM);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ArticleStatus>('ALL');
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Article | null>(null);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, schoolId: schools[0]?.id ?? '' });
    setFormErrors([]);
    setModalOpen(true);
  }

  function openEdit(article: Article) {
    setEditingId(article.id);
    setForm(articleToForm(article));
    setFormErrors([]);
    setModalOpen(true);
  }

  function validateForm() {
    const errors: string[] = [];
    if (isPlatformAdmin && !form.schoolId) errors.push('Selecciona la escuela asociada.');
    if (form.title.trim().length < 3) errors.push('El título debe tener al menos 3 caracteres.');
    if (form.excerpt.trim().length < 10) errors.push('El resumen debe tener al menos 10 caracteres.');
    if (form.content.trim().length < 20) errors.push('El contenido debe tener al menos 20 caracteres.');
    if (!validUrl(form.coverImageUrl)) errors.push('La URL de imagen destacada debe ser válida.');
    if (!validUrl(form.videoUrl)) errors.push('La URL de video o reel debe ser válida.');
    setFormErrors(errors);
    return errors.length === 0;
  }

  function buildPayload(): ArticleAdminPayload {
    return {
      ...(isPlatformAdmin ? { schoolId: form.schoolId } : {}),
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      excerpt: form.excerpt.trim(),
      content: form.content.trim(),
      category: form.category.trim() || null,
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      coverImageUrl: form.coverImageUrl.trim() || null,
      videoUrl: form.videoUrl.trim() || null,
      status: form.status,
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await updateArticle(editingId, buildPayload());
        showToast('Artículo actualizado', 'success');
      } else {
        await createArticle(buildPayload());
        showToast('Artículo creado', 'success');
      }
      setModalOpen(false);
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'Error al guardar artículo', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleArchive() {
    if (!archiveTarget) return;
    setSubmitting(true);
    try {
      await archiveArticle(archiveTarget.id);
      showToast('Artículo archivado', 'success');
      setArchiveTarget(null);
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'No se pudo archivar', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePublish(article: Article) {
    setSubmitting(true);
    try {
      await publishArticle(article.id);
      showToast('Artículo publicado', 'success');
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message ?? 'No se pudo publicar', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  const visibleArticles = articles.filter((article) => {
    const text = `${article.title} ${article.excerpt} ${article.category ?? ''} ${article.school?.name ?? ''}`.toLowerCase();
    return text.includes(query.toLowerCase().trim()) && (statusFilter === 'ALL' || article.status === statusFilter);
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Artículos"
        description="Crea noticias, novedades, consejos y publicaciones que aparecerán en el perfil público de la escuela."
        meta={<Badge variant="success">{articles.filter((article) => article.status === 'PUBLISHED').length} publicados</Badge>}
        actions={<button type="button" onClick={openCreate} className="rounded-full bg-[#006b2d] px-5 py-2 text-sm font-semibold text-white hover:bg-[#005723]">Nuevo artículo</button>}
      />

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto]">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título, categoría o escuela..." className="h-10 rounded-xl border border-slate-200 px-4 text-sm focus:border-[#006b2d] focus:outline-none" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'ALL' | ArticleStatus)} className="h-10 rounded-xl border border-slate-200 px-4 text-sm focus:border-[#006b2d] focus:outline-none">
          <option value="ALL">Todos los estados</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      {loading ? (
        <AdminLoadingState rows={5} />
      ) : error ? (
        <AdminErrorState message={error} onRetry={refetch} />
      ) : !visibleArticles.length ? (
        <AdminEmptyState title="Sin artículos" description="Publica novedades, historias de estudiantes o consejos para padres y aspirantes." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Artículo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {visibleArticles.map((article) => (
                <tr key={article.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {article.coverImageUrl ? <img src={article.coverImageUrl} alt="" className="h-12 w-16 rounded-lg object-cover" /> : <div className="h-12 w-16 rounded-lg bg-slate-100" />}
                      <div>
                        <p className="font-semibold text-slate-900">{article.title}</p>
                        <p className="line-clamp-1 max-w-md text-xs text-slate-500">{article.excerpt}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{article.category || 'General'}</td>
                  <td className="px-4 py-3"><Badge variant={article.status === 'PUBLISHED' ? 'success' : 'default'}>{STATUS_LABELS[article.status]}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => openEdit(article)} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium hover:bg-slate-100">Editar</button>
                      {article.status !== 'PUBLISHED' ? <button type="button" onClick={() => handlePublish(article)} className="rounded-full border border-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50">Publicar</button> : null}
                      {article.status !== 'ARCHIVED' ? <button type="button" onClick={() => setArchiveTarget(article)} className="rounded-full border border-red-100 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Archivar</button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Editar artículo' : 'Nuevo artículo'} maxWidth="max-w-3xl">
        <form onSubmit={handleSubmit} className="max-h-[76vh] space-y-4 overflow-y-auto pr-1">
          {formErrors.length ? <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">{formErrors.map((item) => <p key={item}>{item}</p>)}</div> : null}
          {isPlatformAdmin ? (
            <div>
              <label className={labelCls()}>Escuela asociada *</label>
              <select value={form.schoolId} onChange={(event) => setForm({ ...form, schoolId: event.target.value })} required className={inputCls()}>
                <option value="">Seleccionar escuela</option>
                {schools.map((school) => <option key={school.id} value={school.id}>{school.name}</option>)}
              </select>
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className={labelCls()}>Título *</label><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required className={inputCls()} /></div>
            <div><label className={labelCls()}>Slug</label><input value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} className={inputCls()} placeholder="se-autogenera-si-lo-dejas-vacio" /></div>
          </div>
          <div><label className={labelCls()}>Resumen *</label><textarea value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} required rows={2} className={inputCls()} /></div>
          <div><label className={labelCls()}>Contenido *</label><textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} required rows={8} className={inputCls()} /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><label className={labelCls()}>Categoría</label><input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={inputCls()} placeholder="Noticias, audiciones, consejos..." /></div>
            <div><label className={labelCls()}>Etiquetas</label><input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} className={inputCls()} placeholder="danza, audición, padres" /></div>
          </div>
          <ImageUploadField label="Imagen destacada" description="Portada del artículo en el perfil público y listados." recommended="1200 x 675 px" maxSizeMb={3} minWidth={900} aspectRatio={1200 / 675} currentUrl={form.coverImageUrl} mediaType="GALLERY" schoolId={form.schoolId || undefined} onChange={(url) => setForm({ ...form, coverImageUrl: url ?? '' })} />
          <VideoUploadField label="Video o reel opcional" description="Agrega un reel de apoyo si la publicación necesita mostrar una clase, muestra o ensayo." currentUrl={form.videoUrl} onChange={(url) => setForm({ ...form, videoUrl: url ?? '' })} />
          <div>
            <label className={labelCls()}>Estado</label>
            <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ArticleStatus })} className={inputCls()}>
              {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <button type="submit" disabled={submitting} className="w-full rounded-full bg-[#006b2d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#005723] disabled:opacity-60">{submitting ? 'Guardando...' : 'Guardar artículo'}</button>
        </form>
      </Modal>

      <ConfirmDialog open={!!archiveTarget} title="Archivar artículo" description="El artículo dejará de aparecer en el perfil público, pero seguirá disponible en el administrador." confirmLabel="Archivar" tone="danger" loading={submitting} onConfirm={handleArchive} onCancel={() => setArchiveTarget(null)} />
    </div>
  );
}

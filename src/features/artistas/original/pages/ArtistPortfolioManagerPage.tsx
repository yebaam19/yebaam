import { useEffect, useState } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { getApiErrorMessage } from "../lib/apiErrors";
import { useApiQuery } from "../hooks/useApiQuery";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import type { ApiResponse, PortfolioItem } from "../types";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/PageHeader";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Textarea } from "../components/ui/Textarea";

type PortfolioForm = {
  title: string;
  description: string;
  mediaType: string;
  mediaUrl: string;
  thumbnailUrl: string;
  externalUrl: string;
  year: string;
  role: string;
  credits: string;
  location: string;
  tags: string;
  status: string;
};

const emptyPortfolioForm: PortfolioForm = {
  title: "",
  description: "",
  mediaType: "IMAGE",
  mediaUrl: "",
  thumbnailUrl: "",
  externalUrl: "",
  year: "",
  role: "",
  credits: "",
  location: "",
  tags: "",
  status: "PUBLISHED"
};

function toForm(item: PortfolioItem): PortfolioForm {
  return {
    title: item.title,
    description: item.description ?? "",
    mediaType: item.mediaType,
    mediaUrl: item.mediaUrl,
    thumbnailUrl: item.thumbnailUrl ?? "",
    externalUrl: item.externalUrl ?? "",
    year: item.year ? String(item.year) : "",
    role: item.role ?? "",
    credits: item.credits ?? "",
    location: item.location ?? "",
    tags: item.tags.join(", "),
    status: item.status ?? "PUBLISHED"
  };
}

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function payloadFromForm(form: PortfolioForm) {
  return {
    title: form.title,
    description: optional(form.description),
    mediaType: form.mediaType,
    mediaUrl: form.mediaUrl,
    thumbnailUrl: optional(form.thumbnailUrl),
    externalUrl: optional(form.externalUrl),
    year: form.year ? Number(form.year) : null,
    role: optional(form.role),
    credits: optional(form.credits),
    location: optional(form.location),
    tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    status: form.status
  };
}

export function PortfolioManagerPanel({ artistId, title = "Portafolio" }: { artistId: string; title?: string }) {
  const { data, isLoading, error, refetch } = useApiQuery<PortfolioItem[]>(`/artists/${artistId}/portfolio`, [artistId]);
  const { showToast } = useToast();
  const [form, setForm] = useState<PortfolioForm>(emptyPortfolioForm);
  const [editing, setEditing] = useState<PortfolioItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PortfolioItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(editing ? toForm(editing) : emptyPortfolioForm);
  }, [editing]);

  function updateField(field: keyof PortfolioForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openCreate() {
    setEditing(null);
    setIsModalOpen(true);
  }

  function openEdit(item: PortfolioItem) {
    setEditing(item);
    setIsModalOpen(true);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      if (editing) {
        await api.patch<ApiResponse<PortfolioItem>>(`/portfolio/${editing.id}`, payloadFromForm(form));
        showToast("Ítem de portafolio actualizado", "success");
      } else {
        await api.post<ApiResponse<PortfolioItem>>(`/artists/${artistId}/portfolio`, payloadFromForm(form));
        showToast("Ítem de portafolio creado", "success");
      }
      setIsModalOpen(false);
      setEditing(null);
      await refetch();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "No se pudo guardar el portafolio"), "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      await api.delete<ApiResponse<PortfolioItem>>(`/portfolio/${deleteTarget.id}`);
      showToast("Ítem de portafolio archivado", "success");
      setDeleteTarget(null);
      await refetch();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "No se pudo eliminar el ítem"), "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        description="Gestiona piezas multimedia reales del perfil artístico."
        action={<Button type="button" size="sm" icon={<Plus size={15} aria-hidden="true" />} onClick={openCreate}>Nuevo ítem</Button>}
      />

      {error ? (
        <ErrorState title="No se pudo cargar el portafolio" description={error} onRetry={refetch} />
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-64" />)}
        </div>
      ) : data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-[4/3] bg-brand-mintLight">
                {item.thumbnailUrl || item.mediaUrl ? (
                  <img src={item.thumbnailUrl ?? item.mediaUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : null}
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant="mint">{item.mediaType}</Badge>
                    <h2 className="mt-2 font-black text-brand-ink">{item.title}</h2>
                  </div>
                  {item.status ? <StatusBadge status={item.status} /> : null}
                </div>
                {item.description ? <p className="line-clamp-2 text-sm text-brand-muted">{item.description}</p> : null}
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 4).map((tag) => <Badge key={tag} variant="default">{tag}</Badge>)}
                </div>
                <div className="flex flex-wrap justify-between gap-2 border-t border-brand-border pt-3">
                  <a
                    href={item.externalUrl ?? item.mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-brand-green transition hover:bg-brand-mintLight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
                  >
                    <ExternalLink size={14} aria-hidden="true" />
                    Abrir
                  </a>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" icon={<Pencil size={14} aria-hidden="true" />} onClick={() => openEdit(item)}>Editar</Button>
                    <Button type="button" variant="danger" size="sm" icon={<Trash2 size={14} aria-hidden="true" />} onClick={() => setDeleteTarget(item)}>Eliminar</Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin piezas de portafolio" description="Crea el primer ítem multimedia para mostrar tu trabajo." action={<Button type="button" onClick={openCreate}>Crear ítem</Button>} />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? "Editar portafolio" : "Nuevo portafolio"} size="lg">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="portfolio-title" className="mb-1.5 block text-sm font-semibold text-brand-ink">Título</label>
            <Input id="portfolio-title" value={form.title} onChange={(event) => updateField("title", event.target.value)} required />
          </div>
          <div>
            <label htmlFor="portfolio-type" className="mb-1.5 block text-sm font-semibold text-brand-ink">Tipo</label>
            <Select id="portfolio-type" value={form.mediaType} onChange={(event) => updateField("mediaType", event.target.value)}>
              <option value="IMAGE">Imagen</option>
              <option value="VIDEO">Video</option>
              <option value="AUDIO">Audio</option>
              <option value="DOCUMENT">Documento</option>
              <option value="LINK">Enlace</option>
            </Select>
          </div>
          <div>
            <label htmlFor="portfolio-status" className="mb-1.5 block text-sm font-semibold text-brand-ink">Estado</label>
            <Select id="portfolio-status" value={form.status} onChange={(event) => updateField("status", event.target.value)}>
              <option value="PUBLISHED">Publicado</option>
              <option value="DRAFT">Borrador</option>
              <option value="UNPUBLISHED">No publicado</option>
              <option value="ARCHIVED">Archivado</option>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="portfolio-media-url" className="mb-1.5 block text-sm font-semibold text-brand-ink">URL del media</label>
            <Input id="portfolio-media-url" type="url" value={form.mediaUrl} onChange={(event) => updateField("mediaUrl", event.target.value)} required />
          </div>
          <div>
            <label htmlFor="portfolio-thumb-url" className="mb-1.5 block text-sm font-semibold text-brand-ink">Thumbnail</label>
            <Input id="portfolio-thumb-url" type="url" value={form.thumbnailUrl} onChange={(event) => updateField("thumbnailUrl", event.target.value)} />
          </div>
          <div>
            <label htmlFor="portfolio-external-url" className="mb-1.5 block text-sm font-semibold text-brand-ink">Enlace externo</label>
            <Input id="portfolio-external-url" type="url" value={form.externalUrl} onChange={(event) => updateField("externalUrl", event.target.value)} />
          </div>
          <div>
            <label htmlFor="portfolio-year" className="mb-1.5 block text-sm font-semibold text-brand-ink">Año</label>
            <Input id="portfolio-year" type="number" min={1900} max={2100} value={form.year} onChange={(event) => updateField("year", event.target.value)} />
          </div>
          <div>
            <label htmlFor="portfolio-location" className="mb-1.5 block text-sm font-semibold text-brand-ink">Ubicación</label>
            <Input id="portfolio-location" value={form.location} onChange={(event) => updateField("location", event.target.value)} />
          </div>
          <div>
            <label htmlFor="portfolio-role" className="mb-1.5 block text-sm font-semibold text-brand-ink">Rol</label>
            <Input id="portfolio-role" value={form.role} onChange={(event) => updateField("role", event.target.value)} />
          </div>
          <div>
            <label htmlFor="portfolio-tags" className="mb-1.5 block text-sm font-semibold text-brand-ink">Tags separados por coma</label>
            <Input id="portfolio-tags" value={form.tags} onChange={(event) => updateField("tags", event.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="portfolio-description" className="mb-1.5 block text-sm font-semibold text-brand-ink">Descripción</label>
            <Textarea id="portfolio-description" value={form.description} onChange={(event) => updateField("description", event.target.value)} rows={4} />
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={isSaving}>{isSaving ? "Guardando..." : "Guardar"}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Eliminar ítem de portafolio"
        description={`Se archivará "${deleteTarget?.title ?? "este ítem"}" del portafolio.`}
        confirmLabel={isSaving ? "Eliminando..." : "Eliminar"}
        danger
      />
    </div>
  );
}

export function ArtistPortfolioManagerPage() {
  const { user } = useAuth();
  if (!user?.artistProfileId) {
    return <EmptyState title="No tienes perfil artístico" description="No se encontró un perfil asociado a esta cuenta." />;
  }
  return <PortfolioManagerPanel artistId={user.artistProfileId} />;
}

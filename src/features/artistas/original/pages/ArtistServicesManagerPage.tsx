import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { getApiErrorMessage } from "../lib/apiErrors";
import { formatCurrency } from "../lib/formatters";
import { useApiQuery } from "../hooks/useApiQuery";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import type { ApiResponse, ServiceOffer } from "../types";
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
import { Textarea } from "../components/ui/Textarea";

type ServiceForm = {
  title: string;
  description: string;
  serviceType: string;
  priceFrom: string;
  currency: string;
  duration: string;
  locationMode: string;
  isActive: string;
};

const emptyServiceForm: ServiceForm = {
  title: "",
  description: "",
  serviceType: "LIVE_PERFORMANCE",
  priceFrom: "",
  currency: "COP",
  duration: "",
  locationMode: "TO_BE_DEFINED",
  isActive: "true"
};

function toForm(service: ServiceOffer): ServiceForm {
  return {
    title: service.title,
    description: service.description ?? "",
    serviceType: service.serviceType,
    priceFrom: service.priceFrom === undefined || service.priceFrom === null ? "" : String(service.priceFrom),
    currency: service.currency,
    duration: service.duration ?? "",
    locationMode: service.locationMode,
    isActive: service.isActive === false ? "false" : "true"
  };
}

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function payloadFromForm(form: ServiceForm) {
  return {
    title: form.title,
    description: optional(form.description),
    serviceType: form.serviceType,
    priceFrom: form.priceFrom ? Number(form.priceFrom) : null,
    currency: form.currency,
    duration: optional(form.duration),
    locationMode: form.locationMode,
    isActive: form.isActive === "true"
  };
}

export function ServicesManagerPanel({ artistId, title = "Servicios" }: { artistId: string; title?: string }) {
  const { data, isLoading, error, refetch } = useApiQuery<ServiceOffer[]>(`/artists/${artistId}/services`, [artistId]);
  const { showToast } = useToast();
  const [form, setForm] = useState<ServiceForm>(emptyServiceForm);
  const [editing, setEditing] = useState<ServiceOffer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ServiceOffer | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setForm(editing ? toForm(editing) : emptyServiceForm);
  }, [editing]);

  function updateField(field: keyof ServiceForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openCreate() {
    setEditing(null);
    setIsModalOpen(true);
  }

  function openEdit(service: ServiceOffer) {
    setEditing(service);
    setIsModalOpen(true);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    try {
      if (editing) {
        await api.patch<ApiResponse<ServiceOffer>>(`/services/${editing.id}`, payloadFromForm(form));
        showToast("Servicio actualizado", "success");
      } else {
        await api.post<ApiResponse<ServiceOffer>>(`/artists/${artistId}/services`, payloadFromForm(form));
        showToast("Servicio creado", "success");
      }
      setIsModalOpen(false);
      setEditing(null);
      await refetch();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "No se pudo guardar el servicio"), "error");
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsSaving(true);
    try {
      await api.delete<ApiResponse<ServiceOffer>>(`/services/${deleteTarget.id}`);
      showToast("Servicio archivado", "success");
      setDeleteTarget(null);
      await refetch();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "No se pudo eliminar el servicio"), "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={title}
        description="Administra servicios artísticos ofrecidos por el perfil."
        action={<Button type="button" size="sm" icon={<Plus size={15} aria-hidden="true" />} onClick={openCreate}>Nuevo servicio</Button>}
      />

      {error ? (
        <ErrorState title="No se pudieron cargar los servicios" description={error} onRetry={refetch} />
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-52" />)}
        </div>
      ) : data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((service) => (
            <Card key={service.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Badge variant="green">{service.serviceType}</Badge>
                  <h2 className="mt-2 font-black text-brand-ink">{service.title}</h2>
                </div>
                <Badge variant={service.isActive === false ? "default" : "mint"}>{service.isActive === false ? "Inactivo" : "Activo"}</Badge>
              </div>
              {service.description ? <p className="mt-3 line-clamp-3 text-sm text-brand-muted">{service.description}</p> : null}
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-brand-muted">Desde</dt>
                  <dd className="font-black text-brand-ink">{formatCurrency(service.priceFrom, service.currency)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wide text-brand-muted">Modalidad</dt>
                  <dd className="font-semibold text-brand-ink">{service.locationMode}</dd>
                </div>
              </dl>
              <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-brand-border pt-3">
                <Button type="button" variant="ghost" size="sm" icon={<Pencil size={14} aria-hidden="true" />} onClick={() => openEdit(service)}>Editar</Button>
                <Button type="button" variant="danger" size="sm" icon={<Trash2 size={14} aria-hidden="true" />} onClick={() => setDeleteTarget(service)}>Eliminar</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="Sin servicios activos" description="Crea servicios para contratación, colaboración o producción artística." action={<Button type="button" onClick={openCreate}>Crear servicio</Button>} />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? "Editar servicio" : "Nuevo servicio"} size="lg">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="service-title" className="mb-1.5 block text-sm font-semibold text-brand-ink">Título</label>
            <Input id="service-title" value={form.title} onChange={(event) => updateField("title", event.target.value)} required />
          </div>
          <div>
            <label htmlFor="service-type" className="mb-1.5 block text-sm font-semibold text-brand-ink">Tipo</label>
            <Select id="service-type" value={form.serviceType} onChange={(event) => updateField("serviceType", event.target.value)}>
              <option value="LIVE_PERFORMANCE">Presentación en vivo</option>
              <option value="PRIVATE_EVENT">Evento privado</option>
              <option value="BRAND_COLLABORATION">Colaboración de marca</option>
              <option value="PRODUCTION">Producción</option>
              <option value="CONSULTING">Consultoría</option>
              <option value="CONTENT_CREATION">Creación de contenido</option>
              <option value="OTHER">Otro</option>
            </Select>
          </div>
          <div>
            <label htmlFor="service-mode" className="mb-1.5 block text-sm font-semibold text-brand-ink">Modalidad</label>
            <Select id="service-mode" value={form.locationMode} onChange={(event) => updateField("locationMode", event.target.value)}>
              <option value="IN_PERSON">Presencial</option>
              <option value="ONLINE">Online</option>
              <option value="HYBRID">Híbrido</option>
              <option value="TO_BE_DEFINED">Por definir</option>
            </Select>
          </div>
          <div>
            <label htmlFor="service-price" className="mb-1.5 block text-sm font-semibold text-brand-ink">Precio desde</label>
            <Input id="service-price" type="number" min={0} value={form.priceFrom} onChange={(event) => updateField("priceFrom", event.target.value)} />
          </div>
          <div>
            <label htmlFor="service-currency" className="mb-1.5 block text-sm font-semibold text-brand-ink">Moneda</label>
            <Input id="service-currency" value={form.currency} onChange={(event) => updateField("currency", event.target.value.toUpperCase())} maxLength={3} required />
          </div>
          <div>
            <label htmlFor="service-duration" className="mb-1.5 block text-sm font-semibold text-brand-ink">Duración</label>
            <Input id="service-duration" value={form.duration} onChange={(event) => updateField("duration", event.target.value)} />
          </div>
          <div>
            <label htmlFor="service-active" className="mb-1.5 block text-sm font-semibold text-brand-ink">Estado</label>
            <Select id="service-active" value={form.isActive} onChange={(event) => updateField("isActive", event.target.value)}>
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="service-description" className="mb-1.5 block text-sm font-semibold text-brand-ink">Descripción</label>
            <Textarea id="service-description" value={form.description} onChange={(event) => updateField("description", event.target.value)} rows={4} />
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
        title="Eliminar servicio"
        description={`Se archivará "${deleteTarget?.title ?? "este servicio"}".`}
        confirmLabel={isSaving ? "Eliminando..." : "Eliminar"}
        danger
      />
    </div>
  );
}

export function ArtistServicesManagerPage() {
  const { user } = useAuth();
  if (!user?.artistProfileId) {
    return <EmptyState title="No tienes perfil artístico" description="No se encontró un perfil asociado a esta cuenta." />;
  }
  return <ServicesManagerPanel artistId={user.artistProfileId} />;
}

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { api } from "../lib/api";
import { getApiErrorMessage } from "../lib/apiErrors";
import { useApiQuery } from "../hooks/useApiQuery";
import { useToast } from "../contexts/ToastContext";
import type { ApiResponse, ArtistProfile } from "../types";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Input } from "../components/ui/Input";
import { PageHeader } from "../components/ui/PageHeader";
import { Select } from "../components/ui/Select";
import { Skeleton } from "../components/ui/Skeleton";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Textarea } from "../components/ui/Textarea";

const ARTIST_TYPES = [
  ["SINGER", "Cantante"],
  ["MUSICIAN", "Músico/a"],
  ["DANCER", "Bailarín/a"],
  ["ACTOR", "Actor/Actriz"],
  ["VISUAL_ARTIST", "Artista visual"],
  ["PHOTOGRAPHER", "Fotógrafo/a"],
  ["FILMMAKER", "Realizador/a"],
  ["WRITER", "Escritor/a"],
  ["PRODUCER", "Productor/a"],
  ["DJ", "DJ"],
  ["COMEDIAN", "Comediante"],
  ["PERFORMER", "Performer"],
  ["MODEL", "Modelo"],
  ["MULTIDISCIPLINARY", "Multidisciplinar"],
  ["OTHER", "Otro"]
];

type ArtistDashboardData = {
  profile: ArtistProfile | null;
};

type ProfileForm = {
  stageName: string;
  legalName: string;
  artistType: string;
  shortBio: string;
  biography: string;
  city: string;
  country: string;
  availability: string;
  website: string;
  profileImageUrl: string;
  coverImageUrl: string;
  seoTitle: string;
  seoDescription: string;
};

const emptyForm: ProfileForm = {
  stageName: "",
  legalName: "",
  artistType: "OTHER",
  shortBio: "",
  biography: "",
  city: "",
  country: "Colombia",
  availability: "",
  website: "",
  profileImageUrl: "",
  coverImageUrl: "",
  seoTitle: "",
  seoDescription: ""
};

function profileToForm(profile: ArtistProfile): ProfileForm {
  return {
    stageName: profile.stageName,
    legalName: profile.legalName ?? "",
    artistType: profile.artistType,
    shortBio: profile.shortBio ?? "",
    biography: profile.biography ?? "",
    city: profile.city,
    country: profile.country,
    availability: profile.availability ?? "",
    website: profile.website ?? "",
    profileImageUrl: profile.profileImageUrl ?? "",
    coverImageUrl: profile.coverImageUrl ?? "",
    seoTitle: profile.seoTitle ?? "",
    seoDescription: profile.seoDescription ?? ""
  };
}

function optional(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function ArtistProfileEditorPage() {
  const { data, isLoading, error, refetch } = useApiQuery<ArtistDashboardData>("/artist/dashboard", []);
  const { showToast } = useToast();
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const profile = data?.profile ?? null;

  useEffect(() => {
    if (profile) setForm(profileToForm(profile));
  }, [profile]);

  function updateField(field: keyof ProfileForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setIsSaving(true);

    try {
      await api.patch<ApiResponse<ArtistProfile>>(`/artists/${profile.id}`, {
        stageName: form.stageName,
        legalName: optional(form.legalName),
        artistType: form.artistType,
        shortBio: optional(form.shortBio),
        biography: optional(form.biography),
        city: form.city,
        country: form.country,
        availability: optional(form.availability),
        website: optional(form.website),
        profileImageUrl: optional(form.profileImageUrl),
        coverImageUrl: optional(form.coverImageUrl),
        seoTitle: optional(form.seoTitle),
        seoDescription: optional(form.seoDescription)
      });
      showToast("Perfil artístico actualizado", "success");
      await refetch();
    } catch (requestError) {
      showToast(getApiErrorMessage(requestError, "No se pudo actualizar el perfil"), "error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Perfil artístico"
        description="Actualiza la información pública de tu perfil profesional. El estado, verificación y destacado se gestionan desde rutas protegidas específicas."
        action={profile ? <StatusBadge status={profile.status} /> : null}
      />

      {error ? (
        <ErrorState title="No se pudo cargar tu perfil" description={error} onRetry={refetch} />
      ) : isLoading ? (
        <Skeleton className="h-96" />
      ) : profile ? (
        <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Card className="p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="stageName" className="mb-1.5 block text-sm font-semibold text-brand-ink">
                  Nombre artístico
                </label>
                <Input id="stageName" value={form.stageName} onChange={(event) => updateField("stageName", event.target.value)} required />
              </div>
              <div>
                <label htmlFor="legalName" className="mb-1.5 block text-sm font-semibold text-brand-ink">
                  Nombre real opcional
                </label>
                <Input id="legalName" value={form.legalName} onChange={(event) => updateField("legalName", event.target.value)} />
              </div>
              <div>
                <label htmlFor="artistType" className="mb-1.5 block text-sm font-semibold text-brand-ink">
                  Tipo de artista
                </label>
                <Select id="artistType" value={form.artistType} onChange={(event) => updateField("artistType", event.target.value)}>
                  {ARTIST_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </Select>
              </div>
              <div>
                <label htmlFor="availability" className="mb-1.5 block text-sm font-semibold text-brand-ink">
                  Disponibilidad
                </label>
                <Input id="availability" value={form.availability} onChange={(event) => updateField("availability", event.target.value)} placeholder="Disponible para booking" />
              </div>
              <div>
                <label htmlFor="city" className="mb-1.5 block text-sm font-semibold text-brand-ink">
                  Ciudad
                </label>
                <Input id="city" value={form.city} onChange={(event) => updateField("city", event.target.value)} required />
              </div>
              <div>
                <label htmlFor="country" className="mb-1.5 block text-sm font-semibold text-brand-ink">
                  País
                </label>
                <Input id="country" value={form.country} onChange={(event) => updateField("country", event.target.value)} required />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="shortBio" className="mb-1.5 block text-sm font-semibold text-brand-ink">
                  Resumen corto
                </label>
                <Input id="shortBio" value={form.shortBio} onChange={(event) => updateField("shortBio", event.target.value)} maxLength={320} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="biography" className="mb-1.5 block text-sm font-semibold text-brand-ink">
                  Biografía
                </label>
                <Textarea id="biography" value={form.biography} onChange={(event) => updateField("biography", event.target.value)} rows={6} />
              </div>
            </div>
          </Card>

          <aside className="space-y-5">
            <Card className="p-5">
              <h2 className="text-sm font-black text-brand-ink">Media y enlaces</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="website" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-brand-muted">Sitio web</label>
                  <Input id="website" value={form.website} onChange={(event) => updateField("website", event.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <label htmlFor="profileImageUrl" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-brand-muted">Foto de perfil</label>
                  <Input id="profileImageUrl" value={form.profileImageUrl} onChange={(event) => updateField("profileImageUrl", event.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <label htmlFor="coverImageUrl" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-brand-muted">Portada</label>
                  <Input id="coverImageUrl" value={form.coverImageUrl} onChange={(event) => updateField("coverImageUrl", event.target.value)} placeholder="https://..." />
                </div>
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="text-sm font-black text-brand-ink">SEO básico</h2>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="seoTitle" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-brand-muted">Título SEO</label>
                  <Input id="seoTitle" value={form.seoTitle} onChange={(event) => updateField("seoTitle", event.target.value)} />
                </div>
                <div>
                  <label htmlFor="seoDescription" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-brand-muted">Descripción SEO</label>
                  <Textarea id="seoDescription" value={form.seoDescription} onChange={(event) => updateField("seoDescription", event.target.value)} rows={3} />
                </div>
              </div>
            </Card>
            <Button type="submit" className="w-full" disabled={isSaving} icon={<Save size={16} aria-hidden="true" />}>
              {isSaving ? "Guardando..." : "Guardar perfil"}
            </Button>
          </aside>
        </form>
      ) : (
        <EmptyState title="No tienes perfil artístico" description="Tu cuenta aún no tiene un perfil asociado." />
      )}
    </div>
  );
}

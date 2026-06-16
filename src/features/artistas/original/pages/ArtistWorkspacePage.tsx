import { Save, Info } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { FileUploader } from "../components/ui/FileUploader";
import { Input } from "../components/ui/Input";
import { PageHeader } from "../components/ui/PageHeader";
import { Textarea } from "../components/ui/Textarea";
import { Select } from "../components/ui/Select";

export function ArtistWorkspacePage({ section }: { section: string }) {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title={section}
        description="Gestiona la información de tu perfil artístico. Los cambios se guardan vía API protegida."
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main form */}
        <Card className="p-6">
          <form className="grid gap-5" aria-label={`Formulario de ${section}`}>
            <div>
              <label htmlFor="ws-title" className="mb-1.5 block text-sm font-semibold text-brand-ink">
                Título o nombre
              </label>
              <Input
                id="ws-title"
                placeholder="Nombre artístico, pieza, servicio o publicación"
                aria-describedby="ws-title-hint"
              />
              <p id="ws-title-hint" className="sr-only">Ingresa el nombre o título principal de este elemento.</p>
            </div>
            <div>
              <label htmlFor="ws-description" className="mb-1.5 block text-sm font-semibold text-brand-ink">
                Descripción
              </label>
              <Textarea
                id="ws-description"
                placeholder="Describe propuesta, contexto, condiciones o notas de gestión"
                rows={4}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="ws-city" className="mb-1.5 block text-sm font-semibold text-brand-ink">
                  Ciudad
                </label>
                <Input id="ws-city" placeholder="Bogotá" />
              </div>
              <div>
                <label htmlFor="ws-status" className="mb-1.5 block text-sm font-semibold text-brand-ink">
                  Estado
                </label>
                <Select id="ws-status">
                  <option value="PUBLISHED">Publicado</option>
                  <option value="DRAFT">Borrador</option>
                  <option value="ARCHIVED">Archivado</option>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="button" icon={<Save size={16} aria-hidden="true" />}>
                Guardar cambios
              </Button>
            </div>
          </form>
        </Card>

        {/* Sidebar */}
        <div className="space-y-5">
          <FileUploader
            label="Subir archivo o media"
            hint="Imagen, video, audio o documento. Máx. 15 MB."
          />
          <Card className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-mintLight text-brand-green" aria-hidden="true">
                <Info size={16} />
              </div>
              <div>
                <h3 className="font-black text-brand-ink text-sm">Flujo de trabajo</h3>
                <p className="mt-1.5 text-xs text-brand-muted leading-relaxed">
                  Esta sección conecta CRUD por dominio usando endpoints protegidos con JWT y ownership de artista. Tu perfil es tuyo.
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="font-black text-brand-ink text-sm mb-2">Consejo profesional</h3>
            <p className="text-xs text-brand-muted leading-relaxed">
              "Tu portafolio es la carta de presentación de tu talento. Mantenerlo actualizado aumenta tus oportunidades de conexión y contratación."
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

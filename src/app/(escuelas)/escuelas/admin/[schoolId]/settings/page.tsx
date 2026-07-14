import { notFound } from 'next/navigation'
import { getSchoolById } from '@/features/escuelas/server/school.server'
import { SchoolForm } from '@/features/escuelas/components/admin/SchoolForm'
import { SchoolImagePicker } from '@/features/escuelas/components/admin/SchoolImagePicker'
import { SchoolStatusToggle } from '@/features/escuelas/components/admin/SchoolStatusToggle'

interface Props {
  params: Promise<{ schoolId: string }>
}

export default async function AdminSettingsPage({ params }: Props) {
  const { schoolId } = await params
  const school = await getSchoolById(schoolId)
  if (!school) notFound()

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
          {school.name}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">Configuración</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Imágenes, información general, contacto, redes sociales y textos del formulario de leads.
        </p>
      </div>

      {/* Imágenes */}
      <section className="space-y-4 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Imágenes</h3>
        <SchoolImagePicker
          schoolId={schoolId}
          variant="cover"
          currentCfImageId={school.cover_cf_image_id}
          schoolName={school.name}
        />
        <SchoolImagePicker
          schoolId={schoolId}
          variant="profile"
          currentCfImageId={school.profile_cf_image_id}
          schoolName={school.name}
        />
      </section>

      <SchoolForm school={school} />

      {/* Visibilidad */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-400">Visibilidad</h3>
        <SchoolStatusToggle schoolId={schoolId} isActive={school.is_active} />
        <p className="text-xs text-neutral-400">
          Desactiva la escuela si estás en mantenimiento o antes de publicarla definitivamente.
        </p>
      </section>
    </main>
  )
}

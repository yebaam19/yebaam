import { notFound } from 'next/navigation'
import { getSchoolById } from '@/features/escuelas/server/school.server'
import { getMediaBySchool } from '@/features/escuelas/server/media.server'
import { MediaUploader } from '@/features/escuelas/components/admin/MediaUploader'

interface Props {
  params: Promise<{ schoolId: string }>
}

export default async function AdminEscuelaMediaPage({ params }: Props) {
  const { schoolId } = await params
  const [school, media] = await Promise.all([
    getSchoolById(schoolId),
    getMediaBySchool(schoolId),
  ])
  if (!school) notFound()

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
          {school.name}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">Galería</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Fotos y videos que representan tu escuela en el directorio.
        </p>
      </div>
      <MediaUploader schoolId={schoolId} existing={media} />
    </main>
  )
}

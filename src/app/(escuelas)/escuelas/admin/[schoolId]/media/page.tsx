import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getSchoolById } from '@/features/escuelas/server/school.server'
import { getMediaBySchool } from '@/features/escuelas/server/media.server'
import { MediaUploader } from '@/features/escuelas/components/admin/MediaUploader'

interface Props {
  params: Promise<{ schoolId: string }>
}

export default async function AdminEscuelaMediaPage({ params }: Props) {
  await requireSession()
  const { schoolId } = await params
  const school = await getSchoolById(schoolId)
  if (!school) notFound()

  const media = await getMediaBySchool(schoolId)

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Galería — {school.name}</h1>
      <MediaUploader schoolId={schoolId} existing={media} />
    </main>
  )
}

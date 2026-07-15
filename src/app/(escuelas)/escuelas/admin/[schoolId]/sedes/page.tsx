import { notFound } from 'next/navigation'
import { getSchoolById } from '@/features/escuelas/server/school.server'
import { getCampusesBySchool } from '@/features/escuelas/server/school.server'
import { CampusForm } from '@/features/escuelas/components/admin/CampusForm'

interface Props {
  params: Promise<{ schoolId: string }>
}

export default async function AdminSedesPage({ params }: Props) {
  const { schoolId } = await params
  const [school, campuses] = await Promise.all([
    getSchoolById(schoolId),
    getCampusesBySchool(schoolId),
  ])
  if (!school) notFound()

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
          {school.name}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">Sedes</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Ubica dónde están disponibles tus clases y cursos.
        </p>
      </div>
      <CampusForm schoolId={schoolId} campuses={campuses} />
    </main>
  )
}

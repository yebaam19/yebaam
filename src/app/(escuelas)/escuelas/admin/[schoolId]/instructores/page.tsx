import { notFound } from 'next/navigation'
import { getSchoolById, getInstructorsBySchool } from '@/features/escuelas/server/school.server'
import { InstructorForm } from '@/features/escuelas/components/admin/InstructorForm'

interface Props {
  params: Promise<{ schoolId: string }>
}

export default async function AdminInstructoresPage({ params }: Props) {
  const { schoolId } = await params
  const [school, instructors] = await Promise.all([
    getSchoolById(schoolId),
    getInstructorsBySchool(schoolId),
  ])
  if (!school) notFound()

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
          {school.name}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">Instructores</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Gestiona el equipo de profesores de tu escuela.
        </p>
      </div>
      <InstructorForm schoolId={schoolId} instructors={instructors} />
    </main>
  )
}

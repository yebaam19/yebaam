import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getSchoolById } from '@/features/escuelas/server/school.server'
import { getInstructorsBySchool } from '@/features/escuelas/server/school.server'
import { InstructorForm } from '@/features/escuelas/components/admin/InstructorForm'

interface Props {
  params: Promise<{ schoolId: string }>
}

export default async function AdminInstructoresPage({ params }: Props) {
  await requireSession()
  const { schoolId } = await params
  const school = await getSchoolById(schoolId)
  if (!school) notFound()

  const instructors = await getInstructorsBySchool(schoolId)

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Instructores — {school.name}</h1>
      <InstructorForm schoolId={schoolId} instructors={instructors} />
    </main>
  )
}

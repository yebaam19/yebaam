import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getSchoolById } from '@/features/escuelas/server/school.server'
import { getProgramsBySchool } from '@/features/escuelas/server/program.server'
import { getDisciplines } from '@/features/escuelas/server/school.server'
import { ProgramForm } from '@/features/escuelas/components/admin/ProgramForm'

interface Props {
  params: Promise<{ schoolId: string }>
}

export default async function AdminProgramasPage({ params }: Props) {
  await requireSession()
  const { schoolId } = await params
  const [school, programs, disciplines] = await Promise.all([
    getSchoolById(schoolId),
    getProgramsBySchool(schoolId),
    getDisciplines(),
  ])
  if (!school) notFound()

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Programas — {school.name}</h1>
      <ProgramForm schoolId={schoolId} programs={programs} disciplines={disciplines} />
    </main>
  )
}

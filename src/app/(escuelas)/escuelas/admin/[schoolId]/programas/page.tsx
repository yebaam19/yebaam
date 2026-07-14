import { notFound } from 'next/navigation'
import { getSchoolById, getDisciplines } from '@/features/escuelas/server/school.server'
import { getProgramsBySchool } from '@/features/escuelas/server/program.server'
import { ProgramForm } from '@/features/escuelas/components/admin/ProgramForm'

interface Props {
  params: Promise<{ schoolId: string }>
}

export default async function AdminProgramasPage({ params }: Props) {
  const { schoolId } = await params
  const [school, programs, disciplines] = await Promise.all([
    getSchoolById(schoolId),
    getProgramsBySchool(schoolId),
    getDisciplines(),
  ])
  if (!school) notFound()

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
          {school.name}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">Programas</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Cursos, talleres y clases disponibles en tu escuela.
        </p>
      </div>
      <ProgramForm schoolId={schoolId} programs={programs} disciplines={disciplines} />
    </main>
  )
}

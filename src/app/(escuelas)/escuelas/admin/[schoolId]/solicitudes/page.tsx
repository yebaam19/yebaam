import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getSchoolById } from '@/features/escuelas/server/school.server'
import { getTrialRequestsBySchool } from '@/features/escuelas/server/trial.server'
import { TrialRequestsTable } from '@/features/escuelas/components/admin/TrialRequestsTable'

interface Props {
  params: Promise<{ schoolId: string }>
}

export default async function AdminSolicitudesPage({ params }: Props) {
  await requireSession()
  const { schoolId } = await params
  const school = await getSchoolById(schoolId)
  if (!school) notFound()

  const trials = await getTrialRequestsBySchool(schoolId)

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Solicitudes de Clase — {school.name}</h1>
      <TrialRequestsTable schoolId={schoolId} trials={trials} />
    </main>
  )
}

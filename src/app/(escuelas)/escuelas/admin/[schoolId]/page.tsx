import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getSchoolById } from '@/features/escuelas/server/school.server'
import { DashboardStats } from '@/features/escuelas/components/admin/DashboardStats'

interface Props {
  params: Promise<{ schoolId: string }>
}

export default async function EscuelaAdminDashboardPage({ params }: Props) {
  await requireSession()
  const { schoolId } = await params
  const school = await getSchoolById(schoolId)
  if (!school) notFound()

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Dashboard — {school.name}</h1>
      <DashboardStats schoolId={schoolId} />
    </main>
  )
}

import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getSchoolById } from '@/features/escuelas/server/school.server'
import { getCampusesBySchool } from '@/features/escuelas/server/school.server'
import { CampusForm } from '@/features/escuelas/components/admin/CampusForm'

interface Props {
  params: Promise<{ schoolId: string }>
}

export default async function AdminSedesPage({ params }: Props) {
  await requireSession()
  const { schoolId } = await params
  const school = await getSchoolById(schoolId)
  if (!school) notFound()

  const campuses = await getCampusesBySchool(schoolId)

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Sedes — {school.name}</h1>
      <CampusForm schoolId={schoolId} campuses={campuses} />
    </main>
  )
}

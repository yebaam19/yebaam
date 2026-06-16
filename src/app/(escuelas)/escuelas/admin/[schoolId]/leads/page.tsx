import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getSchoolById } from '@/features/escuelas/server/school.server'
import { getLeadsBySchool } from '@/features/escuelas/server/lead.server'
import { LeadsTable } from '@/features/escuelas/components/admin/LeadsTable'

interface Props {
  params: Promise<{ schoolId: string }>
}

export default async function AdminLeadsPage({ params }: Props) {
  await requireSession()
  const { schoolId } = await params
  const school = await getSchoolById(schoolId)
  if (!school) notFound()

  const leads = await getLeadsBySchool(schoolId)

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Leads — {school.name}</h1>
      <LeadsTable schoolId={schoolId} leads={leads} />
    </main>
  )
}

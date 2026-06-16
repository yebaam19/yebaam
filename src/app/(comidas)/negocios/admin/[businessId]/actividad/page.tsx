import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getBusinessById } from '@/features/comidas/server/business.server'
import { getActivityLogs } from '@/features/comidas/server/business.server'

interface Props {
  params: Promise<{ businessId: string }>
}

export default async function AdminActividadPage({ params }: Props) {
  await requireSession()
  const { businessId } = await params
  const business = await getBusinessById(businessId)
  if (!business) notFound()

  const logs = await getActivityLogs(businessId)

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Actividad — {business.name}</h1>
      <ul className="space-y-2">
        {logs.map((log) => (
          <li key={log.id} className="text-sm text-muted-foreground border-b pb-2">
            <span className="font-medium">{log.action}</span> — {new Date(log.created_at).toLocaleString('es')}
          </li>
        ))}
      </ul>
    </main>
  )
}

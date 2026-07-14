import { notFound } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { getSchoolById } from '@/features/escuelas/server/school.server'
import { getLeadsBySchool } from '@/features/escuelas/server/lead.server'
import { LeadsTable } from '@/features/escuelas/components/admin/LeadsTable'

interface Props {
  params: Promise<{ schoolId: string }>
}

export default async function AdminLeadsPage({ params }: Props) {
  const { schoolId } = await params
  const school = await getSchoolById(schoolId)
  if (!school) notFound()

  let leads: Awaited<ReturnType<typeof getLeadsBySchool>> = []
  let fetchError: string | null = null
  try {
    leads = await getLeadsBySchool(schoolId)
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Error desconocido'
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
          {school.name}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-neutral-900">Leads</h1>
        <p className="mt-0.5 text-sm text-neutral-500">
          Personas que han solicitado información sobre tu escuela.
        </p>
      </div>
      {fetchError ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">No se pudieron cargar los leads</p>
            <p className="mt-0.5 text-red-600">{fetchError}</p>
            <p className="mt-2 text-xs text-red-500">
              Si ves &quot;school_admin_required&quot;, aplica la migración{' '}
              <code className="font-mono">20260712000000_escuelas_backfill_school_admins.sql</code>{' '}
              en el SQL Editor de Supabase.
            </p>
          </div>
        </div>
      ) : (
        <LeadsTable schoolId={schoolId} leads={leads} />
      )}
    </main>
  )
}

import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getBusinessById, getActivityLogs } from '@/features/comidas/server/business.server'
import { PageHeader } from '@/features/comidas/components/admin/shared/PageHeader'

interface Props {
  params: Promise<{ businessId: string }>
}

const ACTION_LABELS: Record<string, string> = {
  created:           'Negocio creado',
  updated:           'Perfil actualizado',
  product_created:   'Producto añadido',
  product_updated:   'Producto editado',
  product_deleted:   'Producto desactivado',
  promotion_created: 'Promoción creada',
  promotion_archived:'Promoción archivada',
  media_uploaded:    'Imagen/video subido',
  media_deleted:     'Media eliminada',
  post_created:      'Publicación creada',
  admin_added:       'Administrador añadido',
  admin_removed:     'Administrador eliminado',
  status_changed:    'Estado del negocio cambiado',
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

export default async function AdminActividadPage({ params }: Props) {
  await requireSession()
  const { businessId } = await params

  const [business, logs] = await Promise.all([
    getBusinessById(businessId),
    getActivityLogs(businessId),
  ])
  if (!business) notFound()

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Actividad"
        subtitle={`Historial de cambios recientes en ${business.name}`}
      />

      {logs.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 py-16 text-center">
          <p className="text-4xl" aria-hidden="true">📋</p>
          <h2 className="mt-4 text-base font-semibold text-neutral-900">Sin actividad registrada</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Los cambios en el negocio, productos y publicaciones aparecen aquí.
          </p>
        </div>
      ) : (
        <ol className="relative border-l border-neutral-200" aria-label="Historial de actividad">
          {logs.map((log) => (
            <li key={log.id} className="mb-6 ml-6">
              <span
                className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary-100 ring-4 ring-white"
                aria-hidden="true"
              />
              <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-sm font-medium text-neutral-900">
                  {ACTION_LABELS[log.action] ?? log.action}
                </p>
                {log.details && (
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)}
                  </p>
                )}
                <time
                  dateTime={log.created_at}
                  className="mt-1 block text-xs text-neutral-400"
                >
                  {formatDate(log.created_at)}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </main>
  )
}

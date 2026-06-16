import Link from 'next/link'
import { Lock } from 'lucide-react'

interface Props {
  businessId: string
  section?: string
}

export function PermissionDenied({ businessId, section }: Props) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
          <Lock size={22} className="text-neutral-400" aria-hidden />
        </div>
        <h1 className="text-lg font-semibold text-neutral-900">
          Acceso restringido
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {section
            ? `No tienes permisos para gestionar ${section} de este negocio.`
            : 'No tienes permisos para acceder a esta sección.'}
        </p>
        <Link
          href={`/negocios/admin/${businessId}`}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-neutral-100 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-200"
        >
          Volver al dashboard
        </Link>
      </div>
    </main>
  )
}

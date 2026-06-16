import type { Metadata } from 'next'
import Link from 'next/link'
import { requireSession } from '@/lib/auth'
import { getMyBusinesses } from '@/features/comidas/server/business.server'
import { MisNegociosCard } from '@/features/comidas/components/admin/MisNegociosCard'

export const metadata: Metadata = {
  title: 'Mis Negocios — Yebaam',
}

export default async function MisNegociosPage() {
  const { userId } = await requireSession()
  const myBusinesses = await getMyBusinesses(userId)

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Mis Negocios</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Negocios que administras en Yebaam
          </p>
        </div>
        <Link
          href="/negocios/crear"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-800"
        >
          + Registrar negocio
        </Link>
      </div>

      {myBusinesses.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-neutral-200 py-16 text-center">
          <p className="mb-4 text-4xl">🏪</p>
          <h2 className="mb-2 text-base font-semibold text-neutral-900">
            No tienes ningún negocio registrado
          </h2>
          <p className="mx-auto mb-6 max-w-xs text-sm text-neutral-500">
            Crea el perfil de tu negocio y empieza a conectar con tus clientes en Yebaam.
          </p>
          <Link
            href="/negocios/crear"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800"
          >
            Registrar mi negocio
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {myBusinesses.map((item) => (
            <li key={item.business.id}>
              <MisNegociosCard {...item} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

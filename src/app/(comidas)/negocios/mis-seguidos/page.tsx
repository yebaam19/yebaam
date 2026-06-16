import type { Metadata } from 'next'
import Link from 'next/link'
import { requireSession } from '@/lib/auth'
import { getFollowedBusinesses } from '@/features/comidas/server/engagement.server'
import { BusinessCard } from '@/features/comidas/components/public/BusinessCard'

export const metadata: Metadata = {
  title: 'Negocios que sigues | Yebaam',
  description: 'Los negocios que estás siguiendo en Yebaam.',
}

export default async function MisSeguidosPage() {
  const { userId } = await requireSession()
  const businesses = await getFollowedBusinesses(userId)

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <section
        className="relative overflow-hidden px-4 py-12"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgb(22,164,76,0.18) 0%, transparent 70%), rgb(240,252,245)',
        }}
      >
        <div className="mx-auto max-w-4xl">
          <Link
            href="/negocios"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-primary-700 hover:underline"
          >
            ← Todos los negocios
          </Link>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-neutral-900 sm:text-4xl">
            Negocios que sigues
          </h1>
          <p className="mt-2 text-base text-neutral-500">
            {businesses.length > 0
              ? `Siguiendo ${businesses.length} negocio${businesses.length !== 1 ? 's' : ''}`
              : 'Aún no sigues ningún negocio'}
          </p>
        </div>
      </section>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        {businesses.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <span className="text-5xl">🍽️</span>
            <p className="text-lg font-semibold text-neutral-700">
              Todavía no sigues ningún negocio
            </p>
            <p className="max-w-sm text-sm text-neutral-500">
              Ve a cualquier perfil de negocio y presiona{' '}
              <span className="font-semibold text-primary-700">Seguir</span> para recibirnovedades.
            </p>
            <Link
              href="/negocios"
              className="mt-2 rounded-full bg-primary-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-800"
            >
              Explorar negocios
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((b) => (
              <BusinessCard key={b.id} business={b} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

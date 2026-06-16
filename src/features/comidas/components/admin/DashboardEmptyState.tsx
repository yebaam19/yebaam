'use client'

import { Megaphone, Users, TrendingUp } from 'lucide-react'
import { CreateBusinessPostButton } from './CreateBusinessPostButton'

interface Props {
  businessId: string
  businessName: string
  businessSlug: string
  followersCount: number
}

export function DashboardEmptyState({ businessId, businessName, businessSlug, followersCount }: Props) {
  return (
    <div className="rounded-3xl border border-dashed border-primary-200 bg-gradient-to-br from-primary-50 via-white to-secondary-50/30 p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100">
        <Megaphone size={26} className="text-primary-700" aria-hidden="true" />
      </div>

      <h2 className="text-xl font-bold text-neutral-950">
        {businessName} aún no ha publicado nada
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-neutral-600">
        Comparte promociones, novedades y contenido para aparecer en el feed de tus seguidores.
        Cada publicación llega directamente a quienes siguen tu negocio.
      </p>

      <div className="mt-6">
        <CreateBusinessPostButton businessId={businessId} businessName={businessName} businessSlug={businessSlug} />
      </div>

      {followersCount > 0 && (
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-primary-700 shadow-sm ring-1 ring-primary-100">
          <Users size={14} aria-hidden="true" />
          <span>
            {followersCount} seguidor{followersCount !== 1 ? 'es' : ''} esperando tus novedades
          </span>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { icon: Megaphone, title: 'Publica una novedad', desc: 'Promociones, menú del día, eventos especiales.' },
          { icon: Users,     title: 'Llega a tus seguidores', desc: 'Tu publicación aparece en su feed automáticamente.' },
          { icon: TrendingUp, title: 'Mide el impacto', desc: 'Ve reacciones y comentarios en tiempo real.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border border-neutral-100 bg-white p-4 text-left shadow-sm">
            <Icon size={18} className="mb-2 text-primary-600" aria-hidden="true" />
            <p className="text-sm font-semibold text-neutral-900">{title}</p>
            <p className="mt-1 text-xs leading-5 text-neutral-500">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

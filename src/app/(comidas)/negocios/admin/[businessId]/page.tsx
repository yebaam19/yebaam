import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import { getBusinessById } from '@/features/comidas/server/business.server'
import { fetchBusinessStats } from '@/features/comidas/server/stats.server'
import { DashboardStats } from '@/features/comidas/components/admin/DashboardStats'
import { DashboardEmptyState } from '@/features/comidas/components/admin/DashboardEmptyState'
import { CreateBusinessPostButton } from '@/features/comidas/components/admin/CreateBusinessPostButton'
import { ShoppingBag, Tag, Image, BarChart2, Settings, Users } from 'lucide-react'

interface Props {
  params: Promise<{ businessId: string }>
}

export default async function AdminDashboardPage({ params }: Props) {
  await requireSession()
  const { businessId } = await params

  const [business, stats] = await Promise.all([
    getBusinessById(businessId),
    fetchBusinessStats(businessId),
  ])
  if (!business) notFound()

  const quickLinks = [
    { label: 'Productos',       href: `/negocios/admin/${businessId}/productos`,       icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
    { label: 'Promociones',     href: `/negocios/admin/${businessId}/promociones`,     icon: Tag,         color: 'bg-amber-50 text-amber-600' },
    { label: 'Galería',         href: `/negocios/admin/${businessId}/media`,           icon: Image,       color: 'bg-purple-50 text-purple-600' },
    { label: 'Analytics',       href: `/negocios/admin/${businessId}/analytics`,       icon: BarChart2,   color: 'bg-green-50 text-green-600' },
    { label: 'Administradores', href: `/negocios/admin/${businessId}/administradores`, icon: Users,       color: 'bg-rose-50 text-rose-600' },
    { label: 'Configuración',   href: `/negocios/admin/${businessId}/settings`,        icon: Settings,    color: 'bg-neutral-100 text-neutral-600' },
  ]

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">{business.name}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Panel de administración
            {!business.is_active && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                Desactivado
              </span>
            )}
          </p>
        </div>
        <CreateBusinessPostButton
          businessId={businessId}
          businessName={business.name}
          businessSlug={business.slug}
        />
      </div>

      {/* Metrics */}
      <DashboardStats businessId={businessId} />

      {/* Empty state */}
      {stats.posts === 0 && (
        <DashboardEmptyState
          businessId={businessId}
          businessName={business.name}
          businessSlug={business.slug}
          followersCount={stats.follows}
        />
      )}

      {/* Quick access grid */}
      <section aria-labelledby="quick-heading">
        <h2
          id="quick-heading"
          className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-500"
        >
          Acceso rápido
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {quickLinks.map(({ label, href, icon: Icon, color }) => (
            <Link
              key={label}
              href={href as never}
              className="group flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon size={17} aria-hidden="true" />
              </span>
              <span className="text-sm font-medium text-neutral-800 group-hover:text-neutral-900">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}

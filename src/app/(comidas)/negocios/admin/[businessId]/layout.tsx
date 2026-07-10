import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { requireSession } from '@/lib/auth'
import {
  getBusinessById,
  isUserBusinessAdmin,
  getMyBusinesses,
} from '@/features/comidas/server/business.server'
import { AdminBusinessNav } from '@/features/comidas/components/admin/AdminBusinessNav'
import { BusinessSwitcher } from '@/features/comidas/components/admin/BusinessSwitcher'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { CreatePostModal } from '@/features/post'

interface Props {
  children: React.ReactNode
  params: Promise<{ businessId: string }>
}

export default async function AdminBusinessLayout({ children, params }: Props) {
  const { businessId } = await params
  await requireSession()

  const [business, isAdmin, myBusinesses] = await Promise.all([
    getBusinessById(businessId),
    isUserBusinessAdmin(businessId),
    getMyBusinesses(),
  ])

  if (!business) notFound()
  if (!isAdmin) redirect(`/negocios/${business.slug}` as never)

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Row 1: back + business switcher + public link */}
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/feed"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-1.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-200"
              >
                <ArrowLeft size={14} aria-hidden="true" />
                Yebaam
              </Link>
              <span className="text-neutral-300" aria-hidden>/</span>
              <BusinessSwitcher
                currentBusinessId={businessId}
                businesses={myBusinesses}
              />
            </div>

            <Link
              href={`/negocios/${business.slug}` as never}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50"
            >
              Ver perfil
              <ExternalLink size={13} aria-hidden="true" />
            </Link>
          </div>

          {/* Row 2: section nav */}
          <div className="pb-2">
            <AdminBusinessNav businessId={businessId} />
          </div>
        </div>
      </header>

      {/* Page content */}
      {children}

      {/* CreateBusinessPostButton / BusinessSocialFeed's empty-state CTA both call
          usePostStore().openCreateModal() — but that only flips shared Zustand
          state. Without this mounted somewhere in the admin tree, nothing was
          ever rendering in response: clicking "Nueva publicación" did nothing
          visible, with zero console output, because there was no modal to open. */}
      <CreatePostModal />
    </div>
  )
}

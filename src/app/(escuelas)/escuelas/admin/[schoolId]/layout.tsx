import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { requireSession } from '@/lib/auth'
import { getSchoolById } from '@/features/escuelas/server/school.server'
import { getServerClient } from '@/utils/supabase/server'
import { cfImageUrl } from '@/lib/cloudflare'
import { AdminSchoolNav } from '@/features/escuelas/components/admin/AdminSchoolNav'

interface Props {
  children: React.ReactNode
  params: Promise<{ schoolId: string }>
}

async function isSchoolAdmin(schoolId: string, createdBy: string | null): Promise<boolean> {
  const client = await getServerClient()
  const [{ data: { user } }, rpcResult] = await Promise.all([
    client.auth.getUser(),
    client.rpc('check_school_admin', { p_school_id: schoolId }),
  ])
  if (rpcResult.data) return true
  return !!user && user.id === createdBy
}

export default async function AdminEscuelaLayout({ children, params }: Props) {
  const { schoolId } = await params

  await requireSession()

  const school = await getSchoolById(schoolId).catch(() => null)
  if (!school) notFound()

  const admin = await isSchoolAdmin(schoolId, school.created_by ?? null)
  if (!admin) redirect(`/escuelas/${school.slug}`)

  const logoUrl = cfImageUrl(school.profile_cf_image_id, 'thumbnail')

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Top bar */}
          <div className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/feed"
                className="shrink-0 text-sm font-semibold text-neutral-400 transition hover:text-neutral-700"
              >
                ← Yebaam
              </Link>
              <span className="text-neutral-200 select-none" aria-hidden>/</span>
              <div className="flex items-center gap-2.5 min-w-0">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt=""
                    width={24}
                    height={24}
                    className="h-6 w-6 shrink-0 rounded-lg object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary-700 text-[10px] font-bold text-white">
                    {school.name[0]?.toUpperCase()}
                  </span>
                )}
                <span className="truncate text-sm font-bold text-neutral-900">{school.name}</span>
              </div>
            </div>
            <Link
              href={`/escuelas/${school.slug}` as never}
              className="shrink-0 text-xs font-semibold text-neutral-400 transition hover:text-neutral-700"
            >
              Ver perfil →
            </Link>
          </div>

          {/* Section nav */}
          <div className="pb-2">
            <AdminSchoolNav schoolId={schoolId} />
          </div>
        </div>
      </header>

      {children}
    </div>
  )
}

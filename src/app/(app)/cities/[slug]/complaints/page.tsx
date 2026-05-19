import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getCityBySlug } from '@/features/cities/server/city.server'
import { getVisibleComplaints } from '@/features/cities/server/complaints.server'
import { ComplaintsList } from '@/features/cities/components/complaints/ComplaintsList'
import { ComplaintForm } from '@/features/cities/components/complaints/ComplaintForm'
import { getServerClient } from '@/utils/supabase/server'

interface Props {
  params: Promise<{ slug: string }>
}

export const metadata = { title: 'Portal de Denuncias' }

export default async function CityComplaintsPage({ params }: Props) {
  const { slug } = await params
  const city = await getCityBySlug(slug)
  if (!city) notFound()

  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  const isSignedIn = Boolean(auth?.user)

  const [t, complaints] = await Promise.all([
    getTranslations('cities.complaints'),
    getVisibleComplaints(city.id, { limit: 60 }),
  ])

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-100">
            {t('title')}
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('subtitle', { city: city.name })}
          </p>
        </header>
        <ComplaintsList complaints={complaints} />
      </section>
      <aside>
        {isSignedIn ? (
          <ComplaintForm cityId={city.id} />
        ) : (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-white p-6 text-center text-sm text-neutral-500 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            {t('signInToReport')}
          </div>
        )}
      </aside>
    </div>
  )
}

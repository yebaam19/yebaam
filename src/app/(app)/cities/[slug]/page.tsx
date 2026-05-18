import { Suspense } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { CityPortalCover } from '@/features/cities/components/portal/CityPortalCover'
import { CityPortalGrid } from '@/features/cities/components/portal/CityPortalGrid'
import { CityPortalGridSkeleton } from '@/features/cities/components/portal/CityPortalGridSkeleton'
import { CityPortalSidebar } from '@/features/cities/components/portal/CityPortalSidebar'
import { CityPortalSidebarSkeleton } from '@/features/cities/components/portal/CityPortalSidebarSkeleton'
import { DiscoveryGrid } from '@/features/cities/components/portal/DiscoveryGrid'
import {
  fetchIsFollowing,
  getCityBySlug,
  getCityPortalData,
} from '@/features/cities/server/city.server'
import { getServerClient } from '@/utils/supabase/server'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const city = await getCityBySlug(slug)
  const t = await getTranslations('cities')

  const cityName = city?.name ?? slug

  return {
    title: t('metadata.detailTitle', { city: cityName }),
    description: t('metadata.detailDescription', { city: cityName }),
    openGraph: {
      title: t('metadata.detailOgTitle', { city: cityName }),
      description: t('metadata.detailOgDescription', { city: cityName }),
      type: 'website',
    },
  }
}

/**
 * Portal de la Ciudad — `/cities/[slug]`.
 *
 * Layout mirrors `docs/cities-reference/city.png`:
 *  - Full-width cover up top (eager, no Suspense)
 *  - 2-column body: "Explora <city>" discovery grid (col-span-2) + right
 *    rail with facts + trending (col-span-1, Suspense-streamed)
 *  - The full 27-tile `<CityPortalGrid>` lives below the discovery grid so
 *    every existing per-section route stays one click away. A future
 *    `/cities/[slug]/categories` overflow page can replace it.
 *
 * The only client component on this page is `<FollowCityButton>` (inside the
 * cover) — that is what keeps the Lighthouse Performance budget healthy.
 */
export default async function CityPortalPage({ params }: Props) {
  const { slug } = await params
  const city = await getCityBySlug(slug)
  if (!city) notFound()

  const client = await getServerClient()
  const { data: auth } = await client.auth.getUser()
  const isFollowing = await fetchIsFollowing(client, city.id, auth.user?.id ?? null)

  const t = await getTranslations('cities.portal')

  return (
    <div className="space-y-6">
      <CityPortalCover city={city} isFollowing={isFollowing} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <header className="flex items-baseline justify-between gap-3">
            <h2 className="text-xl font-bold text-neutral-900 sm:text-2xl dark:text-neutral-100">
              {t('discoverHeading', { city: city.name })}
            </h2>
          </header>

          <DiscoveryGrid citySlug={slug} />

          <div className="pt-2 text-right">
            <Link
              href={`/cities/${slug}` as `/${string}`}
              aria-disabled="true"
              className="text-sm font-medium text-primary-700 hover:underline dark:text-primary-400"
            >
              {t('viewAllCategories')}
            </Link>
          </div>
        </section>

        <Suspense fallback={<CityPortalSidebarSkeleton />} key={`sidebar-${city.id}`}>
          <CityPortalSidebar city={city} />
        </Suspense>
      </div>

      <Suspense fallback={<CityPortalGridSkeleton />} key={city.id}>
        <PortalGridAsync cityId={city.id} citySlug={slug} />
      </Suspense>
    </div>
  )
}

async function PortalGridAsync({
  cityId,
  citySlug,
}: {
  cityId: string
  citySlug: string
}) {
  const portalData = await getCityPortalData(cityId)
  return <CityPortalGrid citySlug={citySlug} portalData={portalData} />
}

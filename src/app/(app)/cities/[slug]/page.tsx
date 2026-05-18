import { Suspense } from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { CityPortalCover } from '@/features/cities/components/portal/CityPortalCover'
import { CityPortalGrid } from '@/features/cities/components/portal/CityPortalGrid'
import { CityPortalGridSkeleton } from '@/features/cities/components/portal/CityPortalGridSkeleton'
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
 * Pure RSC. The cover (city name, location chip, Seguir button) paints
 * eagerly so the page never looks blank; the 27-tile grid is wrapped in a
 * Suspense boundary keyed on the city id and streams in as soon as the
 * 10 parallel counts in `getCityPortalData` resolve.
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

  return (
    <div className="space-y-6">
      <CityPortalCover city={city} isFollowing={isFollowing} />
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

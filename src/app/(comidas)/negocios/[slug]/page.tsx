import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getBusinessBySlug, isUserBusinessAdmin } from '@/features/comidas/server/business.server'
import {
  getBusinessEngagement,
  getBusinessCommunityPreviews,
} from '@/features/comidas/server/engagement.server'
import { getAuthUser } from '@/features/auth/actions/auth.actions'
import { BusinessDetail } from '@/features/comidas/components/public/BusinessDetail'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const business = await getBusinessBySlug(slug)
  if (!business) return {}
  return {
    title: `${business.name} | Yebaam Negocios`,
    description: business.description ?? undefined,
  }
}

export default async function BusinessPage({ params }: Props) {
  const { slug } = await params

  const [business, user] = await Promise.all([
    getBusinessBySlug(slug),
    getAuthUser().catch(() => null),
  ])

  if (!business) notFound()

  const [engagement, communityPreviews, isAdmin] = await Promise.all([
    user
      ? getBusinessEngagement(business.id, user.id).catch(() => null)
      : Promise.resolve(null),
    getBusinessCommunityPreviews(business.id),
    user ? isUserBusinessAdmin(business.id, user.id).catch(() => false) : Promise.resolve(false),
  ])

  return (
    <BusinessDetail
      business={business}
      isAdmin={isAdmin}
      communityPreviews={communityPreviews}
      engagement={
        engagement
          ? {
              isAuthenticated: true,
              isFollowing: engagement.is_followed,
              isLiked: engagement.is_liked,
              isCustomer: engagement.is_customer,
              followersCount: engagement.followers_count,
              likesCount: engagement.likes_count,
              customersCount: engagement.customers_count,
            }
          : { isAuthenticated: false }
      }
    />
  )
}

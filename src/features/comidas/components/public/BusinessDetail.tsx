'use client'

import { useState } from 'react'
import { useOptionalCurrentUser } from '@/features/auth/context/current-user.context'
import type { BusinessDetail as TBusinessDetail, CommunityUserPreview } from '../../types'
import { BusinessHero, BusinessMobileBar, type EngagementProps } from './detail/BusinessHero'
import { BusinessTabNav, type BusinessTab } from './detail/BusinessTabNav'
import { BusinessMenuTab } from './detail/BusinessMenuTab'
import { BusinessPromosTab } from './detail/BusinessPromosTab'
import { BusinessGallery } from './detail/BusinessGallery'
import { BusinessInfoTab, BusinessReviewsTab } from './detail/BusinessInfoTab'
import { BusinessCommunitySection } from './detail/BusinessCommunitySection'
import { BusinessPostsTab } from './detail/BusinessPostsTab'

interface Props {
  business: TBusinessDetail
  engagement?: EngagementProps
  isAdmin?: boolean
  communityPreviews?: {
    customers: CommunityUserPreview[]
    followers: CommunityUserPreview[]
  }
}

export function BusinessDetail({ business, engagement, isAdmin, communityPreviews }: Props) {
  const [activeTab, setActiveTab] = useState<BusinessTab>('menu')
  const [socialCount, setSocialCount] = useState(0)
  const currentUser = useOptionalCurrentUser()

  const menus = business.menus ?? []
  const promotions = business.promotions ?? []
  const assets = business.media_assets ?? []
  const reviews = business.reviews ?? []
  const posts = business.posts ?? []

  const counts: Partial<Record<BusinessTab, number>> = {
    menu: menus.flatMap((m) => m.categories ?? []).flatMap((c) => c.products ?? []).length,
    promociones: promotions.filter((p) => p.status === 'ACTIVE' || !p.status).length,
    fotos: assets.filter((a) => a.cf_image_id || a.cf_video_uid).length,
    'reseñas': reviews.filter((r) => r.is_visible !== false).length,
    novedades: (posts.filter((p) => p.status === 'PUBLISHED').length + socialCount) || undefined,
  }

  return (
    <>
      <div className="min-h-screen bg-linear-to-br from-primary-50 via-white to-secondary-50/30 pb-24 sm:pb-8">
        <BusinessHero business={business} engagement={engagement} isAdmin={isAdmin} />
        <BusinessTabNav active={activeTab} onChange={setActiveTab} counts={counts} />

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {activeTab === 'menu' && (
            <BusinessMenuTab menus={menus} businessName={business.name} />
          )}
          {activeTab === 'promociones' && (
            <BusinessPromosTab promotions={promotions} businessName={business.name} />
          )}
          {activeTab === 'fotos' && (
            <BusinessGallery assets={assets} />
          )}
          {activeTab === 'reseñas' && (
            <BusinessReviewsTab
              reviews={reviews}
              avgRating={business.avg_rating}
              reviewCount={business.review_count}
              isAuthenticated={!!currentUser}
              businessId={business.id}
            />
          )}
          {activeTab === 'comunidad' && (
            <BusinessCommunitySection
              businessName={business.name}
              customersCount={engagement?.customersCount ?? 0}
              followersCount={engagement?.followersCount ?? 0}
              customers={communityPreviews?.customers ?? []}
              followers={communityPreviews?.followers ?? []}
            />
          )}
          {activeTab === 'novedades' && (
            <BusinessPostsTab posts={posts} businessName={business.name} businessId={business.id} onSocialCountLoaded={setSocialCount} />
          )}
          {activeTab === 'detalles' && (
            <BusinessInfoTab business={business} />
          )}
        </div>
      </div>

      <BusinessMobileBar
        business={business}
        isAdmin={isAdmin}
        isAuthenticated={engagement?.isAuthenticated}
        isFollowing={engagement?.isFollowing}
      />
    </>
  )
}

export type NewsScope = 'local' | 'regional' | 'national' | 'international'

export interface NewsSection {
  id: string
  slug: string
  name: string
}

export interface NewsSource {
  id: string
  name: string
  websiteUrl: string | null
}

export interface NewsArticle {
  id: string
  slug: string
  title: string
  excerpt: string
  content?: string
  coverCfImageId: string | null
  videoStreamUid: string | null
  scope: NewsScope
  isFeatured: boolean
  isSponsored: boolean
  aiDisclosure: boolean
  publishedAt: string
  section: NewsSection
  source: NewsSource
  author: { id: string; name: string; username: string | null; avatarUrl: string | null }
  reactionCount: number
  commentCount: number
  viewerLiked?: boolean
  viewerSaved?: boolean
}

export interface NewsComment {
  id: string
  content: string
  createdAt: string
  author: { id: string; name: string; avatarUrl: string | null }
}

export interface NewsModuleSettings {
  newsEnabled: boolean
  videosEnabled: boolean
  weatherEnabled: boolean
  trendsEnabled: boolean
  adsEnabled: boolean
}

export interface NewsAd {
  id: string
  advertiserName: string
  headline: string
  destinationUrl: string
  imageCfImageId: string | null
}

export interface NewsReplica {
  id: string
  entityType: 'professional_profile' | 'page' | 'organization'
  entityId: string
  name: string
  href: string | null
}

export interface NewsReplicaEntity {
  id: string
  type: NewsReplica['entityType']
  name: string
}

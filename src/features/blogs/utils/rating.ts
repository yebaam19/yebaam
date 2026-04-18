import type { BlogStats } from '../types/blog.types'

export interface BlogRatingInput {
  stats: BlogStats
  photosCount?: number
  videosCount?: number
}

export function computeBlogStars({ stats, photosCount = 0, videosCount = 0 }: BlogRatingInput): 0 | 1 | 2 | 3 | 4 | 5 {
  const followers = stats.followersCount ?? 0
  const likes = stats.totalLikes ?? 0

  if (followers >= 50000 && likes >= 25000) return 5
  if (followers >= 25000 && likes >= 12000) return 4
  if (followers >= 10000 && likes >= 5000) return 3
  if (followers >= 5000 && likes >= 2500 && videosCount >= 20 && photosCount >= 50) return 2
  if (followers >= 2500 && likes >= 1000 && videosCount >= 10 && photosCount >= 20) return 1
  return 0
}

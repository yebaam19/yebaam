'use client'

import { BlogCoverBar } from '@/features/blogs/components/detail/BlogCoverBar'
import type { Blog } from '@/features/blogs/types/blog.types'

interface BlogDetailHeroProps {
  blog: Blog
  stars: 0 | 1 | 2 | 3 | 4 | 5
  onFollowToggle: () => void
  isFollowLoading: boolean
}

/** Cover banner with follow/rating actions — the top "hero" of the blog detail. */
export function BlogDetailHero({ blog, stars, onFollowToggle, isFollowLoading }: BlogDetailHeroProps) {
  return (
    <BlogCoverBar
      blog={blog}
      stars={stars}
      onFollowToggle={onFollowToggle}
      isFollowLoading={isFollowLoading}
    />
  )
}

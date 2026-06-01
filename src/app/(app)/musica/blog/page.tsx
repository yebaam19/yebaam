import { BlogsPageContainer } from '@/features/blogs/components/BlogsPageContainer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog del Músico | Música',
  description:
    'Descubre y sigue los blogs de artistas y músicos. Biografías, fotos, videos, su música y artículos en un solo lugar.',
}

/** Blog tab inside the music shell. Reuses the generic blogs feature
 *  (unfiltered) but keeps navigation under /musica via basePath. */
export default function MusicaBlogPage() {
  return <BlogsPageContainer basePath="/musica/blog" />
}

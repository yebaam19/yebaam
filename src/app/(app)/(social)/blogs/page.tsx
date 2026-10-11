import { BlogsPageContainer } from '@/features/blogs/components/BlogsPageContainer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blogs | Comparte tu Conocimiento',
  description:
    'Descubre y sigue blogs de tu interés. Comparte conocimiento, experiencias y construye una audiencia con tu propio blog.',
  keywords: ['blogs', 'publicaciones', 'contenido', 'escritores', 'artículos', 'comunidad', 'seguir blogs'],
  openGraph: {
    title: 'Blogs',
    description: 'Descubre blogs y comparte tu conocimiento con la comunidad',
    type: 'website',
  },
}

export default function BlogsPage() {
  return <BlogsPageContainer />
}

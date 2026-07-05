import type { Metadata } from 'next'
import { getServerClient } from '@/utils/supabase/server'
import { BlogDetailView } from '@/features/blogs/components/BlogDetailView'

// BlogDetailView fetches client-side (useBlogBySlug), so there is no server
// helper to share — metadata reads the row directly.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const client = await getServerClient()
  const { data: blog } = await client
    .from('blogs')
    .select('name, description, cover_image_url, profile_image_url')
    .eq('slug', slug)
    .maybeSingle()
  if (!blog) return { title: 'Blog no encontrado' }

  const description = blog.description
    ? blog.description.replace(/\s+/g, ' ').trim().slice(0, 160)
    : `Blog ${blog.name} en Yebaam Música.`
  const image = blog.cover_image_url || blog.profile_image_url || null
  return {
    title: blog.name,
    description,
    openGraph: {
      title: blog.name,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export default async function MusicaBlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <BlogDetailView slug={slug} embedded />
}

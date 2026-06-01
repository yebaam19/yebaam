import { BlogDetailView } from '@/features/blogs/components/BlogDetailView'

export default async function MusicaBlogDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <BlogDetailView slug={slug} embedded />
}

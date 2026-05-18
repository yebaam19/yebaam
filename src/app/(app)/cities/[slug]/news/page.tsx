import { PortalUnderConstruction } from '@/features/cities/components/portal/PortalUnderConstruction'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function NewsPage({ params }: Props) {
  const { slug } = await params
  return <PortalUnderConstruction sectionId="news" citySlug={slug} />
}

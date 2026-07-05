import type { Metadata } from 'next'
import { PortalUnderConstruction } from '@/features/cities/components/portal/PortalUnderConstruction'

// Placeholder ("en construcción") — keep out of search indexes until it has content.
export const metadata: Metadata = {
  robots: { index: false },
}

interface Props {
  params: Promise<{ slug: string }>
}

export default async function NewsPage({ params }: Props) {
  const { slug } = await params
  return <PortalUnderConstruction sectionId="news" citySlug={slug} />
}

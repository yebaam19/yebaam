import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getBusinessBySlug } from '@/features/comidas/server/business.server'
import { getMediaByBusiness } from '@/features/comidas/server/media.server'
import { GalleryGrid } from '@/features/comidas/components/public/GalleryGrid'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const business = await getBusinessBySlug(slug)
  if (!business) return {}
  return { title: `Galería — ${business.name} | Yebaam` }
}

export default async function GaleriaPage({ params }: Props) {
  const { slug } = await params
  const business = await getBusinessBySlug(slug)
  if (!business) notFound()

  const media = await getMediaByBusiness(business.id)

  return <GalleryGrid business={business} media={media} />
}

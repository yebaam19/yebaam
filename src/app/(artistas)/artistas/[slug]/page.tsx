import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getArtistProfileBySlug } from '@/features/artistas/server/artist.server'
import { ArtistProfile } from '@/features/artistas/components/public/ArtistProfile'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const artist = await getArtistProfileBySlug(slug)
  if (!artist) return {}
  return {
    title: `${artist.stage_name} | Yebaam Artistas`,
    description: artist.short_bio ?? artist.biography ?? undefined,
  }
}

export default async function ArtistProfilePage({ params }: Props) {
  const { slug } = await params
  const artist = await getArtistProfileBySlug(slug)
  if (!artist) notFound()

  return <ArtistProfile artist={artist} />
}

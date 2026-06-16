import type { Metadata } from 'next'
import { listArtistProfiles } from '@/features/artistas/server/artist.server'
import { ArtistasList } from '@/features/artistas/components/public/ArtistasList'

export const metadata: Metadata = {
  title: 'Artistas | Yebaam',
  description: 'Descubre artistas, músicos, bailarines y más en Yebaam.',
}

export default async function ArtistasPage() {
  const { data: artists, count } = await listArtistProfiles({ limit: 100 })

  return <ArtistasList artists={artists} totalCount={count ?? artists.length} />
}

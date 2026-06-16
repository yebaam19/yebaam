import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPortfolioItemById } from '@/features/artistas/server/portfolio.server'
import { PortfolioItem } from '@/features/artistas/components/public/PortfolioItem'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const item = await getPortfolioItemById(id)
  if (!item) return {}
  return { title: `${item.title} | Portafolio` }
}

export default async function PortfolioItemPage({ params }: Props) {
  const { id } = await params
  const item = await getPortfolioItemById(id)
  if (!item) notFound()

  return <PortfolioItem item={item} />
}

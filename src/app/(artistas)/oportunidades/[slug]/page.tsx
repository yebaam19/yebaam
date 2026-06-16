import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getOpportunityBySlug } from '@/features/artistas/server/opportunity.server'
import { OpportunityCard } from '@/features/artistas/components/public/OpportunityCard'
import Link from 'next/link'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const opp = await getOpportunityBySlug(slug)
  if (!opp) return {}
  return { title: `${opp.title} | Yebaam Artistas` }
}

export default async function OportunidadPage({ params }: Props) {
  const { slug } = await params
  const opp = await getOpportunityBySlug(slug)
  if (!opp) notFound()

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Link href="/oportunidades" className="text-sm text-muted-foreground mb-4 inline-block">
        ← Volver a oportunidades
      </Link>
      <OpportunityCard opportunity={opp} expanded />
    </main>
  )
}

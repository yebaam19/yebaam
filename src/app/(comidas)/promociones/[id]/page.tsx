import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPromotionById } from '@/features/comidas/server/promotion.server'
import { getBusinessBySlug } from '@/features/comidas/server/business.server'
import { PromotionCard } from '@/features/comidas/components/public/PromotionCard'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const promotion = await getPromotionById(id)
  if (!promotion) return {}
  return { title: `${promotion.title} | Yebaam Comidas` }
}

export default async function PromocionPage({ params }: Props) {
  const { id } = await params
  const promotion = await getPromotionById(id)
  if (!promotion) notFound()

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <Link href="/promociones" className="text-sm text-muted-foreground mb-4 inline-block">
        ← Volver a promociones
      </Link>
      <PromotionCard promotion={promotion} />
    </main>
  )
}

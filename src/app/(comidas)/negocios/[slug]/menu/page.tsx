import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getBusinessBySlug } from '@/features/comidas/server/business.server'
import { getMenusByBusiness } from '@/features/comidas/server/menu.server'
import { MenuView } from '@/features/comidas/components/public/MenuView'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const business = await getBusinessBySlug(slug)
  if (!business) return {}
  return { title: `Menú — ${business.name} | Yebaam` }
}

export default async function MenuPage({ params }: Props) {
  const { slug } = await params
  const business = await getBusinessBySlug(slug)
  if (!business) notFound()

  const menus = await getMenusByBusiness(business.id)

  return <MenuView business={business} menus={menus} />
}

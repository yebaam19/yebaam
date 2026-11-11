import { notFound } from 'next/navigation'
import { getCityBySlug } from '@/features/cities/server/city.server'
import { CityEventsList } from '@/features/cities/events/CityEventsList'

export const metadata = { title: 'Eventos de la ciudad | YEBAAM' }

export default async function EventsPage({ params, searchParams }: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams])
  const city = await getCityBySlug(slug)
  if (!city) notFound()
  return <CityEventsList cityId={city.id} citySlug={city.slug} cityName={city.name} page={Number(query.page) || 1} />
}

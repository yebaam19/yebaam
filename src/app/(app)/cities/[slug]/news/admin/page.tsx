import { notFound } from 'next/navigation'
import { CityNewsSourceManager } from '@/features/news/components/CityNewsSourceManager'
import { canManageCityNews, getCityNewsSources } from '@/features/news/server/news-author.server'
import { getCityBySlug } from '@/features/cities/server/city.server'

export default async function CityNewsAdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const city = await getCityBySlug(slug)
  if (!city || !(await canManageCityNews(city.id))) notFound()
  const sources = await getCityNewsSources(city.id)
  return <CityNewsSourceManager cityName={city.name} sources={sources} />
}

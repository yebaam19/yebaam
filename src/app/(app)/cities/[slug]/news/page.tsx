import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { NewsPortal, canManageCityNews, getNewsFeed, getNewsSections, getNewsSettings, type NewsScope } from '@/features/news'
import { getCityBySlug } from '@/features/cities/server/city.server'

export const metadata: Metadata = {
  title: 'Noticias locales | Yebaam',
}

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ seccion?: string; alcance?: string }>
}

export default async function NewsPage({ params, searchParams }: Props) {
  const { slug } = await params
  const query = await searchParams
  const scope = ['local', 'regional'].includes(query.alcance ?? '') ? query.alcance as NewsScope : undefined
  const city = await getCityBySlug(slug)
  if (!city) notFound()
  const [settings, sections, articles, canManage] = await Promise.all([
    getNewsSettings(),
    getNewsSections(),
    getNewsFeed({ cityId: city.id, section: query.seccion, scope }),
    canManageCityNews(city.id),
  ])
  if (!settings.newsEnabled) notFound()
  const basePath = `/cities/${slug}/news`
  return <NewsPortal settings={settings} sections={sections} articles={articles} activeSection={query.seccion} activeScope={scope} availableScopes={['local', 'regional']} basePath={basePath} title={`Noticias de ${city.name}`} description={`Historias locales y regionales publicadas desde ${city.name} por fuentes autorizadas.`} manageHref={canManage ? `${basePath}/admin` : undefined} />
}

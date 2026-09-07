import { NewsComposer } from '@/features/news/components/NewsComposer'
import { getNewsSections, getNewsSettings } from '@/features/news/server/news.server'
import { getMyNewsSources, getNewsAuthorEligibility } from '@/features/news/server/news-author.server'
import { getCities } from '@/features/cities/server/cities.server'

export const metadata = { title: 'Publicar noticia | Yebaam' }

export default async function CrearNoticiaPage() {
  const [sections, sources, eligibility, settings, cities] = await Promise.all([getNewsSections(), getMyNewsSources(), getNewsAuthorEligibility(), getNewsSettings(), getCities()])
  return <NewsComposer sections={sections} sources={sources} eligible={eligibility.eligible} newsEnabled={settings.newsEnabled} videosEnabled={settings.videosEnabled} cities={cities.map(({ id, name, state, country }) => ({ id, label: [name, state?.name, country.name].filter(Boolean).join(', ') }))} />
}

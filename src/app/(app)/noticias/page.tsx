import type { Metadata } from 'next'
import { NewsPortal, getActiveNewsAds, getNewsFeed, getNewsSections, getNewsSettings, getRecommendedNews, type NewsScope } from '@/features/news'

export const metadata: Metadata = { title: 'Noticias | Yebaam', description: 'Noticias locales, regionales, nacionales e internacionales.' }

export default async function NoticiasPage({ searchParams }: { searchParams: Promise<{ seccion?: string; alcance?: string }> }) {
  const query = await searchParams
  const scope = ['local', 'regional', 'national', 'international'].includes(query.alcance ?? '') ? query.alcance as NewsScope : undefined
  const [settings, sections, articles, ads, recommended] = await Promise.all([getNewsSettings(), getNewsSections(), getNewsFeed({ section: query.seccion, scope }), getActiveNewsAds(), getRecommendedNews()])
  if (!settings.newsEnabled) return <section className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="text-2xl font-bold">Noticias temporalmente fuera de servicio</h1><p className="mt-2 text-neutral-500 dark:text-neutral-400">El módulo se encuentra desactivado por administración.</p></section>
  return <NewsPortal settings={settings} sections={sections} articles={articles} ads={ads} recommended={recommended} activeSection={query.seccion} activeScope={scope} />
}

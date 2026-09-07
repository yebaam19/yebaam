import { notFound } from 'next/navigation'
import { NewsCard } from '@/features/news/components/NewsCard'
import { getNewsFeed, getNewsSource } from '@/features/news/server/news.server'

export default async function NewsSourcePage({ params }: { params: Promise<{ sourceId: string }> }) {
  const sourceId = (await params).sourceId
  const source = await getNewsSource(sourceId)
  if (!source) notFound()
  const articles = await getNewsFeed({ sourceId })
  return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><p className="text-sm font-semibold text-primary-700 dark:text-primary-400">Fuente autorizada</p><h1 className="mt-2 text-3xl font-black">{source.name}</h1>{source.websiteUrl && <a href={source.websiteUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-primary-700 underline dark:text-primary-400">Visitar sitio oficial</a>}<section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{articles.map((article) => <NewsCard key={article.id} article={article} />)}</section>{!articles.length && <p className="mt-8 text-neutral-500 dark:text-neutral-400">Esta fuente aún no tiene noticias publicadas.</p>}</div>
}

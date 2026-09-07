import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { NewsArticleView, getMyNewsReplicaEntities, getNewsArticle, getNewsComments, getNewsReplicas, getNewsSettings } from '@/features/news'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const article = await getNewsArticle((await params).slug)
  return article ? { title: `${article.title} | Yebaam Noticias`, description: article.excerpt } : {}
}

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const article = await getNewsArticle((await params).slug)
  if (!article) notFound()
  const [comments, replicas, replicaEntities, settings] = await Promise.all([getNewsComments(article.id), getNewsReplicas(article.id), getMyNewsReplicaEntities(), getNewsSettings()])
  if (!settings.newsEnabled) notFound()
  return <NewsArticleView article={article} comments={comments} replicas={replicas} replicaEntities={replicaEntities} videosEnabled={settings.videosEnabled} />
}

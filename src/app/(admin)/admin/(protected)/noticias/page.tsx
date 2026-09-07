import { requirePlatformAdmin } from '@/features/admin/server/auth'
import { AdminNewsSources } from '@/features/news/components/AdminNewsSources'
import { getAdminNewsArticles, getAdminNewsSources, getAdminNewsReplicas, getAdminNewsSections, getAdminNewsAdSlots } from '@/features/news/server/news-author.server'
import { getNewsSettings } from '@/features/news/server/news.server'

export const metadata = { title: 'Administrar noticias | Yebaam' }

export default async function AdminNoticiasPage() {
  await requirePlatformAdmin()
  const [sources, articles, replicas, sections, adSlots, settings] = await Promise.all([getAdminNewsSources(), getAdminNewsArticles(), getAdminNewsReplicas(), getAdminNewsSections(), getAdminNewsAdSlots(), getNewsSettings()])
  return <div className="px-4 py-6 sm:px-6 lg:px-8"><AdminNewsSources sources={sources} articles={articles} replicas={replicas} sections={sections} adSlots={adSlots} settings={settings} /></div>
}

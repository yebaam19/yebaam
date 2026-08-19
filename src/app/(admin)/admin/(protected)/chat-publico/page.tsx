import {
  listAdminMessages,
  listAdminTopics,
} from '@/features/chat-publico/server/admin.server'
import { getTranslations } from 'next-intl/server'
import { requirePlatformAdmin } from '@/features/admin/server/auth'
import ChatPublicoMessagesTable from '@/features/chat-publico/components/admin/ChatPublicoMessagesTable'

export const metadata = { title: 'Admin · Chat Público' }

interface PageProps {
  searchParams: Promise<{
    q?: string
    topic?: string
    deleted?: 'true' | 'false' | ''
    page?: string
  }>
}

export default async function AdminChatPublicoPage({ searchParams }: PageProps) {
  await requirePlatformAdmin()
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)

  const [topics, listed, t] = await Promise.all([
    listAdminTopics(),
    listAdminMessages({
      search: sp.q,
      topicId: sp.topic || undefined,
      deleted: sp.deleted || '',
      page,
      pageSize: 25,
    }),
    getTranslations('admin.chatPublico'),
  ])

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 border-b border-neutral-200 pb-5 dark:border-neutral-800">
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          {t('title')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-500 dark:text-neutral-400">
          {t('subtitle')}
        </p>
      </header>

      <ChatPublicoMessagesTable initial={listed} topics={topics} />
    </div>
  )
}

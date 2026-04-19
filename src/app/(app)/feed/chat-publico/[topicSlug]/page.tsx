import Link from 'next/link'
import type { Route } from 'next'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeftIcon } from '@/components/icons/heroicons-shim'
import { getAuthUser } from '@/features/auth/actions/auth.actions'
import ChatPublicoView from '@/features/chat-publico/components/ChatPublicoView'
import {
  getTopicBySlug,
  getTopicOwnerBlog,
  listMessagesForTopic,
  listTopics,
} from '@/features/chat-publico/server/chat-publico.server'

export const dynamic = 'force-dynamic'

export async function generateMetadata(
  { params }: { params: Promise<{ topicSlug: string }> },
): Promise<Metadata> {
  const { topicSlug } = await params
  const topic = await getTopicBySlug(topicSlug)
  if (!topic) return { title: 'Chat Público' }
  return {
    title: `Chat Público · ${topic.name}`,
    description: topic.description ?? 'Canal público de chat en tiempo real',
  }
}

export default async function ChatPublicoTopicPage({
  params,
}: {
  params: Promise<{ topicSlug: string }>
}) {
  const { topicSlug } = await params
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const [topic, topics] = await Promise.all([getTopicBySlug(topicSlug), listTopics()])
  if (!topic || topic.is_archived) notFound()

  const [initialMessages, ownerBlog] = await Promise.all([
    listMessagesForTopic(topic.id),
    getTopicOwnerBlog(topic),
  ])

  return (
    <div className="mx-auto w-full max-w-5xl">
      {ownerBlog && (
        <Link
          href={`/feed/blogs/${ownerBlog.slug}` as Route}
          className="mb-3 inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100 dark:border-primary-900/60 dark:bg-primary-950/40 dark:text-primary-300 dark:hover:bg-primary-900/30"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          Volver al blog · {ownerBlog.name}
        </Link>
      )}
      <ChatPublicoView
        topic={topic}
        topics={topics}
        initialMessages={initialMessages}
        currentUserId={user.id}
      />
    </div>
  )
}

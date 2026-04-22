import Link from 'next/link'
import type { Route } from 'next'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArrowLeftIcon } from '@/components/icons/heroicons-shim'
import { getAuthUser } from '@/features/auth/actions/auth.actions'
import ChatEntryGate from '@/features/chat-publico/components/ChatEntryGate'
import ChatPublicoShell from '@/features/chat-publico/components/ChatPublicoShell'
import { getRoomIdentity } from '@/features/chat-publico/lib/identity'
import { readPreferredNickname } from '@/features/chat-publico/lib/session'
import {
  getTopicBySlug,
  getTopicOwnerBlog,
  listMessagesForTopic,
  listTopics,
} from '@/features/chat-publico/server/chat-publico.server'
import { listRoomPresence } from '@/features/chat-publico/server/presence.server'
import { toClientIdentity } from '@/features/chat-publico/types'

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

  const topic = await getTopicBySlug(topicSlug)
  if (!topic || topic.is_archived) notFound()

  const [identity, topics, initialMessages, ownerBlog, authedUser, preferredNickname] =
    await Promise.all([
      getRoomIdentity(topic.id),
      listTopics(),
      listMessagesForTopic(topic.id),
      getTopicOwnerBlog(topic),
      getAuthUser(),
      readPreferredNickname(),
    ])

  if (!identity) {
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
        <ChatEntryGate
          topic={topic}
          authedUser={
            authedUser
              ? {
                  id: authedUser.id,
                  displayName: authedUser.displayName,
                  avatarUrl: authedUser.avatarUrl ?? null,
                }
              : null
          }
          preferredNickname={preferredNickname}
        />
      </div>
    )
  }

  const initialPresence = await listRoomPresence(topic.id)
  const clientIdentity = toClientIdentity(identity)

  return (
    <div className="flex h-full w-full flex-col">
      {ownerBlog && (
        <div className="shrink-0 border-b border-neutral-200 bg-white px-4 py-2 dark:border-neutral-800 dark:bg-neutral-900">
          <Link
            href={`/feed/blogs/${ownerBlog.slug}` as Route}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100 dark:border-primary-900/60 dark:bg-primary-950/40 dark:text-primary-300 dark:hover:bg-primary-900/30"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" />
            Volver al blog · {ownerBlog.name}
          </Link>
        </div>
      )}
      <div className="min-h-0 flex-1">
        <ChatPublicoShell
          topic={topic}
          topics={topics}
          initialMessages={initialMessages}
          initialPresence={initialPresence}
          identity={clientIdentity}
        />
      </div>
    </div>
  )
}

import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getAuthUser } from '@/features/auth/actions/auth.actions'
import ChatPublicoView from '@/features/chat-publico/components/ChatPublicoView'
import {
  getTopicBySlug,
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

  const initialMessages = await listMessagesForTopic(topic.id)

  return (
    <div className="mx-auto w-full max-w-5xl">
      <ChatPublicoView
        topic={topic}
        topics={topics}
        initialMessages={initialMessages}
        currentUserId={user.id}
      />
    </div>
  )
}

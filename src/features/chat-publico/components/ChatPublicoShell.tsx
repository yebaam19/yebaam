import ChatPublicoView from './ChatPublicoView'
import RoomUserList from './RoomUserList'
import RoomsSidebar from './RoomsSidebar'
import type {
  ChatIdentity,
  PublicChatTopic,
  PublicMessageWithSender,
  RoomPresenceRow,
} from '../types'

interface Props {
  topic: PublicChatTopic
  topics: PublicChatTopic[]
  initialMessages: PublicMessageWithSender[]
  initialPresence: RoomPresenceRow[]
  identity: ChatIdentity
}

/**
 * 4-pane chat shell:
 *   Top   — room header + media tabs (stub until media upload ships)
 *   Left  — rooms list + promotions
 *   Center— chat messages + composer
 *   Right — online user list (realtime presence)
 */
export default function ChatPublicoShell({
  topic,
  topics,
  initialMessages,
  initialPresence,
  identity,
}: Props) {
  return (
    <div className="flex h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] flex-col bg-neutral-50 dark:bg-neutral-950">
      <header className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {topic.name}
          </h1>
          <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
            {topic.description ?? 'Canal público de chat en tiempo real'}
          </p>
        </div>
        <nav aria-label="Tabs de medios" className="hidden items-center gap-1 sm:flex">
          <TabStub label="Fotos y Gifs" />
          <TabStub label="Videos" />
          <TabStub label="Tendencia" />
        </nav>
      </header>

      <div className="flex min-h-0 flex-1">
        <RoomsSidebar topics={topics} activeSlug={topic.slug} />

        <main className="flex min-w-0 flex-1 flex-col">
          <ChatPublicoView
            topic={topic}
            initialMessages={initialMessages}
            identity={identity}
          />
        </main>

        <RoomUserList
          roomId={topic.id}
          initialUsers={initialPresence}
          identity={identity}
        />
      </div>
    </div>
  )
}

function TabStub({ label }: { label: string }) {
  return (
    <span className="inline-flex cursor-not-allowed items-center rounded-full border border-neutral-200 px-3 py-1 text-xs font-medium text-neutral-500 opacity-60 dark:border-neutral-700 dark:text-neutral-400">
      {label}
    </span>
  )
}

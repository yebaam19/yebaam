'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import ChatPublicoView from './ChatPublicoView'
import RoomUserList from './RoomUserList'
import RoomsSidebar from './RoomsSidebar'
import type {
  ClientChatIdentity,
  PublicChatTopic,
  PublicMessageWithSender,
  RoomPresenceRow,
} from '../types'

interface Props {
  topic: PublicChatTopic
  topics: PublicChatTopic[]
  initialMessages: PublicMessageWithSender[]
  initialPresence: RoomPresenceRow[]
  identity: ClientChatIdentity
}

/**
 * 4-pane chat shell. Rooms pane (left) and users pane (right) are animated
 * collapsible; center chat flexes to fill whatever is left.
 */
export default function ChatPublicoShell({
  topic,
  topics,
  initialMessages,
  initialPresence,
  identity,
}: Props) {
  const [roomsOpen, setRoomsOpen] = useState(true)
  const [usersOpen, setUsersOpen] = useState(true)

  return (
    <div className="flex h-full flex-col bg-neutral-50 dark:bg-neutral-950">
      <header className="flex shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-3 py-2.5 dark:border-neutral-800 dark:bg-neutral-900 sm:px-4">
        <button
          type="button"
          onClick={() => setRoomsOpen((v) => !v)}
          aria-label={roomsOpen ? 'Ocultar salas' : 'Mostrar salas'}
          aria-expanded={roomsOpen}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        >
          <ChevronIcon open={roomsOpen} />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100 sm:text-base">
            {topic.name}
          </h1>
          <p className="truncate text-[11px] text-neutral-500 dark:text-neutral-400 sm:text-xs">
            {topic.description ?? 'Canal público de chat en tiempo real'}
          </p>
        </div>

        <nav aria-label="Tabs de medios" className="hidden items-center gap-1 md:flex">
          <TabStub label="Fotos y Gifs" />
          <TabStub label="Videos" />
          <TabStub label="Tendencia" />
        </nav>

        <button
          type="button"
          onClick={() => setUsersOpen((v) => !v)}
          aria-label={usersOpen ? 'Ocultar usuarios' : 'Mostrar usuarios'}
          aria-expanded={usersOpen}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 lg:hidden"
        >
          <UsersIcon />
        </button>
      </header>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* Left rooms pane — animated collapse */}
        <div
          className={cn(
            'transition-[width,opacity,transform] duration-300 ease-in-out',
            roomsOpen
              ? 'w-0 md:w-56 lg:w-60 opacity-100'
              : 'w-0 opacity-0 -translate-x-2 pointer-events-none',
          )}
        >
          <div
            className={cn(
              'h-full transition-opacity duration-200',
              roomsOpen ? 'opacity-100 delay-100' : 'opacity-0',
            )}
          >
            <RoomsSidebar topics={topics} activeSlug={topic.slug} />
          </div>
        </div>

        <main className="flex min-w-0 flex-1 flex-col bg-white dark:bg-neutral-900">
          <ChatPublicoView
            topic={topic}
            initialMessages={initialMessages}
            identity={identity}
          />
        </main>

        {/* Right users pane — animated collapse */}
        <div
          className={cn(
            'transition-[width,opacity,transform] duration-300 ease-in-out',
            usersOpen
              ? 'w-0 lg:w-56 xl:w-64 opacity-100'
              : 'w-0 opacity-0 translate-x-2 pointer-events-none',
          )}
        >
          <div
            className={cn(
              'h-full transition-opacity duration-200',
              usersOpen ? 'opacity-100 delay-100' : 'opacity-0',
            )}
          >
            <RoomUserList
              roomId={topic.id}
              initialUsers={initialPresence}
              identity={identity}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function TabStub({ label }: { label: string }) {
  return (
    <span className="inline-flex cursor-not-allowed items-center rounded-full border border-neutral-200 px-3 py-1 text-[11px] font-medium text-neutral-500 opacity-60 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800">
      {label}
    </span>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      className={cn(
        'h-5 w-5 transition-transform duration-300',
        !open && 'rotate-180',
      )}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
      />
    </svg>
  )
}

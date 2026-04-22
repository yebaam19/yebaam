import Link from 'next/link'
import type { Route } from 'next'
import { cn } from '@/lib/utils'
import type { PublicChatTopic } from '../types'

interface Props {
  topics: PublicChatTopic[]
  activeSlug: string
}

export default function RoomsSidebar({ topics, activeSlug }: Props) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 md:flex">
      <header className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Salas
        </h2>
      </header>
      <nav aria-label="Lista de salas" className="flex-1 overflow-y-auto py-2">
        <ul className="flex flex-col gap-0.5 px-2">
          {topics.length === 0 && (
            <li className="px-2 py-3 text-xs text-neutral-400">Sin salas todavía.</li>
          )}
          {topics.map((topic) => {
            const isActive = topic.slug === activeSlug
            const href = `/feed/chat-publico/${topic.slug}` as Route
            const isSub = !!topic.parent_topic_id
            return (
              <li key={topic.id}>
                <Link
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors',
                    isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800',
                    isSub && 'pl-5 text-xs',
                  )}
                >
                  <span className="truncate">#{topic.name.toLowerCase().replace(/\s+/g, '')}</span>
                  {topic.visibility === 'secret' && (
                    <span className="ml-auto text-[10px] uppercase opacity-60">secreta</span>
                  )}
                  {topic.visibility === 'private' && (
                    <span className="ml-auto text-[10px] uppercase opacity-60">privada</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="border-t border-neutral-200 p-3 dark:border-neutral-800">
        <div className="rounded-lg border border-dashed border-neutral-200 p-3 text-center dark:border-neutral-800">
          <p className="text-[11px] font-semibold uppercase text-neutral-500 dark:text-neutral-400">
            Promociones
          </p>
          <p className="mt-1 text-[11px] text-neutral-400">Próximamente</p>
        </div>
      </div>
    </aside>
  )
}

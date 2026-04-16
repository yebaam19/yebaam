import Link from 'next/link'
import type { Route } from 'next'
import { cn } from '@/lib/utils'
import type { PublicChatTopic } from '../types'

interface Props {
  topics: PublicChatTopic[]
  activeSlug: string
}

export default function TopicTabs({ topics, activeSlug }: Props) {
  if (topics.length === 0) return null
  return (
    <nav
      aria-label="Temas del chat público"
      className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
    >
      <ul className="flex gap-1 overflow-x-auto px-3 py-2 sm:px-6">
        {topics.map((topic) => {
          const isActive = topic.slug === activeSlug
          const href = `/feed/chat-publico/${topic.slug}` as Route
          return (
            <li key={topic.id} className="shrink-0">
              <Link
                href={href}
                className={cn(
                  'inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {topic.name}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

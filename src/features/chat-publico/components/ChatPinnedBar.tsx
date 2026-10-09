'use client'

import type { PinnedChatMessage } from '../types'

export default function ChatPinnedBar({ messages }: { messages: PinnedChatMessage[] }) {
  if (messages.length === 0) return null
  return (
    <section aria-label="Mensajes fijados" className="shrink-0 border-b border-secondary-200 bg-secondary-50 px-3 py-2 dark:border-secondary-900/40 dark:bg-primary-950/40 sm:px-6">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-primary-800 dark:text-secondary-200">Fijados</p>
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {messages.map((message) => (
          <p key={message.id} className="min-w-0 max-w-64 shrink-0 truncate rounded-lg border border-secondary-200 bg-white px-2.5 py-1.5 text-xs text-primary-950 dark:border-secondary-900/50 dark:bg-neutral-900 dark:text-primary-100">
            {message.content ?? 'Mensaje importante'}
          </p>
        ))}
      </div>
    </section>
  )
}

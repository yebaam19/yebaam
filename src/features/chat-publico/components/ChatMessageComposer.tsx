'use client'

import type { FormEvent, KeyboardEvent } from 'react'
import { useFormatter, useTranslations } from 'next-intl'
import type { ClientChatIdentity, CommunityChatRestriction, PublicChatTopic, PublicMessageWithSender } from '../types'

interface Props {
  topic: PublicChatTopic
  identity: ClientChatIdentity | null
  draft: string
  setDraft: (draft: string) => void
  replyTo: PublicMessageWithSender | null
  onCancelReply: () => void
  onSend: () => void
  isPending: boolean
  cooling: boolean
  remainingMs: number
  error: string | null
  canChat: boolean
  restriction: CommunityChatRestriction | null
}

const MAX_LENGTH = 2000

export default function ChatMessageComposer({ topic, identity, draft, setDraft, replyTo, onCancelReply, onSend, isPending, cooling, remainingMs, error, canChat, restriction }: Props) {
  const t = useTranslations('chat.public.view')
  const format = useFormatter()
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); onSend() }
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); onSend() }
  }

  return (
    <form onSubmit={submit} className="shrink-0 border-t border-primary-100 bg-white px-3 py-3 sm:px-6 dark:border-primary-900/50 dark:bg-neutral-900">
      {restriction && <p role="status" className="mb-2 rounded-lg border border-secondary-200 bg-secondary-50 px-3 py-2 text-xs leading-relaxed text-primary-950 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-100">
        {restriction.kind === 'block' ? t('restriction.blocked')
          : t('restriction.suspendedUntil', { date: format.dateTime(new Date(restriction.expires_at!), { dateStyle: 'medium', timeStyle: 'short' }) })}
        {' '}{t('restriction.reason', { reason: restriction.reason })}
      </p>}
      {replyTo && (
        <div className="mb-2 flex items-start justify-between gap-3 rounded-lg border-l-2 border-primary-600 bg-primary-50 px-3 py-2 text-xs text-primary-800 dark:bg-primary-950/40 dark:text-primary-200">
          <div className="min-w-0"><span className="font-semibold">Respuesta</span><p className="truncate">{replyTo.content}</p></div>
          <button type="button" onClick={onCancelReply} className="shrink-0 font-medium hover:underline" aria-label="Cancelar respuesta">Cancelar</button>
        </div>
      )}
      {error && <p role="alert" className="mb-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex items-end gap-2">
        <textarea value={draft} onChange={(event) => setDraft(event.target.value.slice(0, MAX_LENGTH))} onKeyDown={onKeyDown}
          rows={1} maxLength={MAX_LENGTH} disabled={!canChat} aria-label="Mensaje" placeholder={canChat ? t('placeholderActive', { channel: topic.name }) : t('placeholderInactive')}
          className="min-h-[40px] flex-1 resize-none rounded-xl border border-primary-200 bg-primary-50/40 px-3 py-2 text-sm text-primary-950 outline-none focus:border-primary-600 focus:bg-white disabled:opacity-60 dark:border-primary-900 dark:bg-primary-950/20 dark:text-primary-100" />
        <button type="submit" disabled={isPending || cooling || !draft.trim() || !canChat}
          className="inline-flex h-10 shrink-0 items-center rounded-xl bg-primary-700 px-4 text-sm font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50">
          {cooling ? t('submitCooldown', { seconds: Math.ceil(remainingMs / 1000) }) : isPending ? t('submitSending') : t('submit')}
        </button>
      </div>
      <p className="mt-1 px-1 text-[10px] text-neutral-500 dark:text-neutral-400">
        {draft.length}/{MAX_LENGTH} {t('hintEnter')}{identity?.kind === 'guest' && t('hintGuest')}{identity?.kind === 'nick' && t('hintNick')}
      </p>
    </form>
  )
}

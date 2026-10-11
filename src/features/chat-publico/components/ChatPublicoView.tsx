'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/utils/supabase/client'
import { subscribeToTable, unsubscribe } from '@/utils/supabase/realtime'
import type { ClientChatIdentity, CommunityChatRestriction, PinnedChatMessage, PublicChatTopic, PublicMessageRow, PublicMessageSender, PublicMessageWithSender } from '../types'
import { sendChatMessage, softDeletePublicMessage } from '../actions/chat-publico.actions'
import { setCommunityChatPin } from '../actions/community-chat.actions'
import { capabilitiesFor } from '../lib/permissions'
import { profileAvatarUrl, resolveMessageSenderAvatars } from '../lib/avatar'
import ChatMessageList from './ChatMessageList'
import ChatMessageComposer from './ChatMessageComposer'
import ChatPinnedBar from './ChatPinnedBar'
const ChatReportDialog = dynamic(() => import('./ChatReportDialog'))
const ChatReportsPanel = dynamic(() => import('./ChatReportsPanel'))
const ChatRestrictionsPanel = dynamic(() => import('./ChatRestrictionsPanel'))
const ChatReviewPanel = dynamic(() => import('./ChatReviewPanel'))
const ChatCasePanel = dynamic(() => import('./ChatCasePanel'))

interface Props {
  topic: PublicChatTopic
  initialMessages: PublicMessageWithSender[]
  initialPinnedMessages?: PinnedChatMessage[]
  identity: ClientChatIdentity | null
  canModerate?: boolean
  canBlock?: boolean
  canReviewPlatform?: boolean
  initialRestriction?: CommunityChatRestriction | null
}

const PAGE_SIZE = 30

export default function ChatPublicoView({ topic, initialMessages, initialPinnedMessages = [], identity, canModerate = false, canBlock = false, canReviewPlatform = false, initialRestriction = null }: Props) {
  const t = useTranslations('chat.public.view')
  const [messages, setMessages] = useState<PublicMessageWithSender[]>(() => [...initialMessages].reverse())
  const [draft, setDraft] = useState('')
  const [replyTo, setReplyTo] = useState<PublicMessageWithSender | null>(null)
  const [pinned, setPinned] = useState<PinnedChatMessage[]>(initialPinnedMessages)
  const [reportTarget, setReportTarget] = useState<string | null>(null)
  const [reportsOpen, setReportsOpen] = useState(false)
  const [restrictionsOpen, setRestrictionsOpen] = useState(false)
  const [reviewScope, setReviewScope] = useState<'mine' | 'staff' | null>(null)
  const [caseScope, setCaseScope] = useState<'mine' | 'staff' | null>(null)
  const reviewTriggerRef = useRef<HTMLButtonElement | null>(null)
  const caseTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [restrictionTarget, setRestrictionTarget] = useState<{ userId: string; label: string } | null>(null)
  const [restriction, setRestriction] = useState(initialRestriction)
  const [restrictionNow, setRestrictionNow] = useState(Date.now())
  const [pinBusyId, setPinBusyId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [cooldownUntil, setCooldownUntil] = useState(0)
  const [cooldownNow, setCooldownNow] = useState(Date.now())
  const [error, setError] = useState<string | null>(null)
  const [isLoadingOlder, setIsLoadingOlder] = useState(false)
  const [hasMore, setHasMore] = useState(initialMessages.length >= 50)
  const listRef = useRef<HTMLDivElement | null>(null)
  const atBottomRef = useRef(true)
  const locallySentRef = useRef(new Set<string>())
  const profileCacheRef = useRef(new Map<string, PublicMessageSender>(
    initialMessages.filter((message) => message.sender && message.sender_id)
      .map((message) => [message.sender_id as string, message.sender as PublicMessageSender]),
  ))

  const activeRestriction = restriction && (!restriction.expires_at || new Date(restriction.expires_at).getTime() > restrictionNow)
    ? restriction : null
  const canChat = capabilitiesFor(identity).canChat && !activeRestriction
  const remainingMs = Math.max(0, cooldownUntil - cooldownNow)
  const cooling = remainingMs > 0

  useEffect(() => {
    if (!cooling) return
    const timer = setInterval(() => setCooldownNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [cooling])
  useEffect(() => {
    if (!restriction?.expires_at) return
    const remaining = new Date(restriction.expires_at).getTime() - Date.now()
    if (remaining <= 0) return
    const delay = Math.min(60_000, remaining + 100)
    const timer = setTimeout(() => setRestrictionNow(Date.now()), delay)
    return () => clearTimeout(timer)
  }, [restriction, restrictionNow])
  useEffect(() => {
    if (reviewScope || !reviewTriggerRef.current) return
    reviewTriggerRef.current.focus()
    reviewTriggerRef.current = null
  }, [reviewScope])
  useEffect(() => {
    if (caseScope || !caseTriggerRef.current) return
    caseTriggerRef.current.focus()
    caseTriggerRef.current = null
  }, [caseScope])

  const scrollToBottom = useCallback((smooth: boolean) => {
    const el = listRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  useEffect(() => { scrollToBottom(false) }, [scrollToBottom])
  useEffect(() => { if (atBottomRef.current) scrollToBottom(true) }, [messages.length, scrollToBottom])

  const handleScroll = useCallback(() => {
    const el = listRef.current
    if (el) atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80
  }, [])

  const fetchSenders = useCallback(async (ids: string[]) => {
    const missing = ids.filter((id) => id && !profileCacheRef.current.has(id))
    if (missing.length === 0) return
    const { data } = await createClient().from('profiles')
      .select('id, username, display_name, avatar_url, avatar_cloudflare_id').in('id', missing)
    if (!data) return
    for (const row of data as Array<PublicMessageSender & { id: string; avatar_cloudflare_id: string | null }>) {
      profileCacheRef.current.set(row.id, {
        username: row.username, display_name: row.display_name, avatar_url: profileAvatarUrl(row),
      })
    }
    setMessages((previous) => previous.map((message) => message.sender || !message.sender_id
      ? message : { ...message, sender: profileCacheRef.current.get(message.sender_id) ?? null }))
  }, [])

  useEffect(() => {
    const channel = subscribeToTable<PublicMessageRow>({
      channel: `chat-publico:topic:${topic.id}`,
      table: 'public_chat_messages', filter: `topic_id=eq.${topic.id}`, events: ['INSERT', 'UPDATE'],
      onChange: (payload) => {
        const row = payload.new as PublicMessageRow
        if (!row?.id) return
        if (payload.eventType === 'INSERT') {
          if (row.is_deleted) return
          setMessages((previous) => previous.some((message) => message.id === row.id) ? previous : [
            ...previous, { ...row, sender: row.sender_id ? profileCacheRef.current.get(row.sender_id) ?? null : null },
          ])
          if (row.sender_id && !profileCacheRef.current.has(row.sender_id)) void fetchSenders([row.sender_id])
        } else if (payload.eventType === 'UPDATE') {
          setMessages((previous) => previous.map((message) => message.id === row.id ? { ...message, ...row } : message))
          setPinned((previous) => row.is_pinned && !row.is_deleted
            ? [...previous.filter((message) => message.id !== row.id), row]
              .sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5)
            : previous.filter((message) => message.id !== row.id))
        }
      },
    })
    return () => unsubscribe(channel)
  }, [fetchSenders, topic.id])

  const loadOlder = useCallback(async () => {
    if (isLoadingOlder || !hasMore || !messages[0]) return
    setIsLoadingOlder(true)
    try {
      const { data } = await createClient().from('public_chat_messages')
        .select('id, content, sender_id, sender_kind, sender_nickname, sender_avatar_url, created_at, is_deleted, is_pinned, topic_id, media_url, media_type, parent_message_id, reply_count, reaction_count, is_trending, sender:sender_id(username, display_name, avatar_url, avatar_cloudflare_id)')
        .eq('topic_id', topic.id).eq('is_deleted', false).lt('created_at', messages[0].created_at)
        .order('created_at', { ascending: false }).limit(PAGE_SIZE)
      const rows = resolveMessageSenderAvatars((data as unknown as PublicMessageWithSender[] | null) ?? [])
      if (rows.length > 0) {
        const el = listRef.current
        const previousHeight = el?.scrollHeight ?? 0
        for (const row of rows) if (row.sender && row.sender_id) profileCacheRef.current.set(row.sender_id, row.sender)
        setMessages((previous) => [...rows.slice().reverse(), ...previous])
        requestAnimationFrame(() => { if (el) el.scrollTop = el.scrollHeight - previousHeight })
      }
      setHasMore(rows.length === PAGE_SIZE)
    } finally { setIsLoadingOlder(false) }
  }, [hasMore, isLoadingOlder, messages, topic.id])

  const send = useCallback(() => {
    const content = draft.trim()
    if (!content || isPending || cooling || !canChat) return
    setError(null)
    startTransition(async () => {
      const result = await sendChatMessage(topic.id, content, replyTo?.id)
      if (result.ok) {
        if (result.messageId) locallySentRef.current.add(result.messageId)
        setDraft('')
        setReplyTo(null)
        return
      }
      if (result.error === 'rate_limited') {
        const ms = result.retryAfterMs ?? 2000
        setCooldownUntil(Date.now() + ms)
        setCooldownNow(Date.now())
        setError(t('errors.rateLimited', { seconds: Math.ceil(ms / 1000) }))
      } else if (result.error === 'restricted') {
        if (result.restriction) setRestriction(result.restriction)
        setError(t('errors.restricted'))
      } else if (result.error === 'invalid') setError(t('errors.invalid'))
      else if (result.error === 'unauthorized') setError(t('errors.unauthorized'))
      else setError(t('errors.sendFailed'))
    })
  }, [canChat, cooling, draft, isPending, replyTo, t, topic.id])

  const handleDelete = useCallback(async (id: string) => {
    const result = await softDeletePublicMessage(id)
    if (!result.ok) setError(t('errors.deleteFailed'))
  }, [t])

  const handlePin = useCallback(async (message: PublicMessageWithSender) => {
    if (pinBusyId) return
    setPinBusyId(message.id)
    const next = !message.is_pinned
    const result = await setCommunityChatPin(message.id, next)
    if (result.ok) {
      setMessages((previous) => previous.map((row) => row.id === message.id ? { ...row, is_pinned: next } : row))
      setPinned((previous) => next
        ? [...previous.filter((row) => row.id !== message.id), { id: message.id, content: message.content, created_at: message.created_at, is_pinned: true }]
          .sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5)
        : previous.filter((row) => row.id !== message.id))
    } else setError(result.error)
    setPinBusyId(null)
  }, [pinBusyId])

  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-neutral-900">
      {topic.owner_type === 'community' && topic.owner_id && identity && identity.kind !== 'guest' && <div role="toolbar" aria-label="Herramientas del chat comunitario" className="thin-scrollbar flex min-w-0 shrink-0 flex-nowrap justify-start gap-2 overflow-x-auto whitespace-nowrap border-b border-primary-100 px-3 py-1.5 dark:border-primary-900/50 sm:justify-end sm:px-6">
        <button type="button" onClick={(event) => { caseTriggerRef.current = event.currentTarget; setCaseScope('mine') }} className="rounded-lg px-2 py-1 text-xs font-semibold text-primary-800 hover:bg-primary-50 dark:text-primary-200 dark:hover:bg-primary-950/50">Mis expedientes</button>
        <button type="button" onClick={(event) => { reviewTriggerRef.current = event.currentTarget; setReviewScope('mine') }} className="rounded-lg px-2 py-1 text-xs font-semibold text-primary-800 hover:bg-primary-50 dark:text-primary-200 dark:hover:bg-primary-950/50">Mis revisiones</button>
        {(canModerate || canReviewPlatform) && <button type="button" onClick={(event) => { caseTriggerRef.current = event.currentTarget; setCaseScope('staff') }} className="rounded-lg px-2 py-1 text-xs font-semibold text-primary-800 hover:bg-primary-50 dark:text-primary-200 dark:hover:bg-primary-950/50">Expedientes</button>}
        {canModerate && <button type="button" onClick={() => setReportsOpen(true)} className="rounded-lg px-2 py-1 text-xs font-semibold text-primary-800 hover:bg-primary-50 dark:text-primary-200 dark:hover:bg-primary-950/50">Revisar reportes</button>}
        {(canModerate || canReviewPlatform) && <button type="button" onClick={(event) => { reviewTriggerRef.current = event.currentTarget; setReviewScope('staff') }} className="rounded-lg px-2 py-1 text-xs font-semibold text-primary-800 hover:bg-primary-50 dark:text-primary-200 dark:hover:bg-primary-950/50">Solicitudes</button>}
        {canModerate && <button type="button" onClick={() => setRestrictionsOpen(true)} className="rounded-lg px-2 py-1 text-xs font-semibold text-primary-800 hover:bg-primary-50 dark:text-primary-200 dark:hover:bg-primary-950/50">Restricciones</button>}
      </div>}
      <ChatPinnedBar messages={pinned} />
      <ChatMessageList messages={messages} identity={identity} locallySent={locallySentRef.current}
        listRef={listRef} hasMore={hasMore} isLoadingOlder={isLoadingOlder} onScroll={handleScroll}
        onLoadOlder={loadOlder} onDelete={handleDelete} onReply={setReplyTo}
        canModerate={canModerate} canReply={canChat} canReport={topic.owner_type === 'community' && !!identity && identity.kind !== 'guest'}
        pinBusyId={pinBusyId} onPin={handlePin} onReport={setReportTarget}
        onRestrict={(userId, label) => { setRestrictionTarget({ userId, label }); setRestrictionsOpen(true) }} />
      <ChatMessageComposer topic={topic} identity={identity} draft={draft} setDraft={setDraft}
        replyTo={replyTo} onCancelReply={() => setReplyTo(null)} onSend={send}
        isPending={isPending} cooling={cooling} remainingMs={remainingMs} error={error} canChat={canChat}
        restriction={activeRestriction} />
      {reportTarget && <ChatReportDialog messageId={reportTarget} onClose={() => setReportTarget(null)} />}
      {reportsOpen && topic.owner_id && <ChatReportsPanel communityId={topic.owner_id} onClose={() => setReportsOpen(false)} />}
      {restrictionsOpen && topic.owner_id && <ChatRestrictionsPanel communityId={topic.owner_id} canBlock={canBlock}
        target={restrictionTarget} onClose={() => { setRestrictionsOpen(false); setRestrictionTarget(null) }} />}
      {reviewScope && topic.owner_id && <ChatReviewPanel communityId={topic.owner_id} scope={reviewScope}
        restriction={activeRestriction} canBlock={canBlock || canReviewPlatform} onClose={() => setReviewScope(null)} />}
      {caseScope && topic.owner_id && <ChatCasePanel communityId={topic.owner_id} scope={caseScope}
        onClose={() => setCaseScope(null)} />}
    </div>
  )
}

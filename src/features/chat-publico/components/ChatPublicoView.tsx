'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/utils/supabase/client'
import { subscribeToTable, unsubscribe } from '@/utils/supabase/realtime'
import type { ClientChatIdentity, PublicChatTopic, PublicMessageRow, PublicMessageSender, PublicMessageWithSender } from '../types'
import { sendChatMessage, softDeletePublicMessage } from '../actions/chat-publico.actions'
import { capabilitiesFor } from '../lib/permissions'
import { profileAvatarUrl, resolveMessageSenderAvatars } from '../lib/avatar'
import ChatMessageList from './ChatMessageList'
import ChatMessageComposer from './ChatMessageComposer'

interface Props {
  topic: PublicChatTopic
  initialMessages: PublicMessageWithSender[]
  identity: ClientChatIdentity | null
}

const PAGE_SIZE = 30

export default function ChatPublicoView({ topic, initialMessages, identity }: Props) {
  const t = useTranslations('chat.public.view')
  const [messages, setMessages] = useState<PublicMessageWithSender[]>(() => [...initialMessages].reverse())
  const [draft, setDraft] = useState('')
  const [replyTo, setReplyTo] = useState<PublicMessageWithSender | null>(null)
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

  const canChat = capabilitiesFor(identity).canChat
  const remainingMs = Math.max(0, cooldownUntil - cooldownNow)
  const cooling = remainingMs > 0

  useEffect(() => {
    if (!cooling) return
    const timer = setInterval(() => setCooldownNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [cooling])

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
        .select('id, content, sender_id, sender_kind, sender_nickname, sender_avatar_url, created_at, is_deleted, topic_id, media_url, media_type, parent_message_id, reply_count, reaction_count, is_trending, sender:sender_id(username, display_name, avatar_url, avatar_cloudflare_id)')
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
      } else if (result.error === 'invalid') setError(t('errors.invalid'))
      else if (result.error === 'unauthorized') setError(t('errors.unauthorized'))
      else setError(t('errors.sendFailed'))
    })
  }, [canChat, cooling, draft, isPending, replyTo, t, topic.id])

  const handleDelete = useCallback(async (id: string) => {
    const result = await softDeletePublicMessage(id)
    if (!result.ok) setError(t('errors.deleteFailed'))
  }, [t])

  return (
    <div className="flex h-full min-h-0 flex-col bg-white dark:bg-neutral-900">
      <ChatMessageList messages={messages} identity={identity} locallySent={locallySentRef.current}
        listRef={listRef} hasMore={hasMore} isLoadingOlder={isLoadingOlder} onScroll={handleScroll}
        onLoadOlder={loadOlder} onDelete={handleDelete} onReply={setReplyTo} />
      <ChatMessageComposer topic={topic} identity={identity} draft={draft} setDraft={setDraft}
        replyTo={replyTo} onCancelReply={() => setReplyTo(null)} onSend={send}
        isPending={isPending} cooling={cooling} remainingMs={remainingMs} error={error} canChat={canChat} />
    </div>
  )
}

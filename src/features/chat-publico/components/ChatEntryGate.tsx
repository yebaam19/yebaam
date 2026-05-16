'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
import { useTranslations } from 'next-intl'
import { joinRoomAsNickname, joinRoomAsProfile } from '../actions/identity.actions'
import type { PublicChatTopic } from '../types'

interface AuthedUser {
  id: string
  displayName: string
  avatarUrl: string | null
}

interface Props {
  topic: PublicChatTopic
  authedUser: AuthedUser | null
  preferredNickname: string | null
}

type Mode = 'pick' | 'nickname'

export default function ChatEntryGate({ topic, authedUser, preferredNickname }: Props) {
  const router = useRouter()
  const t = useTranslations('chat.public.gate')
  const [mode, setMode] = useState<Mode>(authedUser ? 'pick' : 'nickname')
  const [nickname, setNickname] = useState(preferredNickname ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const joinAsProfile = () => {
    setError(null)
    startTransition(async () => {
      const res = await joinRoomAsProfile(topic.id)
      if (res.ok) {
        router.refresh()
        return
      }
      setError(mapError(res.error, t))
    })
  }

  const joinAsNick = () => {
    const value = nickname.trim()
    if (!value) {
      setError(t('errors.emptyNickname'))
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await joinRoomAsNickname(topic.id, value)
      if (res.ok) {
        router.refresh()
        return
      }
      setError(mapError(res.error, t))
    })
  }

  return (
    <div className="mx-auto flex min-h-[60dvh] w-full max-w-md flex-col items-center justify-center px-4 py-10">
      <div className="w-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {t('title', { channel: topic.name })}
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {topic.description ?? t('fallbackDescription')}
        </p>

        {mode === 'pick' && authedUser && (
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={joinAsProfile}
              disabled={isPending}
              className="w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {t('joinAsProfile', { name: authedUser.displayName })}
            </button>
            <button
              type="button"
              onClick={() => setMode('nickname')}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              {t('useNickname')}
            </button>
          </div>
        )}

        {mode === 'nickname' && (
          <div className="mt-5 space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                {t('nicknameLabel')}
              </span>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={24}
                placeholder={t('nicknamePlaceholder')}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-hidden focus:border-primary-500 focus:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:bg-neutral-900"
              />
              <span className="mt-1 block text-[11px] text-neutral-500 dark:text-neutral-400">
                {t('nicknameHint')}
              </span>
            </label>
            <button
              type="button"
              onClick={joinAsNick}
              disabled={isPending || !nickname.trim()}
              className="w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {isPending ? t('entering') : t('enter')}
            </button>
            {authedUser && (
              <button
                type="button"
                onClick={() => setMode('pick')}
                className="w-full text-xs text-neutral-500 hover:underline dark:text-neutral-400"
              >
                {t('back')}
              </button>
            )}
            {!authedUser && (
              <p className="text-center text-[11px] text-neutral-500 dark:text-neutral-400">
                {t('loginPrompt')}{' '}
                <Link href={'/login' as Route} className="text-primary-600 hover:underline">
                  {t('loginLink')}
                </Link>
                {t('loginPromptSuffix')}
              </p>
            )}
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}

function mapError(code: string, t: (key: string) => string): string {
  switch (code) {
    case 'nickname_taken':
      return t('errors.nicknameTaken')
    case 'invalid':
      return t('errors.invalid')
    case 'unauthorized':
      return t('errors.unauthorized')
    case 'room_closed':
      return t('errors.roomClosed')
    case 'room_full':
      return t('errors.roomFull')
    default:
      return t('errors.generic')
  }
}

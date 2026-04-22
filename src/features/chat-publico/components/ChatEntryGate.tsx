'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Route } from 'next'
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
      setError(mapError(res.error))
    })
  }

  const joinAsNick = () => {
    const value = nickname.trim()
    if (!value) {
      setError('Escribe un nickname.')
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await joinRoomAsNickname(topic.id, value)
      if (res.ok) {
        router.refresh()
        return
      }
      setError(mapError(res.error))
    })
  }

  return (
    <div className="mx-auto flex min-h-[60dvh] w-full max-w-md flex-col items-center justify-center px-4 py-10">
      <div className="w-full rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Entrar a {topic.name}
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {topic.description ?? 'Canal público de chat en tiempo real'}
        </p>

        {mode === 'pick' && authedUser && (
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={joinAsProfile}
              disabled={isPending}
              className="w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              Entrar como {authedUser.displayName}
            </button>
            <button
              type="button"
              onClick={() => setMode('nickname')}
              className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              Usar un nickname
            </button>
          </div>
        )}

        {mode === 'nickname' && (
          <div className="mt-5 space-y-3">
            <label className="block">
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                Nickname
              </span>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={24}
                placeholder="p. ej. trotamundos"
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-900 outline-hidden focus:border-primary-500 focus:bg-white dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:focus:bg-neutral-900"
              />
              <span className="mt-1 block text-[11px] text-neutral-500 dark:text-neutral-400">
                2-24 caracteres · letras, números, _ . -
              </span>
            </label>
            <button
              type="button"
              onClick={joinAsNick}
              disabled={isPending || !nickname.trim()}
              className="w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {isPending ? 'Entrando…' : 'Entrar'}
            </button>
            {authedUser && (
              <button
                type="button"
                onClick={() => setMode('pick')}
                className="w-full text-xs text-neutral-500 hover:underline dark:text-neutral-400"
              >
                ← Volver
              </button>
            )}
            {!authedUser && (
              <p className="text-center text-[11px] text-neutral-500 dark:text-neutral-400">
                ¿Ya tienes cuenta?{' '}
                <Link href={'/login' as Route} className="text-primary-600 hover:underline">
                  Inicia sesión
                </Link>{' '}
                para subir fotos, videos y links.
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

function mapError(code: string): string {
  switch (code) {
    case 'nickname_taken':
      return 'Ese nickname ya está en uso en esta sala. Elige otro.'
    case 'invalid':
      return 'Nickname inválido. Usa 2-24 caracteres (letras, números, _ . -).'
    case 'unauthorized':
      return 'Debes iniciar sesión para usar tu perfil.'
    case 'room_closed':
      return 'Esta sala está cerrada o archivada.'
    case 'room_full':
      return 'La sala está llena. Intenta entrar más tarde.'
    default:
      return 'No se pudo entrar. Intenta de nuevo.'
  }
}

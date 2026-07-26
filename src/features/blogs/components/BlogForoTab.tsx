'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { useState, useTransition } from 'react'
import { ChatBubbleLeftRightIcon } from '@/components/icons/heroicons-shim'
import { useFetch } from '@/lib/hooks/useFetch'
import { cacheKey, invalidate } from '@/lib/hooks/cacheStore'
import {
  ensureBlogForumSpaceAction,
  getOwnerSpaceBoardAction,
} from '@/features/foro/actions/foro.actions'
import SpaceBoard from '@/features/foro/components/SpaceBoard'

interface Props {
  blogId: string
  /** Display only — the forum's own name/slug/owner are resolved server-side. */
  blogName: string
  isOwner?: boolean
}

export function BlogForoTab({ blogId, blogName, isOwner }: Props) {
  const queryKey = ['foro', 'space-by-owner', 'blog', blogId]
  const { data, isLoading, error } = useFetch(
    queryKey,
    () => getOwnerSpaceBoardAction('blog', blogId),
    { staleTime: 1000 * 30 },
  )
  const [isActivating, startActivation] = useTransition()
  const [activationError, setActivationError] = useState<string | null>(null)

  const handleActivate = () => {
    setActivationError(null)
    startActivation(async () => {
      // Only the id travels: the action resolves name, slug and owner from the
      // blog row, so none of them can be spoofed by a hand-made call.
      const result = await ensureBlogForumSpaceAction(blogId)
      if (!result) {
        setActivationError('No se pudo activar el foro. Inténtalo de nuevo más tarde.')
        return
      }
      invalidate(cacheKey(...queryKey))
    })
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-1/3 rounded bg-neutral-200 dark:bg-neutral-700" />
          <div className="h-12 rounded bg-neutral-100 dark:bg-neutral-800" />
          <div className="h-12 rounded bg-neutral-100 dark:bg-neutral-800" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
        No se pudo cargar el foro de este blog.
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center dark:border-neutral-700 dark:bg-neutral-900">
        <span
          aria-hidden
          className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
        >
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
        </span>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            El foro de {blogName} aún no está activado
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {isOwner
              ? 'Crea el espacio del foro para empezar a recibir temas y respuestas de tu comunidad.'
              : 'Vuelve más tarde para participar en las conversaciones de esta comunidad.'}
          </p>
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={handleActivate}
            disabled={isActivating}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ChatBubbleLeftRightIcon className="h-4 w-4" />
            {isActivating ? 'Activando…' : 'Activar foro'}
          </button>
        )}
        {activationError && (
          <p className="text-xs text-rose-600 dark:text-rose-400">{activationError}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Conversaciones del foro de <span className="font-medium text-neutral-700 dark:text-neutral-300">{blogName}</span>
        </p>
        <Link
          href={`/foro/${data.space.slug}` as Route}
          className="text-xs font-medium text-primary-700 hover:underline dark:text-primary-400"
        >
          Abrir foro completo →
        </Link>
      </div>
      <SpaceBoard space={data.space} categories={data.categories} />
    </div>
  )
}

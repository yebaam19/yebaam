'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bookmark, MessageCircle, Send, Share2, ThumbsUp } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export function NewsInteractions({ articleId, initialReactions, initialComments, initialLiked = false, initialSaved = false }: { articleId: string; initialReactions: number; initialComments: number; initialLiked?: boolean; initialSaved?: boolean }) {
  const [reactionCount, setReactionCount] = useState(initialReactions)
  const [commentCount, setCommentCount] = useState(initialComments)
  const [liked, setLiked] = useState(initialLiked)
  const [saved, setSaved] = useState(initialSaved)
  const [comment, setComment] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const client = createClient()
  const router = useRouter()

  async function currentUser() {
    const { data } = await client.auth.getUser()
    if (!data.user) throw new Error('Inicia sesión para interactuar con esta noticia.')
    return data.user
  }

  async function toggleReaction() {
    try {
      const user = await currentUser()
      if (liked) {
        const { error } = await client.from('news_reactions').delete().eq('article_id', articleId).eq('user_id', user.id).eq('kind', 'like')
        if (error) throw error
        setLiked(false); setReactionCount((count) => Math.max(0, count - 1))
      } else {
        const { error } = await client.from('news_reactions').insert({ article_id: articleId, user_id: user.id, kind: 'like' })
        if (error) throw error
        setLiked(true); setReactionCount((count) => count + 1)
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo registrar la reacción.') }
  }

  async function toggleSave() {
    try {
      const user = await currentUser()
      const result = saved
        ? await client.from('news_saves').delete().eq('article_id', articleId).eq('user_id', user.id)
        : await client.from('news_saves').insert({ article_id: articleId, user_id: user.id })
      if (result.error) throw result.error
      setSaved(!saved)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo guardar la noticia.') }
  }

  async function share() {
    const url = window.location.href
    try {
      if (navigator.share) await navigator.share({ title: document.title, url })
      else { await navigator.clipboard.writeText(url); setMessage('Enlace copiado.') }
    } catch { /* The visitor closed the share sheet; this is not an error. */ }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const content = comment.trim()
    if (!content) return
    try {
      const user = await currentUser()
      const { error } = await client.from('news_comments').insert({ article_id: articleId, author_id: user.id, content })
      if (error) throw error
      setComment(''); setCommentCount((count) => count + 1); setMessage('Comentario publicado.'); router.refresh()
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo publicar el comentario.') }
  }

  return <section className="mt-8 border-y border-neutral-200 py-4 dark:border-neutral-800">
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={toggleReaction} aria-pressed={liked} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${liked ? 'bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-200' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}><ThumbsUp className="size-4" aria-hidden="true" /> Me gusta ({reactionCount})</button>
      <button type="button" onClick={toggleSave} aria-pressed={saved} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${saved ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}><Bookmark className="size-4" aria-hidden="true" /> {saved ? 'Guardada' : 'Guardar'}</button>
      <button type="button" onClick={share} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:bg-neutral-800"><Share2 className="size-4" aria-hidden="true" /> Compartir</button>
    </div>
    <form onSubmit={submitComment} className="mt-4 flex gap-2">
      <label className="sr-only" htmlFor="news-comment">Comentar</label>
      <input id="news-comment" value={comment} onChange={(event) => setComment(event.target.value)} maxLength={2000} placeholder="Participa con respeto…" className="min-h-11 min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-950" />
      <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary-700 px-3 text-sm font-semibold text-white hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950"><Send className="size-4" aria-hidden="true" /> Comentar</button>
    </form>
    <p className="mt-3 inline-flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400"><MessageCircle className="size-3.5" aria-hidden="true" /> {commentCount} comentarios</p>
    {message && <p role="status" className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{message}</p>}
  </section>
}

'use client'

import { ArrowDownTrayIcon, MusicalNoteIcon, PauseIcon, PlayIcon } from '@/components/icons/heroicons-shim'
import { usePlayerStore } from '@/features/music-archive/components/PlayerStore'
import type { PlayItem } from '@/features/music-archive/types/music.types'
import { imageUrl } from '@/lib/media/urls'
import Link from 'next/link'
import type { Route } from 'next'
import { useEffect, useState } from 'react'

interface Track {
  id: string
  title: string
  position: number | null
  side: string | null
  durationSeconds: number | null
  /** Pre-signed R2 audio URL, or null when the track has no audio. */
  audioUrl: string | null
}
interface Album {
  id: string
  title: string
  slug: string
  year: number | null
  coverCfImageId: string | null
  tracks: Track[]
}
interface MusicResponse {
  artist: { id: string; name: string; slug: string } | null
  albums: Album[]
}

function formatDuration(s?: number | null) {
  if (!s) return '—'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

/** "Mi Música" tab — the catalog artist linked to this blog, with playable tracks
 *  wired to the global music player + per-track download (PDF #10). */
export function BlogMusicTab({ blogId, isOwner }: { blogId: string; isOwner: boolean }) {
  const [data, setData] = useState<MusicResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const setQueue = usePlayerStore((s) => s.setQueue)
  const togglePlay = usePlayerStore((s) => s.togglePlay)
  const queue = usePlayerStore((s) => s.queue)
  const currentIndex = usePlayerStore((s) => s.currentIndex)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const currentTrackId = queue[currentIndex]?.trackId

  useEffect(() => {
    let active = true
    fetch(`/api/blogs/${blogId}/music`, { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((j: MusicResponse) => {
        if (active) {
          setData(j)
          setLoading(false)
        }
      })
      .catch(() => {
        if (active) {
          setData({ artist: null, albums: [] })
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [blogId])

  const playFromAlbum = (album: Album, trackId: string) => {
    if (!data?.artist) return
    const playable = album.tracks.filter((t) => t.audioUrl)
    const items: PlayItem[] = playable.map((t) => ({
      trackId: t.id,
      title: t.title,
      artistName: data.artist!.name,
      albumSlug: album.slug,
      artistSlug: data.artist!.slug,
      coverCfId: album.coverCfImageId,
      audioUrl: t.audioUrl as string,
      durationSeconds: t.durationSeconds ?? 0,
    }))
    const startIndex = Math.max(0, items.findIndex((i) => i.trackId === trackId))
    // Clicking the currently-playing track toggles play/pause.
    if (currentTrackId === trackId) {
      togglePlay()
      return
    }
    setQueue(items, startIndex)
  }

  if (loading) return <p className="text-sm text-neutral-500 dark:text-neutral-400">Cargando música…</p>

  if (!data?.artist) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50/60 p-8 text-center dark:border-neutral-700 dark:bg-neutral-900/40">
        <MusicalNoteIcon className="mx-auto mb-3 h-10 w-10 text-neutral-400" />
        <p className="text-sm text-neutral-600 dark:text-neutral-300">Este blog aún no ha enlazado su música.</p>
        {isOwner && (
          <p className="mt-1 text-xs text-neutral-500">
            Enlaza tu perfil de artista del archivo musical desde «Editar blog».
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Mi Música</h3>
        <Link
          href={`/musica/artistas/${data.artist.slug}` as Route}
          className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
        >
          Ver en el archivo →
        </Link>
      </div>

      {data.albums.length === 0 ? (
        <p className="text-sm text-neutral-500">Aún no hay álbumes para {data.artist.name}.</p>
      ) : (
        data.albums.map((album) => (
          <div key={album.id} className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3 border-b border-neutral-200 bg-neutral-50/60 p-3 dark:border-neutral-700 dark:bg-neutral-800/40">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-neutral-100 dark:bg-neutral-800">
                {album.coverCfImageId ? (
                  <img
                    src={imageUrl(album.coverCfImageId, 'public')}
                    alt={album.title}
                    className="h-full w-full object-cover"
                    decoding="async"
                    loading="lazy"
                  />
                ) : (
                  <MusicalNoteIcon className="m-3 h-6 w-6 text-neutral-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-neutral-900 dark:text-white">{album.title}</p>
                {album.year && <p className="text-xs text-neutral-500">{album.year}</p>}
              </div>
            </div>
            {album.tracks.length > 0 && (
              <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {album.tracks.map((tr) => {
                  const isCurrent = currentTrackId === tr.id
                  return (
                    <li key={tr.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <button
                        type="button"
                        onClick={() => tr.audioUrl && playFromAlbum(album, tr.id)}
                        disabled={!tr.audioUrl}
                        aria-label={isCurrent && isPlaying ? 'Pausar' : `Reproducir ${tr.title}`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        {isCurrent && isPlaying ? (
                          <PauseIcon className="h-3.5 w-3.5" />
                        ) : (
                          <PlayIcon className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <span
                        className={`min-w-0 flex-1 truncate ${
                          isCurrent ? 'font-medium text-primary-600 dark:text-primary-400' : 'text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {tr.position ? `${tr.position}. ` : ''}
                        {tr.title}
                      </span>
                      <span className="shrink-0 text-xs text-neutral-400">{formatDuration(tr.durationSeconds)}</span>
                      {tr.audioUrl && (
                        <a
                          href={tr.audioUrl}
                          download
                          title="Descargar"
                          className="shrink-0 rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-primary-600 dark:hover:bg-neutral-700"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </a>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ))
      )}
    </div>
  )
}

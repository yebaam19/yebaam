'use client'

import { useTransition, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { uploadService } from '@/lib/service/upload.service'
import { saveArtistImage, saveArtistVideo, saveArtistAudio, deleteArtistMedia } from '../../actions/media.actions'
import { deletePortfolioItem } from '../../actions/portfolio.actions'
import type { PortfolioItem } from '../../types'

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

interface Props {
  profileId: string
  items: PortfolioItem[]
}

export function PortfolioUploader({ profileId, items }: Props) {
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    startTransition(async () => {
      try {
        if (file.type.startsWith('image/')) {
          const { id } = await uploadService.uploadImage(file)
          await saveArtistImage(profileId, id)
          toast.success('Imagen subida')
        } else if (file.type.startsWith('video/')) {
          const { uid } = await uploadService.uploadVideo(file)
          await saveArtistVideo(profileId, uid)
          toast.success('Video subido')
        } else if (file.type.startsWith('audio/')) {
          const { key } = await uploadService.uploadAudio(file)
          await saveArtistAudio(profileId, key)
          toast.success('Audio subido')
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al subir')
      }
    })
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Subir obra</label>
        <input ref={fileRef} type="file" accept="image/*,video/*,audio/*" onChange={handleFileChange} disabled={isPending} className="text-sm" />
        {isPending && <p className="text-xs text-muted-foreground mt-1">Subiendo…</p>}
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {items.map((item) => {
            const url = item.cf_image_id ? `https://imagedelivery.net/${CF_HASH}/${item.cf_image_id}/public` : null
            return (
              <div key={item.id} className="group relative rounded-xl overflow-hidden border border-border">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {url ? (
                    <Image src={url} alt={item.title} fill className="object-cover" sizes="200px" />
                  ) : (
                    <span className="text-muted-foreground text-xs">{item.media_type}</span>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium line-clamp-1">{item.title}</p>
                </div>
                <button
                  onClick={() => startTransition(async () => { await deletePortfolioItem(item.id); toast.success('Eliminado') })}
                  className="absolute top-1 right-1 bg-destructive text-white text-xs rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

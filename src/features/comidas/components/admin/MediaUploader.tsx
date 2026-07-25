'use client'

import { useTransition, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { uploadService } from '@/lib/service/upload.service'
import { saveBusinessImage, saveBusinessVideo, setPrimaryMedia, deleteMedia } from '../../actions/media.actions'
import type { MediaAsset } from '../../types'

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

interface Props {
  businessId: string
  existing: MediaAsset[]
}

export function MediaUploader({ businessId, existing }: Props) {
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    startTransition(async () => {
      try {
        if (file.type.startsWith('image/')) {
          const { id } = await uploadService.uploadImage(file)
          await saveBusinessImage({ business_id: businessId, cf_image_id: id })
          toast.success('Imagen subida')
        } else if (file.type.startsWith('video/')) {
          const { uid } = await uploadService.uploadVideo(file)
          await saveBusinessVideo({ business_id: businessId, cf_video_uid: uid })
          toast.success('Video subido')
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
        <label className="block text-sm font-medium mb-2">Subir imagen o video</label>
        <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFileChange} disabled={isPending} className="text-sm" />
        {isPending && <p className="text-xs text-muted-foreground mt-1">Subiendo…</p>}
      </div>

      {existing.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {existing.map((asset) => (
            <div key={asset.id} className="relative group rounded-xl overflow-hidden border border-border">
              {asset.cf_image_id ? (
                <div className="relative aspect-square">
                  <Image
                    src={`https://imagedelivery.net/${CF_HASH}/${asset.cf_image_id}/public`}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="200px"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="aspect-square bg-muted flex items-center justify-center text-muted-foreground text-xs">Video</div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                {!asset.is_primary && (
                  <button
                    onClick={() => startTransition(async () => { await setPrimaryMedia(asset.id, businessId); toast.success('Principal') })}
                    className="text-xs text-white bg-primary/80 px-2 py-1 rounded"
                  >
                    Principal
                  </button>
                )}
                <button
                  onClick={() => startTransition(async () => { await deleteMedia(asset.id); toast.success('Eliminado') })}
                  className="text-xs text-white bg-destructive/80 px-2 py-1 rounded"
                >
                  Eliminar
                </button>
              </div>
              {asset.is_primary && (
                <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded">Principal</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

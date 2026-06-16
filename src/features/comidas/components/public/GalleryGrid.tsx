import Image from 'next/image'
import type { Business, MediaAsset } from '../../types'

const CF_HASH = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH ?? ''

function cfImageUrl(id: string | null) {
  if (!id) return null
  return `https://imagedelivery.net/${CF_HASH}/${id}/public`
}

interface Props {
  business: Business
  media: MediaAsset[]
}

export function GalleryGrid({ business, media }: Props) {
  const images = media.filter((m) => m.type === 'IMAGE' && m.cf_image_id)
  const videos = media.filter((m) => m.type === 'VIDEO' && m.cf_video_uid)

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Galería — {business.name}</h1>

      {images.length === 0 && videos.length === 0 && (
        <p className="text-muted-foreground">Sin contenido en galería.</p>
      )}

      {images.length > 0 && (
        <section className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((asset) => {
              const url = cfImageUrl(asset.cf_image_id)!
              return (
                <div key={asset.id} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
                  <Image src={url} alt={asset.alt_text ?? ''} fill className="object-cover" sizes="(max-width: 640px) 50vw, 25vw" />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {videos.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Videos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {videos.map((asset) => (
              <div key={asset.id} className="aspect-video rounded-xl overflow-hidden bg-black">
                <iframe
                  src={`https://iframe.videodelivery.net/${asset.cf_video_uid}`}
                  className="w-full h-full"
                  allow="autoplay; fullscreen; picture-in-picture"
                  title={asset.title ?? 'Video'}
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

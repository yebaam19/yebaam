import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../../components/shared/Navbar'
import Footer from '../../components/shared/Footer'
import SectionHeader from '../../components/shared/SectionHeader'
import GalleryGrid, { type GalleryMediaItem } from './components/GalleryGrid'
import MediaViewer from './components/MediaViewer'
import { getBusinessById } from '../businesses/api'
import { trackEvent } from '../../lib/analytics'
import { getErrorMessage } from '../../lib/httpError'

type MediaAsset = {
  id: number
  type: 'IMAGE' | 'VIDEO'
  url: string
  thumbnailUrl?: string | null
  altText?: string | null
  title?: string | null
  isPrimary?: boolean
}

type BusinessDetail = {
  id: number
  name: string
  mediaAssets?: MediaAsset[]
}

export default function GalleryPage() {
  const { id } = useParams<{ id: string }>()
  const [business, setBusiness] = useState<BusinessDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  useEffect(() => {
    async function loadBusiness() {
      if (!id) {
        setError('No recibimos el identificador del negocio')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        setBusiness(await getBusinessById<BusinessDetail>(id))
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'No pudimos cargar la galería del negocio'))
      } finally {
        setLoading(false)
      }
    }

    loadBusiness()
  }, [id])

  useEffect(() => {
    if (!business?.id) return

    void trackEvent({
      eventType: 'GALLERY_OPEN',
      entityType: 'business',
      entityId: business.id,
      sourceScreen: 'gallery_page',
      metadata: { action: 'open_gallery' },
    })
  }, [business?.id])

  const items = useMemo<GalleryMediaItem[]>(() => {
    return (business?.mediaAssets ?? []).map((media) => ({
      id: media.id,
      type: media.type === 'VIDEO' ? 'video' : 'image',
      title: media.title || media.altText || business?.name || 'Contenido visual',
      url: media.url,
      thumbnailUrl: media.thumbnailUrl || undefined,
      alt: media.altText || undefined,
      isFeatured: media.isPrimary,
    }))
  }, [business])

  const selectedItem =
    selectedIndex !== null ? items[selectedIndex] : null

  function handleSelect(_: GalleryMediaItem, index: number) {
    setSelectedIndex(index)
  }

  function handleClose() {
    setSelectedIndex(null)
  }

  function handlePrev() {
    if (selectedIndex === null) return
    setSelectedIndex((prev) => {
      if (prev === null) return null
      return prev === 0 ? items.length - 1 : prev - 1
    })
  }

  function handleNext() {
    if (selectedIndex === null) return
    setSelectedIndex((prev) => {
      if (prev === null) return null
      return prev === items.length - 1 ? 0 : prev + 1
    })
  }

  if (loading) {
    return <main className="p-8">Cargando galería...</main>
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Link to="/businesses" className="text-sm font-medium text-orange-600">
            ← Volver a negocios
          </Link>
          <p className="mt-4 text-sm text-red-600">{error}</p>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Fotos y videos"
          title={`Galería de ${business?.name || 'este negocio'}`}
          description="Mira platos, ambiente y detalles visuales para conocer mejor la propuesta antes de decidir."
        />

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="rounded-full bg-slate-100 px-3 py-1">
              {items.filter((item) => item.type === 'image').length} imágenes
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1">
              {items.filter((item) => item.type === 'video').length} videos
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1">
              Contenido visual del negocio
            </span>
          </div>
        </div>

        <GalleryGrid items={items} onSelect={handleSelect} />

        <MediaViewer
          open={selectedIndex !== null}
          item={selectedItem}
          currentIndex={selectedIndex ?? 0}
          total={items.length}
          onClose={handleClose}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      </main>

      <Footer />
    </div>
  )
}

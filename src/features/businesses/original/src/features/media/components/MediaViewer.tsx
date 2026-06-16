import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'
import type { GalleryMediaItem } from './GalleryGrid'

interface MediaViewerProps {
  open: boolean
  item?: GalleryMediaItem | null
  currentIndex?: number
  total?: number
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
}

export default function MediaViewer({
  open,
  item,
  currentIndex = 0,
  total = 0,
  onClose,
  onPrev,
  onNext,
}: MediaViewerProps) {
  if (!item) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={item.title || 'Vista del contenido'}
      description={
        total > 0 ? `Elemento ${currentIndex + 1} de ${total}` : undefined
      }
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <div className="text-sm text-slate-500">
            {item.type === 'video' ? 'Video' : 'Imagen'}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onPrev}>
              Anterior
            </Button>
            <Button variant="outline" onClick={onNext}>
              Siguiente
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="overflow-hidden rounded-3xl bg-slate-100">
          {item.type === 'image' ? (
            <img
              src={item.url}
              alt={item.alt || item.title || 'Imagen'}
              className="max-h-[70vh] w-full object-contain bg-slate-950"
            />
          ) : (
            <video
              src={item.url}
              controls
              className="max-h-[70vh] w-full bg-slate-950"
              poster={item.thumbnailUrl}
            />
          )}
        </div>

        {item.title && (
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              {item.title}
            </h3>
            {item.alt && (
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {item.alt}
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

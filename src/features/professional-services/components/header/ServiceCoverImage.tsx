import { PencilIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'

type CoverSize = 'small' | 'medium' | 'large' | 'xlarge'

interface ServiceCoverImageProps {
  coverUrl?: string
  serviceName: string
  isOwner?: boolean
  onEdit?: () => void
  size?: CoverSize
}

// Mapeo de tamaños
const sizeClasses: Record<CoverSize, string> = {
  small: 'h-40 sm:h-48 lg:h-56', // 160px -> 192px -> 224px
  medium: 'h-48 sm:h-64 lg:h-72', // 192px -> 256px -> 288px (antes default)
  large: 'h-64 sm:h-80 lg:h-96', // 256px -> 320px -> 384px (nuevo default)
  xlarge: 'h-80 sm:h-96 lg:h-[28rem]', // 320px -> 384px -> 448px
}

/**
 * Cover image del servicio profesional con botón de editar
 * @param size - Tamaño de la imagen: 'small', 'medium', 'large' (default), 'xlarge'
 */
export function ServiceCoverImage({ coverUrl, serviceName, isOwner, onEdit, size = 'large' }: ServiceCoverImageProps) {
  return (
    <div className={`relative bg-linear-to-r from-primary-500 to-primary-600 ${sizeClasses[size]}`}>
      {coverUrl && (
        <Image
          src={coverUrl}
          alt={`Cover de ${serviceName}`}
          fill
          className="object-cover"
          priority
          quality={95}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
          unoptimized
        />
      )}
      <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />

      {/* Botón Editar Perfil - Solo visible para el dueño */}
      {isOwner && onEdit && (
        <button
          onClick={onEdit}
          className="absolute top-4 right-4 flex items-center gap-2 rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-neutral-900 shadow-lg backdrop-blur-sm transition-all hover:bg-white hover:shadow-xl"
        >
          <PencilIcon className="h-4 w-4" />
          <span>Editar perfil</span>
        </button>
      )}
    </div>
  )
}

import Image from 'next/image'

interface ProfilePhotoCardProps {
  logoUrl?: string
  serviceName: string
}

/**
 * "Foto de Perfil" — el logo del servicio en su propia columna, SIN el solape
 * negativo (`-mt-16`) del header clásico. En el mockup la foto de perfil vive
 * en una columna al lado de la portada, no encima de ella.
 */
export function ProfilePhotoCard({ logoUrl, serviceName }: ProfilePhotoCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-neutral-800">
      <div className="relative aspect-4/5 w-full bg-neutral-100 dark:bg-neutral-700">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={serviceName}
            fill
            className="object-cover"
            quality={95}
            sizes="(max-width: 1024px) 100vw, 18rem"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary-100 text-6xl font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            {serviceName.charAt(0)}
          </div>
        )}
      </div>
    </div>
  )
}

import Image from 'next/image'

interface ServiceAvatarProps {
  logoUrl?: string
  serviceName: string
}

/**
 * Avatar/Logo del servicio profesional
 */
export function ServiceAvatar({ logoUrl, serviceName }: ServiceAvatarProps) {
  return (
    <div className="relative -mt-16 mb-4 sm:-mt-20">
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white bg-white shadow-lg sm:h-36 sm:w-36 dark:border-neutral-800 dark:bg-neutral-700">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={serviceName}
            fill
            className="object-cover"
            quality={95}
            sizes="(max-width: 640px) 112px, 144px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary-100 text-4xl font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            {serviceName.charAt(0)}
          </div>
        )}
      </div>
    </div>
  )
}

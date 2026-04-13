/**
 * PortalHeader Component
 *
 * Header principal del portal con imagen hero, título y botón de unirse
 */

import { Button } from '@/ui/Button'
import { UserPlusIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import { PortalHeaderProps } from '../interfaces'

export function PortalHeader({ title, subtitle, description, heroImage }: PortalHeaderProps) {
  return (
    <div className="relative isolate h-72 overflow-hidden rounded-2xl bg-linear-to-br from-red-600 via-amber-500 to-green-600 text-white shadow-2xl sm:h-96 md:h-120">
      {heroImage && (
        <div className="absolute inset-0 z-0">
          <Image src={heroImage} alt={title} fill className="object-cover brightness-[0.5]" priority />
        </div>
      )}

      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 pb-20 text-center sm:pb-24">
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight drop-shadow-2xl sm:mb-3 sm:text-5xl md:text-6xl lg:text-7xl">{title}</h1>
        <p className="mb-2 text-lg font-semibold text-amber-300 drop-shadow-lg sm:text-2xl md:text-3xl">{subtitle}</p>
        <p className="max-w-2xl text-sm font-medium text-white/90 drop-shadow-md sm:text-lg md:text-xl">{description}</p>
      </div>

      <div className="absolute right-3 bottom-3 z-10 sm:right-6 sm:bottom-6">
        <Button className="bg-linear-to-r from-red-500 to-amber-500 px-3 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:from-red-600 hover:to-amber-600 hover:shadow-xl sm:px-4 sm:text-sm">
          <UserPlusIcon className="mr-1.5 size-4 sm:mr-2 sm:size-5" />
          Unirse al Portal
        </Button>
      </div>
    </div>
  )
}

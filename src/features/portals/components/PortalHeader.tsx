/**
 * PortalHeader Component
 *
 * Header principal del portal con imagen hero, título y botón de unirse
 */

import { Button } from '@/ui/Button'
import { UserPlusIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'
import { PortalHeaderProps } from '../interfaces'

export function PortalHeader({ title, subtitle, description, heroImage }: PortalHeaderProps) {
  return (
    <div className="relative isolate h-[480px] overflow-hidden rounded-2xl bg-linear-to-br from-red-600 via-amber-500 to-green-600 text-white shadow-2xl">
      {heroImage && (
        <div className="absolute inset-0 z-0">
          <Image src={heroImage} alt={title} fill className="object-cover brightness-[0.5]" priority />
        </div>
      )}

      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-3 text-5xl font-extrabold tracking-tight drop-shadow-2xl sm:text-6xl md:text-7xl">{title}</h1>
        <p className="mb-2 text-2xl font-semibold text-amber-300 drop-shadow-lg sm:text-3xl">{subtitle}</p>
        <p className="max-w-2xl text-lg font-medium text-white/90 drop-shadow-md sm:text-xl">{description}</p>
      </div>

      <div className="absolute right-4 bottom-4 z-10 sm:right-6 sm:bottom-6">
        <Button className="bg-linear-to-r from-red-500 to-amber-500 font-semibold text-white shadow-lg transition-all hover:from-red-600 hover:to-amber-600 hover:shadow-xl">
          <UserPlusIcon className="mr-2 size-5" />
          Unirse al Portal
        </Button>
      </div>
    </div>
  )
}

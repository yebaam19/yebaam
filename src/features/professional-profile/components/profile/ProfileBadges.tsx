/**
 * ProfileBadges Component
 *
 * Muestra las insignias/badges del perfil profesional
 */

'use client'

import { cn } from '@/lib/utils'
import { CheckBadgeIcon, ShieldCheckIcon, StarIcon, TrophyIcon } from '@/components/icons/heroicons-shim'

interface Badge {
  id: string
  name: string
  description: string
  icon: React.ElementType
  color: string
}

const BADGES: Badge[] = [
  {
    id: 'verified',
    name: 'Verificado',
    description: 'Identidad profesional verificada',
    icon: CheckBadgeIcon,
    color: 'text-primary-500',
  },
  {
    id: 'expert',
    name: 'Experto',
    description: 'Más de 10 años de experiencia',
    icon: StarIcon,
    color: 'text-secondary-500',
  },
  {
    id: 'certified',
    name: 'Certificado',
    description: 'Certificaciones validadas',
    icon: TrophyIcon,
    color: 'text-secondary-500',
  },
  {
    id: 'trusted',
    name: 'Confiable',
    description: 'Alto nivel de confianza',
    icon: ShieldCheckIcon,
    color: 'text-green-500',
  },
  {
    id: 'top',
    name: 'Top Profesional',
    description: 'Entre los mejores de la plataforma',
    icon: TrophyIcon,
    color: 'text-orange-500',
  },
]

interface ProfileBadgesProps {
  earnedBadges?: string[] // IDs de badges ganados
  compact?: boolean
}

export function ProfileBadges({ earnedBadges = ['verified'], compact = false }: ProfileBadgesProps) {
  const badges = BADGES.filter((b) => earnedBadges.includes(b.id))

  if (badges.length === 0) return null

  if (compact) {
    return (
      <div className="flex gap-1">
        {badges.map((badge) => {
          const Icon = badge.icon
          return (
            <div key={badge.id} title={badge.name} className={cn('cursor-help', badge.color)}>
              <Icon className="h-5 w-5" />
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
      <h3 className="mb-3 font-semibold text-neutral-900 dark:text-white">Insignias</h3>
      <div className="flex flex-wrap gap-2">
        {badges.map((badge) => {
          const Icon = badge.icon
          return (
            <div
              key={badge.id}
              className="group relative flex items-center gap-2 rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-700/50"
            >
              <Icon className={cn('h-5 w-5', badge.color)} />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{badge.name}</span>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 rounded-lg bg-neutral-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block dark:bg-neutral-700">
                {badge.description}
                <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-neutral-900 dark:bg-neutral-700" />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

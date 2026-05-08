/**
 * AboutSection
 *
 * Replaces the old Bio + GeneralInfo split. Renders the bio at the top of the
 * card and a compact list of key facts (residence, birth date, relationship
 * status) underneath. Stays minimalistic — no card-in-card, no oversized
 * icon tiles. Hidden for visitors when there is nothing to show.
 */

import {
  CalendarIcon,
  HeartIcon,
  MapPinIcon,
} from '@/components/icons/heroicons-shim'
import type { ComponentType, SVGProps } from 'react'
import type { UserProfile } from '../../../interfaces/profile.interfaces'
import ProfileSection from './ProfileSection'

interface AboutSectionProps {
  user: UserProfile
  isOwner: boolean
  onEdit?: () => void
}

const relationshipLabels: Record<string, string> = {
  SINGLE: 'Soltero/a',
  IN_RELATIONSHIP: 'En una relación',
  MARRIED: 'Casado/a',
  DIVORCED: 'Divorciado/a',
  WIDOWED: 'Viudo/a',
}

function formatBirthDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}

type Fact = {
  Icon: ComponentType<SVGProps<SVGSVGElement> & { className?: string }>
  label: string
}

function Row({ Icon, label }: Fact) {
  return (
    <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
      <Icon className="size-4 shrink-0 text-gray-400 dark:text-gray-500" aria-hidden="true" />
      <span className="min-w-0 truncate">{label}</span>
    </div>
  )
}

export default function AboutSection({ user, isOwner, onEdit }: AboutSectionProps) {
  const bio = user.bio?.trim() || null
  const residence = [user.residenceCity, user.residenceCountry].filter(Boolean).join(', ') || null
  const birthDateLabel = user.birthDate ? formatBirthDate(user.birthDate) : null
  const relationshipLabel = user.relationshipStatus ? relationshipLabels[user.relationshipStatus] : null

  const hasAny = !!(bio || residence || birthDateLabel || relationshipLabel)

  if (!hasAny && !isOwner) return null

  return (
    <ProfileSection title="Acerca de" isOwner={isOwner} onEdit={onEdit}>
      {hasAny ? (
        <div className="space-y-3">
          {bio && (
            <p className="text-sm leading-relaxed text-gray-700 wrap-break-word dark:text-gray-300">{bio}</p>
          )}
          {(residence || birthDateLabel || relationshipLabel) && (
            <div className="space-y-2 pt-1">
              {residence && <Row Icon={MapPinIcon} label={`Vive en ${residence}`} />}
              {birthDateLabel && <Row Icon={CalendarIcon} label={birthDateLabel} />}
              {relationshipLabel && <Row Icon={HeartIcon} label={relationshipLabel} />}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Agrega una breve descripción y datos personales para que otros te conozcan.
        </p>
      )}
    </ProfileSection>
  )
}

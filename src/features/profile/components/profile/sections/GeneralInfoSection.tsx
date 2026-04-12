/**
 * GeneralInfoSection Component
 * 
 * Información general del usuario (ubicación, fecha de nacimiento, etc.)
 */

import {
  HomeIcon,
  MapPinIcon,
  HeartIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'
import type { UserProfile } from '../../../interfaces/profile.interfaces'
import ProfileSection from './ProfileSection'
import InfoItem from './InfoItem'

interface GeneralInfoSectionProps {
  user: UserProfile
  isOwner?: boolean
  onEdit?: () => void
}

export default function GeneralInfoSection({ user, isOwner, onEdit }: GeneralInfoSectionProps) {
  const has = (str?: string | null) => !!str?.trim()

  const hasResidence = has(user.residenceCity) || has(user.residenceState) || has(user.residenceCountry)
  const hasBirthplace = has(user.birthCity) || has(user.birthState) || has(user.birthCountry)
  
  const residenceLocation = [user.residenceCity, user.residenceState, user.residenceCountry]
    .filter(Boolean)
    .join(', ')
  
  const birthLocation = [user.birthCity, user.birthState, user.birthCountry]
    .filter(Boolean)
    .join(', ')

  const getGenderLabel = (gender?: string) => {
    if (!gender) return null
    return gender === 'MALE' ? 'Masculino' : gender === 'FEMALE' ? 'Femenino' : 'Otro'
  }

  const getRelationshipLabel = (status?: string) => {
    if (!status) return null
    const labels: Record<string, string> = {
      SINGLE: 'Soltero/a',
      IN_RELATIONSHIP: 'En una relación',
      MARRIED: 'Casado/a',
      DIVORCED: 'Divorciado/a',
      WIDOWED: 'Viudo/a',
    }
    return labels[status] || status
  }

  const formattedBirthdate = user.birthDate
    ? new Date(user.birthDate).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  return (
    <ProfileSection title="Información general" isOwner={isOwner} onEdit={onEdit}>
      <div className="space-y-4">
        {hasResidence && (
          <InfoItem icon={MapPinIcon} label="Vive en" value={residenceLocation} />
        )}
        
        {hasBirthplace && (
          <InfoItem icon={HomeIcon} label="De" value={birthLocation} />
        )}
        
        {formattedBirthdate && (
          <InfoItem icon={CalendarIcon} label="Fecha de nacimiento" value={formattedBirthdate} />
        )}
        
        {user.gender && (
          <InfoItem icon={HeartIcon} label="Género" value={getGenderLabel(user.gender)!} />
        )}

        {user.relationshipStatus && (
          <InfoItem icon={HeartIcon} label="Estado civil" value={getRelationshipLabel(user.relationshipStatus)!} />
        )}
      </div>
    </ProfileSection>
  )
}

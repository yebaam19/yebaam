/**
 * BioSection Component
 * 
 * Sección de biografía del perfil
 */

import type { UserProfile } from '../../../interfaces/profile.interfaces'
import ProfileSection from './ProfileSection'

interface BioSectionProps {
  user: UserProfile
  isOwner: boolean
  onEdit?: () => void
}

export default function BioSection({ user, isOwner, onEdit }: BioSectionProps) {
  const hasBio = !!user.bio?.trim()

  return (
    <ProfileSection title="Acerca de mí" isOwner={isOwner} onEdit={onEdit}>
      {hasBio ? (
        <p className="text-foreground leading-relaxed">{user.bio}</p>
      ) : (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">
            {isOwner 
              ? 'Aún no has agregado una descripción sobre ti' 
              : `${user.firstName} aún no ha agregado una descripción`
            }
          </p>
        </div>
      )}
    </ProfileSection>
  )
}

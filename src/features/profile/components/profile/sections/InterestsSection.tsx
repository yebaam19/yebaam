/**
 * InterestsSection Component
 * 
 * Intereses culturales y gustos del usuario
 */

import {
  TvIcon,
  MusicalNoteIcon,
  FilmIcon,
  BookOpenIcon,
  DevicePhoneMobileIcon,
} from '@/components/icons/heroicons-shim'
import type { UserProfile } from '../../../interfaces/profile.interfaces'
import ProfileSection from './ProfileSection'

interface InterestsSectionProps {
  user: UserProfile
  isOwner: boolean
  onEdit?: () => void
}

export default function InterestsSection({ user, isOwner, onEdit }: InterestsSectionProps) {
  const has = (str?: string | null) => !!str?.trim()

  const culturalInterests = [
    { key: 'tvShows', label: 'Series favoritas', value: user.tvShows, icon: TvIcon },
    { key: 'musicBands', label: 'Bandas / Artistas favoritos', value: user.musicBands, icon: MusicalNoteIcon },
    { key: 'favoriteMovies', label: 'Películas favoritas', value: user.favoriteMovies, icon: FilmIcon },
    { key: 'favoriteBooks', label: 'Libros favoritos', value: user.favoriteBooks, icon: BookOpenIcon },
    { key: 'favoriteGames', label: 'Videojuegos favoritos', value: user.favoriteGames, icon: DevicePhoneMobileIcon },
  ].filter((item) => has(item.value))

  return (
    <ProfileSection title="Intereses y gustos" isOwner={isOwner} onEdit={onEdit}>
      {culturalInterests.length > 0 ? (
        <div className="space-y-6">
          {culturalInterests.map(({ key, label, value, icon: Icon }) => (
            <div key={key} className="border-b border-border last:border-0 pb-4 last:pb-0">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-5 h-5 text-primary" />
                <h6 className="font-semibold">{label}</h6>
              </div>
              <p className="text-muted-foreground leading-relaxed">{value}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center">
          <p className="text-muted-foreground">
            {isOwner ? 'No has agregado intereses.' : 'Este usuario no ha agregado intereses.'}
          </p>
        </div>
      )}
    </ProfileSection>
  )
}

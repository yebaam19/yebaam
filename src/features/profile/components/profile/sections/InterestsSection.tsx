/**
 * InterestsSection Component
 *
 * Renders the user's interests as tag chips. Source of truth is the
 * `profiles.interests` text[] column (the only column actually persisted by
 * InterestsDialog). Legacy free-text fields (tvShows / musicBands /
 * favoriteMovies / favoriteBooks / favoriteGames) are still rendered as
 * grouped sections IF the backend ever populates them, but they are not the
 * primary source.
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
  const tags = (user.interests ?? []).filter(Boolean)

  const groupedFields = [
    { key: 'tvShows', label: 'Series favoritas', value: user.tvShows, icon: TvIcon },
    { key: 'musicBands', label: 'Bandas / Artistas favoritos', value: user.musicBands, icon: MusicalNoteIcon },
    { key: 'favoriteMovies', label: 'Películas favoritas', value: user.favoriteMovies, icon: FilmIcon },
    { key: 'favoriteBooks', label: 'Libros favoritos', value: user.favoriteBooks, icon: BookOpenIcon },
    { key: 'favoriteGames', label: 'Videojuegos favoritos', value: user.favoriteGames, icon: DevicePhoneMobileIcon },
  ].filter((item) => has(item.value))

  const isEmpty = tags.length === 0 && groupedFields.length === 0

  return (
    <ProfileSection title="Intereses y gustos" isOwner={isOwner} onEdit={onEdit}>
      {isEmpty ? (
        <div className="py-6 text-center">
          <p className="text-muted-foreground">
            {isOwner ? 'No has agregado intereses.' : 'Este usuario no ha agregado intereses.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {groupedFields.length > 0 && (
            <div className="space-y-6">
              {groupedFields.map(({ key, label, value, icon: Icon }) => (
                <div key={key} className="border-b border-border last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5 text-primary" />
                    <h6 className="font-semibold">{label}</h6>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </ProfileSection>
  )
}

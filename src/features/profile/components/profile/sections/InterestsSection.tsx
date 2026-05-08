/**
 * InterestsSection
 *
 * "Intereses y favoritos" card. Renders the free-form `interests` tag list at
 * the top, followed by labelled chip groups for each favorite (movies, books,
 * games, series, music). All five favorite arrays are persisted to dedicated
 * `text[]` columns on `profiles`.
 */

import {
  BookOpenIcon,
  DevicePhoneMobileIcon,
  FilmIcon,
  MusicalNoteIcon,
  TvIcon,
} from '@/components/icons/heroicons-shim'
import type { ComponentType, SVGProps } from 'react'
import type { UserProfile } from '../../../interfaces/profile.interfaces'
import ProfileSection from './ProfileSection'

interface InterestsSectionProps {
  user: UserProfile
  isOwner: boolean
  onEdit?: () => void
}

type Group = {
  key: string
  label: string
  values: string[]
  Icon: ComponentType<SVGProps<SVGSVGElement> & { className?: string }>
}

function Chip({ label, tone = 'accent' }: { label: string; tone?: 'accent' | 'neutral' }) {
  const className =
    tone === 'accent'
      ? 'inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
      : 'inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200'
  return <span className={className}>{label}</span>
}

export default function InterestsSection({ user, isOwner, onEdit }: InterestsSectionProps) {
  const tags = (user.interests ?? []).filter(Boolean)
  const groups: Group[] = [
    { key: 'favoriteMovies', label: 'Películas', values: (user.favoriteMovies ?? []).filter(Boolean), Icon: FilmIcon },
    { key: 'favoriteBooks', label: 'Libros', values: (user.favoriteBooks ?? []).filter(Boolean), Icon: BookOpenIcon },
    { key: 'favoriteGames', label: 'Videojuegos', values: (user.favoriteGames ?? []).filter(Boolean), Icon: DevicePhoneMobileIcon },
    { key: 'favoriteTvShows', label: 'Series', values: (user.favoriteTvShows ?? []).filter(Boolean), Icon: TvIcon },
    { key: 'favoriteMusic', label: 'Música', values: (user.favoriteMusic ?? []).filter(Boolean), Icon: MusicalNoteIcon },
  ].filter((g) => g.values.length > 0)

  const isEmpty = tags.length === 0 && groups.length === 0

  if (isEmpty && !isOwner) return null

  return (
    <ProfileSection title="Intereses y favoritos" isOwner={isOwner} onEdit={onEdit}>
      {isEmpty ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Agrega tus intereses y favoritos para que otros descubran qué disfrutas.
        </p>
      ) : (
        <div className="space-y-4">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Chip key={tag} label={tag} tone="accent" />
              ))}
            </div>
          )}

          {groups.length > 0 && (
            <div className="space-y-3">
              {groups.map(({ key, label, values, Icon }) => (
                <div key={key}>
                  <div className="mb-1.5 flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>{label}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {values.map((v) => (
                      <Chip key={`${key}-${v}`} label={v} tone="neutral" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </ProfileSection>
  )
}

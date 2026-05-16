'use client'

/**
 * UserDetails Component
 *
 * Muestra detalles e información personal del usuario
 */

import {
  AcademicCapIcon,
  BriefcaseIcon,
  CakeIcon,
  HandRaisedIcon,
  HeartIcon,
  HomeIcon,
  LinkIcon,
  MapPinIcon,
  UserIcon,
} from '@/components/icons/heroicons-shim'
import { format } from 'date-fns'
import { es, enUS } from 'date-fns/locale'
import Link from 'next/link'
import type { Route } from 'next'
import { useLocale, useTranslations } from 'next-intl'
import type { ComponentType, ReactNode } from 'react'
import type { UserProfile } from '../../interfaces/profile.interfaces'
import { useProfileStore } from '../../store/profile.store'

type DetailRowProps = {
  icon: ComponentType<{ className?: string }>
  label: string
  value: ReactNode
}

function DetailRow({ icon: Icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gray-500 dark:text-gray-400" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 wrap-break-word">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</span>
        <span className="font-medium text-gray-800 wrap-break-word dark:text-gray-100">{value}</span>
      </div>
    </div>
  )
}

function formatLongDate(date: Date | string, localeCode: string) {
  const dateLocale = localeCode === 'en' ? enUS : es
  const fmt = localeCode === 'en' ? 'MMMM d, yyyy' : "d 'de' MMMM 'de' yyyy"
  return format(new Date(date), fmt, { locale: dateLocale })
}

function formatLocation(...parts: Array<string | null | undefined>) {
  return parts.filter(Boolean).join(', ')
}

interface UserDetailsProps {
  user: UserProfile
  loggedInUserId: string
}

export default function UserDetails({ user }: UserDetailsProps) {
  const t = useTranslations('profile.details')
  const tSidebar = useTranslations('profile.sidebar')
  const locale = useLocale()
  // Usar el perfil actualizado del store si existe, sino usar el de props
  const { currentProfile } = useProfileStore()
  const displayUser = currentProfile && currentProfile.userId === user.userId ? currentProfile : user

  const residenceLocation = formatLocation(
    displayUser.residenceCity,
    displayUser.residenceState,
    displayUser.residenceCountry
  )
  const birthLocation = formatLocation(displayUser.birthCity, displayUser.birthState, displayUser.birthCountry)
  const genderLabel = displayUser.gender
    ? (() => {
        try { return t(`gender_values.${displayUser.gender as 'MALE' | 'FEMALE' | 'OTHER'}`) } catch { return displayUser.gender }
      })()
    : null
  const relationshipLabel = displayUser.relationshipStatus
    ? (() => {
        try { return t(`relationship_values.${displayUser.relationshipStatus as 'SINGLE' | 'IN_RELATIONSHIP' | 'MARRIED' | 'DIVORCED' | 'WIDOWED'}`) } catch { return displayUser.relationshipStatus }
      })()
    : null

  return (
    <div className="h-auto w-full rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
      <h2 className="mb-5 text-lg font-bold text-gray-900 dark:text-white">{tSidebar('details')}</h2>

      {/* Details List */}
      <div className="flex flex-col gap-4">
        {/* Birthdate */}
        {displayUser.birthDate && (
          <DetailRow icon={CakeIcon} label={t('birthday')} value={formatLongDate(displayUser.birthDate, locale)} />
        )}

        {/* Residence City */}
        {residenceLocation && (
          <DetailRow
            icon={HomeIcon}
            label={t('residenceCity')}
            value={
              displayUser.residenceCity ? (
                <Link
                  href={`/cities/${displayUser.residenceCity.toLowerCase().replace(/\s+/g, '-')}` as Route}
                  className="hover:text-gray-700 hover:underline dark:hover:text-gray-200"
                >
                  {residenceLocation}
                </Link>
              ) : (
                residenceLocation
              )
            }
          />
        )}

        {/* Birth City */}
        {birthLocation && (
          <DetailRow
            icon={MapPinIcon}
            label={t('birthCity')}
            value={
              displayUser.birthCity ? (
                <Link
                  href={`/cities/${displayUser.birthCity.toLowerCase().replace(/\s+/g, '-')}` as Route}
                  className="hover:text-gray-700 hover:underline dark:hover:text-gray-200"
                >
                  {birthLocation}
                </Link>
              ) : (
                birthLocation
              )
            }
          />
        )}

        {/* Relationship Status */}
        {relationshipLabel && <DetailRow icon={HeartIcon} label={t('relationshipStatus')} value={relationshipLabel} />}

        {/* Study Place */}
        {displayUser.studyPlace && (
          <DetailRow icon={AcademicCapIcon} label={t('studyPlace')} value={displayUser.studyPlace} />
        )}

        {/* Work Place */}
        {displayUser.workPlace && (
          <DetailRow icon={BriefcaseIcon} label={t('workPlace')} value={displayUser.workPlace} />
        )}

        {/* Gender */}
        {genderLabel && <DetailRow icon={UserIcon} label={t('gender')} value={genderLabel} />}

        {/* Website */}
        {displayUser.websiteUrl && (
          <DetailRow
            icon={LinkIcon}
            label={t('website')}
            value={
              <a
                href={displayUser.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-700 hover:underline dark:hover:text-gray-200"
              >
                {displayUser.websiteUrl}
              </a>
            }
          />
        )}

        {/* Member Since */}
        <DetailRow icon={HandRaisedIcon} label={t('memberSince')} value={formatLongDate(displayUser.createdAt, locale)} />
      </div>

      <Link
        href={`/${displayUser.username}?tab=acerca-de` as Route}
        className="mt-5 block w-full rounded-lg bg-gray-100 px-4 py-3 text-center text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 dark:focus-visible:ring-offset-gray-800"
      >
        {tSidebar('viewAllInfo')}
      </Link>
    </div>
  )
}

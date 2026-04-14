'use client'

/**
 * UserDetails Component
 *
 * Muestra detalles e información personal del usuario
 */

import { Divider } from '@/ui/divider'
import {
  AcademicCapIcon,
  BriefcaseIcon,
  CakeIcon,
  HandRaisedIcon,
  HeartIcon,
  HomeIcon,
  LinkIcon,
  MapPinIcon,
  PencilIcon,
  UserIcon,
} from '@/components/icons/heroicons-shim'
import { format } from 'date-fns'
import Link from 'next/link'
import { useState } from 'react'
import type { UserProfile } from '../../interfaces/profile.interfaces'
import { useProfileStore } from '../../store/profile.store'
import PersonalDialog from '../dialogs/PersonalDialog'
import type { Route } from 'next';

interface UserDetailsProps {
  user: UserProfile
  loggedInUserId: string
}

export default function UserDetails({ user, loggedInUserId }: UserDetailsProps) {
  const [personalOpen, setPersonalOpen] = useState(false)

  // Usar el perfil actualizado del store si existe, sino usar el de props
  const { currentProfile } = useProfileStore()
  const displayUser = currentProfile || user

  const isOwner = displayUser.userId === loggedInUserId

  return (
    <div className="h-auto w-full rounded-2xl bg-white p-5 shadow-sm dark:bg-gray-800">
      {/* Header with Edit Button */}
      <div className="mb-3">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Detalles</h2>
          {isOwner && (
            <button
              onClick={() => setPersonalOpen(true)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
              title="Editar información personal"
            >
              <PencilIcon width={20} height={20} />
            </button>
          )}
        </div>

        {/* Bio */}
        {displayUser.bio && (
          <div className="text-foreground text-sm wrap-break-word whitespace-pre-line">
            <div className="overflow-hidden wrap-break-word whitespace-pre-line">{displayUser.bio}</div>
          </div>
        )}
      </div>

      <Divider />

      {/* Details List */}
      <div className="my-3 flex flex-col gap-3">
        {/* Birthdate */}
        {displayUser.birthDate && (
          <div className="text-foreground flex items-center gap-2 text-sm">
            <CakeIcon className="h-4 w-4" />
            <span className="font-semibold">Cumpleaños:</span>
            <span>{format(new Date(displayUser.birthDate), 'MMM d, yyyy')}</span>
          </div>
        )}

        {/* Residence City */}
        {displayUser.residenceCity && (
          <div className="text-foreground flex items-center gap-2 text-sm">
            <HomeIcon className="h-4 w-4" />
            <span className="font-semibold">Ciudad de residencia:</span>
            <Link
              href={`/cities/${displayUser.residenceCity.toLowerCase().replace(/\s+/g, '-')}` as Route}
              className="text-primary hover:text-primary/80 hover:underline"
            >
              {displayUser.residenceCity}
            </Link>
          </div>
        )}

        {/* Birth City */}
        {displayUser.birthCity && (
          <div className="text-foreground flex items-center gap-2 text-sm">
            <MapPinIcon className="h-4 w-4" />
            <span className="font-semibold">Ciudad de origen:</span>
            <Link
              href={`/cities/${displayUser.birthCity.toLowerCase().replace(/\s+/g, '-')}` as Route}
              className="text-primary hover:text-primary/80 hover:underline"
            >
              {displayUser.birthCity}
            </Link>
          </div>
        )}

        {/* Relationship Status */}
        {displayUser.relationshipStatus && (
          <div className="text-foreground flex items-center gap-2 text-sm">
            <HeartIcon className="h-4 w-4" />
            <span className="font-semibold">Estado civil:</span>
            <span>{displayUser.relationshipStatus}</span>
          </div>
        )}

        {/* Study Place */}
        {displayUser.studyPlace && (
          <div className="text-foreground flex items-center gap-2 text-sm">
            <AcademicCapIcon className="h-4 w-4" />
            <span className="font-semibold">Lugar de estudio:</span>
            <span>{displayUser.studyPlace}</span>
          </div>
        )}

        {/* Work Place */}
        {displayUser.workPlace && (
          <div className="text-foreground flex items-center gap-2 text-sm">
            <BriefcaseIcon className="h-4 w-4" />
            <span className="font-semibold">Lugar de trabajo:</span>
            <span>{displayUser.workPlace}</span>
          </div>
        )}

        {/* Gender */}
        {displayUser.gender && (
          <div className="text-foreground flex items-center gap-2 text-sm">
            <UserIcon className="h-4 w-4" />
            <span className="font-semibold">Género:</span>
            <span>{displayUser.gender}</span>
          </div>
        )}

        {/* Website */}
        {displayUser.websiteUrl && (
          <div className="text-foreground flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            <a
              href={displayUser.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium hover:underline"
            >
              {displayUser.websiteUrl}
            </a>
          </div>
        )}

        {/* Member Since */}
        <div className="text-foreground flex items-center gap-2 text-sm">
          <HandRaisedIcon className="h-4 w-4" />
          <span className="font-semibold">Miembro desde:</span>
          <span className="text-foreground text-sm">{format(new Date(displayUser.createdAt), 'MMM d, yyyy')}</span>
        </div>
      </div>

      {/* Diálogo de edición */}
      <PersonalDialog user={displayUser} open={personalOpen} onOpenChange={setPersonalOpen} />
    </div>
  )
}

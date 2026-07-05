'use client'

import { UserGroupIcon } from '@/components/icons/heroicons-shim'
import Image from 'next/image'
import Link from 'next/link'
import { resolveImageRef } from '@/lib/media/urls'
import { useMyClubs } from '@/features/clubs/hooks/useClubs'
import type { UserProfile } from '../../../interfaces/profile.interfaces'
import ProfileSection from './ProfileSection'

interface ClubsSectionProps {
  user: UserProfile
  isOwner: boolean
}

export default function ClubsSection({ user, isOwner }: ClubsSectionProps) {
  const { data: myClubs, isLoading } = useMyClubs()
  
  // Mostrar loading state
  if (isLoading) {
    return (
      <ProfileSection 
        title="Clubes" 
        actionLabel="Ver todos" 
        actionHref="/feed/clubs"
      >
        <div className="text-center py-8">
          <div className="animate-pulse flex space-x-4">
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </ProfileSection>
    )
  }

  // Si no tiene clubes
  if (!myClubs || myClubs.length === 0) {
    return (
      <ProfileSection 
        title="Clubes" 
        actionLabel="Ver todos" 
        actionHref="/feed/clubs"
      >
        <div className="text-center py-8">
          <UserGroupIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            {isOwner 
              ? 'No eres miembro de ningún club aún' 
              : 'Este usuario no es miembro de ningún club'
            }
          </p>
        </div>
      </ProfileSection>
    )
  }

  // Mostrar primeros 3 clubes
  const displayClubs = myClubs.slice(0, 3)

  return (
    <ProfileSection 
      title="Clubes" 
      actionLabel="Ver todos" 
      actionHref="/feed/clubs"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayClubs.map((club) => (
          <Link 
            key={club.id} 
            href={`/feed/clubs/${club.slug}`}
            className="group"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-200 dark:border-gray-700">
              {/* Cover Image */}
              <div className="relative h-20 bg-linear-to-r from-blue-500 to-purple-500">
                {club.coverImageUrl && (
                  <Image
                    src={resolveImageRef(club.coverImageUrl, 'cover') ?? club.coverImageUrl}
                    alt={club.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                    unoptimized
                  />
                )}
              </div>
              
              {/* Content */}
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  {/* Profile Image */}
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border-2 border-white dark:border-gray-800">
                    {club.profileImageUrl ? (
                      <Image
                        src={resolveImageRef(club.profileImageUrl, 'avatar') ?? club.profileImageUrl}
                        alt={club.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-blue-400 to-purple-500">
                        <span className="text-white font-bold text-sm">
                          {club.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Name */}
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {club.name}
                  </h3>
                </div>
                
                {/* Stats */}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {club.stats?.membersCount || 0} miembros
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </ProfileSection>
  )
}

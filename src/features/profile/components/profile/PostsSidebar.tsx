'use client'

/**
 * PostsSidebar Component
 *
 * Sidebar que muestra información del usuario en la vista de posts
 */

import type { UserProfile } from '../../interfaces/profile.interfaces'
import UserDetails from './UserDetails'

interface PostsSidebarProps {
  user: UserProfile
  loggedInUserId: string
}

export default function PostsSidebar({ user, loggedInUserId }: PostsSidebarProps) {
  return (
    <div className="w-full space-y-5">
      {/* TODO: Agregar CompleteProfileWidget si es el perfil propio */}
      <UserDetails user={user} loggedInUserId={loggedInUserId} />
    </div>
  )
}

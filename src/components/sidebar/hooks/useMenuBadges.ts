'use client'

import { useEffect, useState } from 'react'

// Module-scoped cache: the Sidebar remounts when navigating between sections,
// and each remount used to refetch the admin count. One fetch per page load is
// enough — module scope resets on a hard reload, which is the refresh path.
let adminCountP: Promise<number> | null = null

function fetchAdminCount(): Promise<number> {
  if (!adminCountP) {
    adminCountP = fetch('/api/businesses/admin-count')
      .then((r) => r.json())
      .then((d) => d.count ?? 0)
      .catch(() => 0)
  }
  return adminCountP
}

export function useMenuBadges() {
  // Social counters — replace with real subscription hooks when implemented
  const friendRequests = 0
  const unreadMessages = 0
  const groupInvites = 0

  const [myBusinessesCount, setMyBusinessesCount] = useState(0)

  useEffect(() => {
    fetchAdminCount().then((count) => setMyBusinessesCount(count))
  }, [])

  return {
    friendRequests: friendRequests > 0 ? String(friendRequests) : undefined,
    messages: unreadMessages > 0 ? String(unreadMessages) : undefined,
    groupInvites: groupInvites > 0 ? String(groupInvites) : undefined,
    myBusinessesCount,
  }
}

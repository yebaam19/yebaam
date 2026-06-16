'use client'

import { useEffect, useState } from 'react'

export function useMenuBadges() {
  // Social counters — replace with real subscription hooks when implemented
  const friendRequests = 0
  const unreadMessages = 0
  const groupInvites = 0

  const [myBusinessesCount, setMyBusinessesCount] = useState(0)

  useEffect(() => {
    fetch('/api/businesses/admin-count')
      .then((r) => r.json())
      .then((d) => setMyBusinessesCount(d.count ?? 0))
      .catch(() => {})
  }, [])

  return {
    friendRequests: friendRequests > 0 ? String(friendRequests) : undefined,
    messages: unreadMessages > 0 ? String(unreadMessages) : undefined,
    groupInvites: groupInvites > 0 ? String(groupInvites) : undefined,
    myBusinessesCount,
  }
}

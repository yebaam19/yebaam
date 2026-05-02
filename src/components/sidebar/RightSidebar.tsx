'use client'

import ChatBubble from '@/components/chat/ChatBubble'
import { useFriendships } from '@/features/friendships/hooks/useFriendships'
import { usePresenceStore } from '@/features/presence/store/presence.store'
import { FriendRequestsCard } from '@/features/friendships/components/FriendRequestsCard'
import { SuggestedGroupsCard } from '@/features/communities/components/SuggestedGroupsCard'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import BirthdaysSection from './BirthdaysSection'
import OnlineContacts from './OnlineContacts'
import { PortalAd } from './PortalAd'
import { InviteFriends } from './friends/InviteFriends'
import { resolveRailExtras } from './rail-registry'

interface OnlineContact {
  id: string
  name: string
  username: string
  avatar: string
  isOnline: boolean
}

interface OpenChat {
  contactId: string
  contactName: string
  contactAvatar: string
  isOnline: boolean
}

/**
 * Default rail rendered on every route. Route-specific blocks (registered in
 * `rail-registry.tsx`) appear ABOVE this in `<RightSidebar />`.
 */
function DefaultRail() {
  const { friends, fetchSuggestions } = useFriendships()
  const isUserOnline = usePresenceStore((state) => state.isUserOnline)
  const [openChats, setOpenChats] = useState<OpenChat[]>([])

  useEffect(() => {
    fetchSuggestions(6)
  }, [fetchSuggestions])

  const handleOpenChat = (contact: OnlineContact) => {
    if (openChats.some((chat) => chat.contactId === contact.id)) return
    if (openChats.length >= 3) setOpenChats((prev) => prev.slice(1))
    setOpenChats((prev) => [
      ...prev,
      {
        contactId: contact.id,
        contactName: contact.name,
        contactAvatar: contact.avatar,
        isOnline: contact.isOnline,
      },
    ])
  }

  const handleCloseChat = (contactId: string) => {
    setOpenChats((prev) => prev.filter((chat) => chat.contactId !== contactId))
  }

  const onlineContacts: OnlineContact[] = friends.map((friend) => {
    const name =
      friend.firstName && friend.lastName ? `${friend.firstName} ${friend.lastName}` : friend.username
    return {
      id: friend.friendId,
      name,
      username: friend.username,
      avatar: friend.avatar || '',
      isOnline: isUserOnline(friend.friendId),
    }
  })

  return (
    <>
      <InviteFriends />
      <FriendRequestsCard />
      <SuggestedGroupsCard />
      <PortalAd />
      <BirthdaysSection birthdays={[]} />
      <OnlineContacts contacts={onlineContacts} onContactClick={handleOpenChat} />

      {openChats.map((chat, index) => (
        <ChatBubble
          key={chat.contactId}
          contactId={chat.contactId}
          contactName={chat.contactName}
          contactAvatar={chat.contactAvatar}
          isOnline={chat.isOnline}
          onClose={() => handleCloseChat(chat.contactId)}
          position={index}
        />
      ))}
    </>
  )
}

export default function RightSidebar() {
  const pathname = usePathname()
  const extras = resolveRailExtras(pathname)

  return (
    <aside className="h-full min-h-0 w-full min-w-0 overflow-y-auto overflow-x-hidden border-l border-neutral-200 bg-white p-3 sm:p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="min-w-0 space-y-6">
        {extras.map((Block, i) => (
          <Block key={`extra-${i}`} />
        ))}

        <DefaultRail />

        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link href="/privacidad" className="hover:underline">
              Privacidad
            </Link>
            <span>·</span>
            <Link href="/terminos" className="hover:underline">
              Condiciones
            </Link>
            <span>·</span>
            <Link href="/publicidad" className="hover:underline">
              Publicidad
            </Link>
            <span>·</span>
            <Link href="/cookies" className="hover:underline">
              Cookies
            </Link>
            <span>·</span>
            <Link href={'/mas' as never} className="hover:underline">
              Más
            </Link>
            <span>·</span>
            <span>© {new Date().getFullYear()} Yebaam</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

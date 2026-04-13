'use client'

import ChatBubble from '@/components/chat/ChatBubble'
import { useFriendships } from '@/features/friendships/hooks/useFriendships'
import { usePresenceStore } from '@/features/presence/store/presence.store'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import BirthdaysSection from './BirthdaysSection'
import FriendSuggestions from './FriendSuggestions'
import OnlineContacts from './OnlineContacts'
import { PortalAd } from './PortalAd'

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

export default function RightSidebar() {
  const { friends, suggestions, fetchSuggestions, sendFriendRequest } = useFriendships()
  const isUserOnline = usePresenceStore((state) => state.isUserOnline)
  const [openChats, setOpenChats] = useState<OpenChat[]>([])

  // Cargar sugerencias de amigos al montar el componente
  useEffect(() => {
    fetchSuggestions(3)
  }, [fetchSuggestions])

  // Función para abrir chat
  const handleOpenChat = (contact: OnlineContact) => {
    if (openChats.some((chat) => chat.contactId === contact.id)) {
      return
    }

    if (openChats.length >= 3) {
      setOpenChats((prev) => prev.slice(1))
    }

    const newChat: OpenChat = {
      contactId: contact.id,
      contactName: contact.name,
      contactAvatar: contact.avatar,
      isOnline: contact.isOnline,
    }

    setOpenChats((prev) => [...prev, newChat])
  }

  // Función para cerrar chat
  const handleCloseChat = (contactId: string) => {
    setOpenChats((prev) => prev.filter((chat) => chat.contactId !== contactId))
  }

  // Función para enviar solicitud de amistad
  const handleSendFriendRequest = async (userId: string) => {
    await sendFriendRequest({ addresseeId: userId })
    fetchSuggestions(3)
  }

  // Mapear amigos a contactos con estado online
  const onlineContacts: OnlineContact[] = friends.map((friend) => {
    const name = friend.firstName && friend.lastName ? `${friend.firstName} ${friend.lastName}` : friend.username

    return {
      id: friend.friendId,
      name,
      username: friend.username,
      avatar: friend.avatar || '',
      isOnline: isUserOnline(friend.friendId),
    }
  })

  const friendSuggestions = suggestions.map((suggestion) => ({
    id: suggestion.id,
    name: `${suggestion.firstName} ${suggestion.lastName}`,
    avatar: suggestion.avatar || '',
    mutualFriends: suggestion.mutualFriends,
    username: suggestion.username,
  }))

  const birthdays: any[] = []

  return (
    <aside className="h-full min-h-0 w-full min-w-0 overflow-y-auto overflow-x-hidden border-l border-neutral-200 bg-white p-3 sm:p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="min-w-0 space-y-6">
        {/* Sugerencias de Amigos */}
        <FriendSuggestions suggestions={friendSuggestions} onSendRequest={handleSendFriendRequest} />

        {/* Cumpleaños */}
        <BirthdaysSection birthdays={birthdays} />

        {/* Grupos Sugeridos */}
        {/* <SuggestedGroups groups={suggestedGroups} /> */}

        {/* Contactos Online */}
        <OnlineContacts contacts={onlineContacts} onContactClick={handleOpenChat} />

        {/* Sponsored / Publicidad */}
        <PortalAd />

        {/* Footer Links */}
        <div className="text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex flex-wrap gap-2">
            <Link href="/privacidad" className="hover:underline">
              Privacidad
            </Link>
            <span>·</span>
            <Link href="/terminos" className="hover:underline">
              Términos
            </Link>
            <span>·</span>
            <Link href="/publicidad" className="hover:underline">
              Publicidad
            </Link>
            <span>·</span>
            <Link href="/cookies" className="hover:underline">
              Cookies
            </Link>
          </div>
          <p className="mt-2">yebaam © 2025</p>
        </div>
      </div>

      {/* Chat Bubbles */}
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
    </aside>
  )
}

/**
 * useFriendRequestDetail
 * 
 * Hook personalizado para manejar el modal de detalle de solicitud de amistad
 */

'use client';

import { useState } from 'react';

export function useFriendRequestDetail() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentFriendshipId, setCurrentFriendshipId] = useState<string | null>(null);

  const openModal = (friendshipId: string) => {
    setCurrentFriendshipId(friendshipId);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    // Pequeño delay antes de limpiar el ID para evitar flickering
    setTimeout(() => {
      setCurrentFriendshipId(null);
    }, 300);
  };

  return {
    isOpen,
    friendshipId: currentFriendshipId,
    openModal,
    closeModal,
  };
}

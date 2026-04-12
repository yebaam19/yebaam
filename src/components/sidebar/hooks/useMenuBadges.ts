'use client'

/**
 * Hook para obtener los conteos de badges del menú
 * Centraliza todos los contadores dinámicos para la red social
 */
export function useMenuBadges() {
  // TODO: Reemplazar con datos reales del backend
  
  // Conteo de solicitudes de amistad pendientes
  const friendRequests = 0
  
  // Conteo de mensajes no leídos
  const unreadMessages = 0
  
  // Conteo de invitaciones a grupos
  const groupInvites = 0
  
  // Conteo de notificaciones
  const notifications = 0

  return {
    // Badges para red social
    friendRequests: friendRequests > 0 ? friendRequests.toString() : undefined,
    messages: unreadMessages > 0 ? unreadMessages.toString() : undefined,
    groupInvites: groupInvites > 0 ? groupInvites.toString() : undefined,
    notifications: notifications > 0 ? notifications.toString() : undefined,
  }
}

/**
 * Presence Store
 * 
 * Store global de Zustand para gestionar la presencia de usuarios en tiempo real.
 * 
 * Responsabilidades:
 * - Estado online/offline de usuarios
 * - Sincronización con eventos de WebSocket
 * - Actualización en tiempo real de presencia
 */

'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

type UserStatus = 'online' | 'away' | 'busy' | 'offline';

interface UserPresence {
  userId: string;
  status: UserStatus;
  lastSeenAt?: Date;
}

interface PresenceState {
  // Estado
  onlineUserIds: Set<string>;
  userPresences: Map<string, UserPresence>;
  isInitialized: boolean;
  
  // Acciones
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  setUserStatus: (userId: string, status: UserStatus) => void;
  setMultipleOnline: (userIds: string[]) => void;
  isUserOnline: (userId: string) => boolean;
  getUserStatus: (userId: string) => UserStatus;
  
  // Inicialización
  initialize: (onlineUserIds: string[]) => void;
  reset: () => void;
}

export const usePresenceStore = create<PresenceState>()(
  devtools(
    (set, get) => ({
      // Estado inicial
      onlineUserIds: new Set<string>(),
      userPresences: new Map<string, UserPresence>(),
      isInitialized: false,

      // Marcar usuario como online
      setUserOnline: (userId: string) => {
        set((state) => {
          const newOnlineUserIds = new Set(state.onlineUserIds);
          newOnlineUserIds.add(userId);

          const newPresences = new Map(state.userPresences);
          newPresences.set(userId, {
            userId,
            status: 'online',
            lastSeenAt: new Date(),
          });

          return {
            onlineUserIds: newOnlineUserIds,
            userPresences: newPresences,
          };
        });
      },

      // Marcar usuario como offline
      setUserOffline: (userId: string) => {
        set((state) => {
          const newOnlineUserIds = new Set(state.onlineUserIds);
          newOnlineUserIds.delete(userId);

          const newPresences = new Map(state.userPresences);
          const presence = newPresences.get(userId);
          if (presence) {
            newPresences.set(userId, {
              ...presence,
              status: 'offline',
              lastSeenAt: new Date(),
            });
          }

          return {
            onlineUserIds: newOnlineUserIds,
            userPresences: newPresences,
          };
        });
      },

      // Cambiar estado del usuario
      setUserStatus: (userId: string, status: UserStatus) => {
        set((state) => {
          const newPresences = new Map(state.userPresences);
          const presence = newPresences.get(userId) || { userId, status };
          
          newPresences.set(userId, {
            ...presence,
            status,
            lastSeenAt: new Date(),
          });

          // Si el estado es online, agregarlo al set
          const newOnlineUserIds = new Set(state.onlineUserIds);
          if (status === 'online') {
            newOnlineUserIds.add(userId);
          } else {
            newOnlineUserIds.delete(userId);
          }

          return {
            onlineUserIds: newOnlineUserIds,
            userPresences: newPresences,
          };
        });
      },

      // Inicializar con múltiples usuarios online
      setMultipleOnline: (userIds: string[]) => {
        set((state) => {
          const newOnlineUserIds = new Set(state.onlineUserIds);
          const newPresences = new Map(state.userPresences);

          userIds.forEach((userId) => {
            newOnlineUserIds.add(userId);
            newPresences.set(userId, {
              userId,
              status: 'online',
              lastSeenAt: new Date(),
            });
          });

          return {
            onlineUserIds: newOnlineUserIds,
            userPresences: newPresences,
          };
        });
      },

      // Verificar si usuario está online
      isUserOnline: (userId: string) => {
        return get().onlineUserIds.has(userId);
      },

      // Obtener estado del usuario
      getUserStatus: (userId: string) => {
        const presence = get().userPresences.get(userId);
        return presence?.status || 'offline';
      },

      // Inicializar el store con datos del servidor
      initialize: (onlineUserIds: string[]) => {
        set({
          onlineUserIds: new Set(onlineUserIds),
          userPresences: new Map(
            onlineUserIds.map((userId) => [
              userId,
              { userId, status: 'online', lastSeenAt: new Date() },
            ])
          ),
          isInitialized: true,
        });
      },

      // Resetear el store
      reset: () => {
        set({
          onlineUserIds: new Set<string>(),
          userPresences: new Map<string, UserPresence>(),
          isInitialized: false,
        });
      },
    }),
    { name: 'PresenceStore' }
  )
);

import { useState, useEffect } from 'react';
import { useSocket } from '@/providers/socket-provider';
import { ALL_SOCKET_EVENTS, SAMPLE_PAYLOADS } from '@/config/socket-events';
import type { ReceivedEvent } from '@/components/socket-test';

export function useSocketTestEvents() {
  const { postsSocket, usersSocket } = useSocket();
  const [events, setEvents] = useState<ReceivedEvent[]>([]);
  const [connectedUsers, setConnectedUsers] = useState<number>(0);

  useEffect(() => {
    if (!postsSocket && !usersSocket) return;

    // Separar eventos por namespace
    const postsEvents = ALL_SOCKET_EVENTS.filter(e => e.category === 'posts');
    const usersEvents = ALL_SOCKET_EVENTS.filter(e => 
      e.category === 'users' || e.category === 'friends' || e.category === 'typing' || e.category === 'rooms'
    );
    const otherEvents = ALL_SOCKET_EVENTS.filter(e => 
      e.category !== 'posts' && 
      e.category !== 'users' && 
      e.category !== 'friends' && 
      e.category !== 'typing' && 
      e.category !== 'rooms'
    );

    const handleEvent = (eventType: string) => (data: any) => {
      const eventConfig = ALL_SOCKET_EVENTS.find((e) => e.name === eventType);
      const newEvent: ReceivedEvent = {
        id: Math.random().toString(36).substring(7),
        type: eventType,
        data,
        timestamp: new Date(),
        from: data?.authorId || data?.userId || data?.from?.id,
        category: eventConfig?.category,
        icon: eventConfig?.icon,
        color: eventConfig?.color,
      };
      setEvents((prev) => [...prev, newEvent]);
    };

    // Registrar eventos del namespace /posts
    if (postsSocket) {
      console.log('[Test] Setting up Posts namespace listeners');
      postsEvents.forEach((event) => {
        postsSocket.on(event.name, handleEvent(event.name));
      });
    }

    // Registrar eventos del namespace /users
    if (usersSocket) {
      console.log('[Test] Setting up Users namespace listeners');
      usersEvents.forEach((event) => {
        usersSocket.on(event.name, handleEvent(event.name));
      });

      // Evento especial para conteo de usuarios en /users namespace
      usersSocket.on('users:count', (count: number) => {
        setConnectedUsers(count);
      });
    }

    // Registrar otros eventos en postsSocket (fallback para eventos sin namespace específico)
    if (postsSocket) {
      console.log('[Test] Setting up fallback socket listeners on /posts');
      otherEvents.forEach((event) => {
        postsSocket.on(event.name, handleEvent(event.name));
      });
    }

    // Cleanup
    return () => {
      if (postsSocket) {
        postsEvents.forEach((event) => {
          postsSocket.off(event.name);
        });
        otherEvents.forEach((event) => {
          postsSocket.off(event.name);
        });
      }
      if (usersSocket) {
        usersEvents.forEach((event) => {
          usersSocket.off(event.name);
        });
        usersSocket.off('users:count');
      }
    };
  }, [postsSocket, usersSocket]);

  const emitTestEvent = (eventName: string) => {
    const eventConfig = ALL_SOCKET_EVENTS.find(e => e.name === eventName);
    const payload = SAMPLE_PAYLOADS[eventName] || {
      test: true,
      timestamp: new Date().toISOString(),
    };

    // Determinar qué socket usar según la categoría del evento
    let targetSocket = postsSocket; // Default fallback
    
    if (eventConfig?.category === 'posts') {
      targetSocket = postsSocket;
      console.log(`Emitiendo evento al namespace /posts: ${eventName}`, payload);
    } else if (
      eventConfig?.category === 'users' || 
      eventConfig?.category === 'friends' || 
      eventConfig?.category === 'typing' || 
      eventConfig?.category === 'rooms'
    ) {
      targetSocket = usersSocket;
      console.log(`Emitiendo evento al namespace /users: ${eventName}`, payload);
    } else {
      console.log(`Emitiendo evento al socket fallback (/posts): ${eventName}`, payload);
    }

    if (!targetSocket) {
      console.error(`No hay socket disponible para el evento: ${eventName}`);
      return;
    }

    targetSocket.emit(eventName, payload);
  };

  const clearEvents = () => {
    setEvents([]);
  };

  return {
    events,
    connectedUsers,
    emitTestEvent,
    clearEvents,
  };
}

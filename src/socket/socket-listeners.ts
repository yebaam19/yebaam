import { Socket } from 'socket.io-client';

const isDev = process.env.NODE_ENV === 'development';

export const attachSocketListeners = (socket: Socket, namespace: string): void => {
  if (isDev) {
    socket.on('connect', () => {
      console.log(` [${namespace}] Connected`);
    });

    socket.on('disconnect', (reason) => {
      if (reason !== 'io client disconnect') {
        console.log(` [${namespace}] Disconnected: ${reason}`);
      }
    });
  }

  // Track connection errors to prevent spam
  let lastErrorTime = 0;
  const ERROR_THROTTLE_MS = 5000; // Only log errors every 5 seconds

  socket.on('connect_error', (error) => {
    const now = Date.now();
    
    // Throttle error logging to prevent infinite loops
    if (now - lastErrorTime < ERROR_THROTTLE_MS) {
      return;
    }
    
    lastErrorTime = now;
    
    // Only log significant errors in development
    if (isDev && error.message !== 'websocket error') {
      console.warn(` [${namespace}] Connection Error:`, error.message);
    }
  });
};

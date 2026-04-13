import type { Socket } from 'socket.io-client';

let cached: Socket | null = null;

export function getStubSocket(): Socket {
  if (cached) return cached;
  const stub: Record<string, unknown> = {};
  const self = stub;
  Object.assign(stub, {
    connected: false,
    disconnected: true,
    id: undefined,
    on: () => self,
    once: () => self,
    off: () => self,
    emit: () => self,
    connect: () => self,
    disconnect: () => self,
    removeAllListeners: () => self,
    listeners: () => [],
    hasListeners: () => false,
    timeout: () => self,
    io: {
      on: () => undefined,
      off: () => undefined,
      engine: { on: () => undefined, off: () => undefined },
    },
  });
  cached = stub as unknown as Socket;
  return cached;
}

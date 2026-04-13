import { Manager, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import { getSocketConfig, getBaseUrl, getAuthToken } from './socket-config';
import { attachSocketListeners } from './socket-listeners';
import { isRealtimeEnabled } from './realtime-flag';
import { getStubSocket } from './stub-socket';

class SocketManager {
  private manager: Manager | null = null;
  private sockets: Map<string, Socket> = new Map();

  private initializeManager(): Manager {
    if (this.manager) return this.manager;

    const baseUrl = getBaseUrl();
    const config = getSocketConfig();

    this.manager = new Manager(baseUrl, config);
    return this.manager;
  }

  getSocket(namespace: string = '/'): Socket {
    if (!namespace || namespace === 'undefined') {
      throw new Error(`Invalid namespace: ${namespace}`);
    }

    if (!isRealtimeEnabled()) {
      return getStubSocket();
    }

    if (this.sockets.has(namespace)) {
      return this.sockets.get(namespace)!;
    }

    const manager = this.initializeManager();
    const token = getAuthToken();

    const socket = manager.socket(namespace, {
      auth: { token: token || '' },
    });

    this.sockets.set(namespace, socket);
    attachSocketListeners(socket, namespace);

    return socket;
  }

  disconnect(namespace: string): void {
    const socket = this.sockets.get(namespace);
    if (socket) {
      socket.disconnect();
      this.sockets.delete(namespace);
    }
  }

  disconnectAll(): void {
    this.sockets.forEach((socket) => socket.disconnect());
    this.sockets.clear();

    if (this.manager) {
      this.manager = null;
    }
  }

  getStatus() {
    const status: Array<{
      namespace: string;
      connected: boolean;
      id: string | undefined;
    }> = [];

    this.sockets.forEach((socket, namespace) => {
      status.push({
        namespace,
        connected: socket.connected,
        id: socket.id,
      });
    });

    return status;
  }

  forceReinitialize(): void {
    this.disconnectAll();
  }

  updateToken(newToken?: string): void {
    this.disconnectAll();
    if (newToken) {
      Cookies.set('accessToken', newToken);
    }
  }
}

export const socketManager = new SocketManager();

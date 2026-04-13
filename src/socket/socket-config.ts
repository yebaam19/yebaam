import { ManagerOptions } from 'socket.io-client';
import Cookies from 'js-cookie';

const isDev = process.env.NODE_ENV === 'development';

export const getSocketConfig = (): Partial<ManagerOptions> => {
  const token = Cookies.get('accessToken')?.replace('Bearer ', '');

  return {
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: isDev ? 10 : 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    withCredentials: true,
    extraHeaders: token ? { Authorization: `Bearer ${token}` } : {},
  };
};

export const getBaseUrl = (): string => {
  return (
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_WS_URL?.replace('ws://', 'http://') ||
    ''
  );
};

export const getAuthToken = (): string | undefined => {
  return Cookies.get('accessToken')?.replace('Bearer ', '');
};

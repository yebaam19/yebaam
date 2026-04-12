import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import type { Socket } from 'socket.io-client';

interface ConnectionStatusProps {
  isConnected: boolean;
  isPostsConnected: boolean;
  isUsersConnected: boolean;
  socket: Socket | null;
  postsSocket: Socket | null;
  usersSocket: Socket | null;
  username?: string;
}

export function ConnectionStatus({
  isConnected,
  isPostsConnected,
  isUsersConnected,
  socket,
  postsSocket,
  usersSocket,
  username,
}: ConnectionStatusProps) {
  const allConnected = isConnected && isPostsConnected && isUsersConnected;
  const someConnected = isConnected || isPostsConnected || isUsersConnected;

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            Estado de Conexión
          </p>
          <p className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">
            {allConnected ? 'TODOS CONECTADOS' : someConnected ? 'PARCIAL' : 'DESCONECTADO'}
          </p>

          <div className="mt-3 space-y-2">
            {/* Main Socket */}
            <div className="flex items-center gap-2">
              {isConnected ? (
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
              ) : (
                <XCircleIcon className="h-4 w-4 text-red-500" />
              )}
              <p className="text-xs text-neutral-600 dark:text-neutral-300">
                <span className="font-semibold">Main:</span>{' '}
                {socket?.id ? (
                  <span className="font-mono text-neutral-500 dark:text-neutral-400">
                    {socket.id.substring(0, 8)}...
                  </span>
                ) : (
                  <span className="text-red-500">Desconectado</span>
                )}
              </p>
            </div>

            {/* Posts Socket */}
            <div className="flex items-center gap-2">
              {isPostsConnected ? (
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
              ) : (
                <XCircleIcon className="h-4 w-4 text-red-500" />
              )}
              <p className="text-xs text-neutral-600 dark:text-neutral-300">
                <span className="font-semibold">/posts:</span>{' '}
                {postsSocket?.id ? (
                  <span className="font-mono text-neutral-500 dark:text-neutral-400">
                    {postsSocket.id.substring(0, 8)}...
                  </span>
                ) : (
                  <span className="text-red-500">Desconectado</span>
                )}
              </p>
            </div>

            {/* Users Socket */}
            <div className="flex items-center gap-2">
              {isUsersConnected ? (
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
              ) : (
                <XCircleIcon className="h-4 w-4 text-red-500" />
              )}
              <p className="text-xs text-neutral-600 dark:text-neutral-300">
                <span className="font-semibold">/users:</span>{' '}
                {usersSocket?.id ? (
                  <span className="font-mono text-neutral-500 dark:text-neutral-400">
                    {usersSocket.id.substring(0, 8)}...
                  </span>
                ) : (
                  <span className="text-red-500">Desconectado</span>
                )}
              </p>
            </div>

            {someConnected && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                Usuario: <span className="font-semibold">{username || 'Invitado'}</span>
              </p>
            )}
          </div>
        </div>
        {allConnected ? (
          <CheckCircleIcon className="h-12 w-12 text-green-500 animate-pulse" />
        ) : someConnected ? (
          <XCircleIcon className="h-12 w-12 text-yellow-500" />
        ) : (
          <XCircleIcon className="h-12 w-12 text-red-500" />
        )}
      </div>
    </div>
  );
}

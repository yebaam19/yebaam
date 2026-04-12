/**
 * Componente de Prueba de WebSocket
 * 
 * Este componente muestra el estado de las conexiones WebSocket
 * y permite probar los eventos en tiempo real.
 * 
 * Uso: Agregar en cualquier página para debuggear
 * ```tsx
 * import { WebSocketDebugger } from '@/components/WebSocketDebugger'
 * 
 * <WebSocketDebugger />
 * ```
 */

'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/providers/socket-provider';
import { usePostEvents } from '@/hooks/usePostEvents';
import { useUserEvents } from '@/hooks/useUserEvents';

export function WebSocketDebugger() {
  const { isPostsConnected, isUsersConnected, postsSocket, usersSocket } = useSocket();
  const { lastPost, lastUpdate, lastDelete } = usePostEvents();
  const { onlineUsers, userStatus, changeStatus, isConnected: userConnected } = useUserEvents();
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-purple-700 z-50"
      >
        WebSocket Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-2xl p-4 max-w-md z-50 max-h-[80vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">WebSocket Status</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          
        </button>
      </div>

      {/* Connection Status */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isPostsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">Posts Socket</span>
          <span className="text-xs text-gray-500">
            {postsSocket?.id ? `ID: ${postsSocket.id.slice(0, 8)}...` : 'Not connected'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isUsersConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm font-medium">Users Socket</span>
          <span className="text-xs text-gray-500">
            {usersSocket?.id ? `ID: ${usersSocket.id.slice(0, 8)}...` : 'Not connected'}
          </span>
        </div>
      </div>

      {/* User Status Controls */}
      {isUsersConnected && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm font-medium mb-2">Change Your Status:</p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => changeStatus('online')}
              className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
            >
              Online
            </button>
            <button
              onClick={() => changeStatus('away')}
              className="px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
            >
              Away
            </button>
            <button
              onClick={() => changeStatus('busy')}
              className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
            >
              Busy
            </button>
            <button
              onClick={() => changeStatus('offline')}
              className="px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
            >
              Offline
            </button>
          </div>
        </div>
      )}

      {/* Last Events */}
      <div className="space-y-3">
        {lastPost && (
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
            <p className="text-xs font-bold text-green-700 dark:text-green-300">Last Post Created:</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {lastPost.content}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              By: {lastPost.author.firstName} {lastPost.author.lastName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Media: {lastPost.mediaFiles?.length || 0} files
            </p>
          </div>
        )}

        {lastUpdate && (
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-bold text-blue-700 dark:text-blue-300">Last Post Updated:</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {lastUpdate._id}
            </p>
          </div>
        )}

        {lastDelete && (
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
            <p className="text-xs font-bold text-red-700 dark:text-red-300">Last Post Deleted:</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
              {lastDelete.postId}
            </p>
          </div>
        )}

        {onlineUsers.length > 0 && (
          <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
            <p className="text-xs font-bold text-purple-700 dark:text-purple-300">
               Online Users: {onlineUsers.length}
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {onlineUsers.slice(0, 5).map((userId) => (
                <span
                  key={userId}
                  className="text-xs bg-purple-200 dark:bg-purple-800 px-2 py-0.5 rounded"
                >
                  {userId.slice(0, 8)}...
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
           This panel shows real-time WebSocket events. Create a post or update your profile to see events appear.
        </p>
      </div>
    </div>
  );
}

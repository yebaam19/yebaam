/**
 * Ejemplo de integración de WebSocket en un componente de Posts
 * 
 * Este ejemplo muestra cómo usar los hooks de WebSocket para
 * actualizar la lista de posts en tiempo real sin recargar la página.
 */

'use client';

import { useEffect, useState } from 'react';
import { usePostEvents } from '@/hooks/usePostEvents';

interface Post {
  _id: string;
  content: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    avatarUrl?: string;
  };
  mediaFiles?: any[];
  createdAt: string;
  updatedAt: string;
}

export function PostsFeedExample() {
  const [posts, setPosts] = useState<Post[]>([]);
  const { lastPost, lastUpdate, lastDelete, isConnected } = usePostEvents();

  // Cargar posts iniciales (simulado - reemplazar con tu API)
  useEffect(() => {
    async function loadPosts() {
      try {
        const response = await fetch('http://localhost:3001/api/posts/public', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        setPosts(data.data || []);
      } catch (error) {
        console.error('Error loading posts:', error);
      }
    }
    loadPosts();
  }, []);

  // ====================================
  // WEBSOCKET: Nuevo post creado
  // ====================================
  useEffect(() => {
    if (lastPost) {
      console.log('[WebSocket] Nuevo post recibido, agregando al feed...');
      
      // Agregar el nuevo post al inicio de la lista
      setPosts((prevPosts) => {
        // Evitar duplicados
        const exists = prevPosts.some(p => p._id === lastPost._id);
        if (exists) return prevPosts;
        
        return [lastPost, ...prevPosts];
      });
      
      // Opcional: Mostrar notificación
      // toast.success(`${lastPost.author.firstName} publicó algo nuevo`);
    }
  }, [lastPost]);

  // ====================================
  // WEBSOCKET: Post actualizado
  // ====================================
  useEffect(() => {
    if (lastUpdate) {
      console.log('[WebSocket] Post actualizado, actualizando en el feed...');
      
      // Actualizar el post en la lista
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post._id === lastUpdate._id ? lastUpdate : post
        )
      );
    }
  }, [lastUpdate]);

  // ====================================
  // WEBSOCKET: Post eliminado
  // ====================================
  useEffect(() => {
    if (lastDelete) {
      console.log('[WebSocket] Post eliminado, removiendo del feed...');
      
      // Remover el post de la lista
      setPosts((prevPosts) =>
        prevPosts.filter((post) => post._id !== lastDelete.postId)
      );
    }
  }, [lastDelete]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Indicador de conexión */}
      <div className="mb-4 flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm text-gray-600">
          {isConnected ? 'Conectado en tiempo real' : 'Desconectado'}
        </span>
      </div>

      {/* Lista de posts */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <p className="text-center text-gray-500">No hay posts aún</p>
        ) : (
          posts.map((post) => (
            <div
              key={post._id}
              className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Author */}
              <div className="flex items-center gap-3 mb-3">
                {post.author.avatarUrl ? (
                  <img
                    src={post.author.avatarUrl}
                    alt={post.author.firstName}
                    className="w-10 h-10 rounded-full"
                    decoding="async"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                    {post.author.firstName[0]}
                  </div>
                )}
                <div>
                  <p className="font-semibold">
                    {post.author.firstName} {post.author.lastName}
                  </p>
                  <p className="text-sm text-gray-500">@{post.author.username}</p>
                </div>
              </div>

              {/* Content */}
              <p className="text-gray-800 mb-3">{post.content}</p>

              {/* Media Files */}
              {post.mediaFiles && post.mediaFiles.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {post.mediaFiles.map((media, index) => (
                    <div key={index} className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      {media.type === 'image' ? (
                        <img
                          src={media.url}
                          alt="Post media"
                          className="w-full h-full object-cover"
                          decoding="async"
                          loading="lazy"
                        />
                      ) : media.type === 'video' ? (
                        <video
                          src={media.url}
                          controls
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              )}

              {/* Timestamp */}
              <p className="text-xs text-gray-400">
                {new Date(post.createdAt).toLocaleString('es-ES')}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

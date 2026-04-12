'use client';

import { useEffect } from 'react';
import { useSocket } from '@/providers/socket-provider';
import { usePostStore } from '../stores/post.store';
import { useAuthStore } from '@/features/auth';
import type { Post } from '../interfaces/post.interfaces';
import { toast } from 'sonner';

/**
 * Hook para escuchar eventos de posts en tiempo real
 * 
 * Eventos del backend (PostGateway):
 * - post_created - Cuando se crea un nuevo post
 * - post_updated - Cuando se actualiza un post
 * - post_deleted - Cuando se elimina un post
 * - post_add_reaction - Cuando se agrega una reacción
 * - post_remove_reaction - Cuando se remueve una reacción
 * - post_upload_media - Cuando se agregan archivos multimedia
 * - post_replace_media - Cuando se reemplazan archivos multimedia
 * - post_remove_media - Cuando se remueve un archivo multimedia
 */
export function usePostSocketEvents() {
  const { postsSocket, isPostsConnected } = useSocket();
  const currentUser = useAuthStore(state => state.user);
  console.log('[PostSocket] Current user:', currentUser);
  const { addPostToList, updatePostInList, removePostFromList } = usePostStore();

  useEffect(() => {
    if (!postsSocket || !isPostsConnected) {
      console.log('[PostSocket] Socket not connected yet');
      return;
    }

    console.log('[PostSocket] Setting up post event listeners on /posts namespace');

    // ====================================
    // Evento: Nuevo post creado
    // ====================================
    const handlePostCreated = (data: any) => {
      console.log('========================================');
      console.log('[PostSocket] post_created received!');
      console.log('Data:', JSON.stringify(data, null, 2));
      console.log(' [PostSocket] Campos del autor en data:');
      console.log('  - authorId:', data.authorId);
      console.log('  - authorUsername:', data.authorUsername);
      console.log('  - authorFirstName:', data.authorFirstName);
      console.log('  - authorLastName:', data.authorLastName);
      console.log('  - authorAvatar:', data.authorAvatar);
      console.log('========================================');
      
      // El backend envía el post completo en ResponsePostDto
      // Transformar del formato backend al formato del cliente
      const newPost: Post = {
        id: data._id || data.id,
        content: data.content,
        backgroundColor: data.backgroundColor,
        mediaFiles: data.mediaFiles || [],
        privacy: typeof data.privacy === 'string' 
          ? { value: data.privacy } 
          : data.privacy,
        author: {
          id: data.authorId,
          username: data.authorUsername,
          firstName: data.authorFirstName,
          lastName: data.authorLastName,
          avatar: data.authorAvatar,
          _id: data.authorId,
        },
        reactionsCount: data.reactionsCount || {
          like: 0,
          love: 0,
          haha: 0,
          wow: 0,
          sad: 0,
          angry: 0,
        },
        commentsCount: data.commentsCount || 0,
        sharesCount: data.sharesCount || 0,
        currentUserReaction: data.myReaction,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        feeling: data.feeling,
        location: data.location,
        taggedUsers: data.taggedUsers,
        gif: data.gif,
      };

      console.log('Transformed post:', newPost);
      console.log(' [PostSocket] Author object creado:', newPost.author);

      // Solo agregar si no es el usuario actual (evitar duplicados con optimistic update)
      const currentUserId = currentUser?.id;
      
      console.log('Current user ID:', currentUserId);
      console.log('Post author ID:', data.authorId);
      console.log('Is own post:', data.authorId === currentUserId);
      
      if (data.authorId !== currentUserId) {
        // Verificar que el post no exista ya en la lista
        const { posts } = usePostStore.getState();
        const exists = posts.some(p => p.id === newPost.id);
        
        console.log('Post already exists in store:', exists);
        console.log('Current posts count:', posts.length);
        
        if (!exists) {
          console.log('[POST SOCKET] Llamando addPostToList...');
          addPostToList(newPost);
          
          const authorName = `${data.authorFirstName} ${data.authorLastName}`;
          toast.success(`${authorName} publicó algo nuevo`, {
            duration: 3000,
          });
          
          console.log('[POST SOCKET] Post agregado mediante socket!');
        } else {
          console.log('Post already exists, skipping...');
        }
      } else {
        console.log('Skipping own post (optimistic update already handled)');
      }
      
      console.log('========================================');
    };

    // ====================================
    // Evento: Post actualizado
    // ====================================
    const handlePostUpdated = (data: any) => {
      console.log('[PostSocket] post_updated received:', data);
      
      // El backend envía: { postId, backgroundColor, content, privacy }
      // privacy viene como string ('public', 'private', 'friends')
      const updates: Partial<Post> = {
        content: data.content,
        backgroundColor: data.backgroundColor,
        privacy: data.privacy 
          ? { value: data.privacy } 
          : undefined,
        updatedAt: new Date().toISOString(),
      };
      
      updatePostInList(data.postId, updates);
      
      // Solo mostrar toast si no es el usuario actual
      const currentUserId = currentUser?.id;
      
      const { posts } = usePostStore.getState();
      const post = posts.find(p => p.id === data.postId);
      
      if (post && post.author.id !== currentUserId) {
        toast.info('Una publicación fue actualizada');
      }
    };

    // ====================================
    // Evento: Post eliminado
    // ====================================
    const handlePostDeleted = (postId: string) => {
      console.log('[PostSocket] post_deleted received:', postId);
      
      // El backend envía solo el postId como string
      const { posts } = usePostStore.getState();
      const post = posts.find(p => p.id === postId);
      
      removePostFromList(postId);
      
      // Solo mostrar toast si no es el usuario actual
      const currentUserId = currentUser?.id;
      
      if (post && post.author.id !== currentUserId) {
        toast.info('Una publicación fue eliminada');
      }
    };

    // ====================================
    // Evento: Nueva reacción agregada
    // ====================================
    const handleAddReaction = (post: any, reactions: any[]) => {
      console.log(' [PostSocket] post_add_reaction received:', { post, reactions });
      
      // Actualizar el post con la nueva información de reacciones
      updatePostInList(post._id || post.id, {
        reactionsCount: post.reactionsCount,
        // Si necesitas actualizar la reacción del usuario actual
        currentUserReaction: post.myReaction,
      });
    };

    // ====================================
    // Evento: Reacción removida
    // ====================================
    const handleRemoveReaction = (post: any, reactions: any[]) => {
      console.log(' [PostSocket] post_remove_reaction received:', { post, reactions });
      
      // Actualizar el post con la nueva información de reacciones
      updatePostInList(post._id || post.id, {
        reactionsCount: post.reactionsCount,
        currentUserReaction: post.myReaction,
      });
    };

    // ====================================
    // Evento: Archivos multimedia agregados
    // ====================================
    const handleUploadMedia = (data: { postId: string; mediaFiles: any[] }) => {
      console.log(' [PostSocket] post_upload_media received:', data);
      
      // Agregar los nuevos archivos a los existentes
      const { posts } = usePostStore.getState();
      const post = posts.find(p => p.id === data.postId);
      
      if (post) {
        const updatedMediaFiles = [...(post.mediaFiles || []), ...data.mediaFiles];
        updatePostInList(data.postId, {
          mediaFiles: updatedMediaFiles,
        });
      }
    };

    // ====================================
    // Evento: Archivos multimedia reemplazados
    // ====================================
    const handleReplaceMedia = (data: { postId: string; mediaFiles: any[] }) => {
      console.log(' [PostSocket] post_replace_media received:', data);
      
      // Reemplazar todos los archivos multimedia
      updatePostInList(data.postId, {
        mediaFiles: data.mediaFiles,
      });
    };

    // ====================================
    // Evento: Archivo multimedia removido
    // ====================================
    const handleRemoveMedia = (data: { postId: string; mediaId: string }) => {
      console.log('[PostSocket] post_remove_media received:', data);
      
      // Remover el archivo específico
      const { posts } = usePostStore.getState();
      const post = posts.find(p => p.id === data.postId);
      
      if (post && post.mediaFiles) {
        const updatedMediaFiles = post.mediaFiles.filter(
          media => media.id !== data.mediaId
        );
        updatePostInList(data.postId, {
          mediaFiles: updatedMediaFiles,
        });
      }
    };

    // Registrar todos los event listeners
    postsSocket.on('post_created', handlePostCreated);
    postsSocket.on('post_updated', handlePostUpdated);
    postsSocket.on('post_deleted', handlePostDeleted);
    postsSocket.on('post_add_reaction', handleAddReaction);
    postsSocket.on('post_remove_reaction', handleRemoveReaction);
    postsSocket.on('post_upload_media', handleUploadMedia);
    postsSocket.on('post_replace_media', handleReplaceMedia);
    postsSocket.on('post_remove_media', handleRemoveMedia);

    // Cleanup
    return () => {
      console.log(' [PostSocket] Cleaning up post event listeners');
      postsSocket.off('post_created', handlePostCreated);
      postsSocket.off('post_updated', handlePostUpdated);
      postsSocket.off('post_deleted', handlePostDeleted);
      postsSocket.off('post_add_reaction', handleAddReaction);
      postsSocket.off('post_remove_reaction', handleRemoveReaction);
      postsSocket.off('post_upload_media', handleUploadMedia);
      postsSocket.off('post_replace_media', handleReplaceMedia);
      postsSocket.off('post_remove_media', handleRemoveMedia);
    };
  }, [postsSocket, isPostsConnected, updatePostInList, removePostFromList]);
}

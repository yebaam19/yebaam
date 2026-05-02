'use client';

import { useEffect } from 'react';
import { useSocket } from '@/providers/socket-provider';
import { usePostStore } from '../stores/post.store';
import { useAuthStore } from '@/features/auth';
import type { Post } from '../interfaces/post.interfaces';
import { toast } from 'sonner';

/**
 * Realtime listeners for the posts namespace. The backend (PostGateway) emits:
 * post_created / post_updated / post_deleted / post_add_reaction /
 * post_remove_reaction / post_upload_media / post_replace_media / post_remove_media.
 */
export function usePostSocketEvents() {
  const { postsSocket, isPostsConnected } = useSocket();
  const currentUser = useAuthStore(state => state.user);
  const { addPostToList, updatePostInList, removePostFromList } = usePostStore();

  useEffect(() => {
    if (!postsSocket || !isPostsConnected) return;

    const handlePostCreated = (data: any) => {
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

      // Skip own posts — optimistic update already inserted them.
      if (data.authorId === currentUser?.id) return;

      const { posts } = usePostStore.getState();
      if (posts.some(p => p.id === newPost.id)) return;

      addPostToList(newPost);
      const authorName = `${data.authorFirstName} ${data.authorLastName}`;
      toast.success(`${authorName} publicó algo nuevo`, { duration: 3000 });
    };

    const handlePostUpdated = (data: any) => {
      const updates: Partial<Post> = {
        content: data.content,
        backgroundColor: data.backgroundColor,
        privacy: data.privacy ? { value: data.privacy } : undefined,
        updatedAt: new Date().toISOString(),
      };

      updatePostInList(data.postId, updates);

      const { posts } = usePostStore.getState();
      const post = posts.find(p => p.id === data.postId);
      if (post && post.author.id !== currentUser?.id) {
        toast.info('Una publicación fue actualizada');
      }
    };

    const handlePostDeleted = (postId: string) => {
      const { posts } = usePostStore.getState();
      const post = posts.find(p => p.id === postId);

      removePostFromList(postId);

      if (post && post.author.id !== currentUser?.id) {
        toast.info('Una publicación fue eliminada');
      }
    };

    const handleAddReaction = (post: any) => {
      updatePostInList(post._id || post.id, {
        reactionsCount: post.reactionsCount,
        currentUserReaction: post.myReaction,
      });
    };

    const handleRemoveReaction = (post: any) => {
      updatePostInList(post._id || post.id, {
        reactionsCount: post.reactionsCount,
        currentUserReaction: post.myReaction,
      });
    };

    const handleUploadMedia = (data: { postId: string; mediaFiles: any[] }) => {
      const { posts } = usePostStore.getState();
      const post = posts.find(p => p.id === data.postId);

      if (post) {
        const updatedMediaFiles = [...(post.mediaFiles || []), ...data.mediaFiles];
        updatePostInList(data.postId, { mediaFiles: updatedMediaFiles });
      }
    };

    const handleReplaceMedia = (data: { postId: string; mediaFiles: any[] }) => {
      updatePostInList(data.postId, { mediaFiles: data.mediaFiles });
    };

    const handleRemoveMedia = (data: { postId: string; mediaId: string }) => {
      const { posts } = usePostStore.getState();
      const post = posts.find(p => p.id === data.postId);

      if (post && post.mediaFiles) {
        const updatedMediaFiles = post.mediaFiles.filter(
          media => media.id !== data.mediaId
        );
        updatePostInList(data.postId, { mediaFiles: updatedMediaFiles });
      }
    };

    postsSocket.on('post_created', handlePostCreated);
    postsSocket.on('post_updated', handlePostUpdated);
    postsSocket.on('post_deleted', handlePostDeleted);
    postsSocket.on('post_add_reaction', handleAddReaction);
    postsSocket.on('post_remove_reaction', handleRemoveReaction);
    postsSocket.on('post_upload_media', handleUploadMedia);
    postsSocket.on('post_replace_media', handleReplaceMedia);
    postsSocket.on('post_remove_media', handleRemoveMedia);

    return () => {
      postsSocket.off('post_created', handlePostCreated);
      postsSocket.off('post_updated', handlePostUpdated);
      postsSocket.off('post_deleted', handlePostDeleted);
      postsSocket.off('post_add_reaction', handleAddReaction);
      postsSocket.off('post_remove_reaction', handleRemoveReaction);
      postsSocket.off('post_upload_media', handleUploadMedia);
      postsSocket.off('post_replace_media', handleReplaceMedia);
      postsSocket.off('post_remove_media', handleRemoveMedia);
    };
  }, [postsSocket, isPostsConnected, updatePostInList, removePostFromList, addPostToList, currentUser?.id]);
}

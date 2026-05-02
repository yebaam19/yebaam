import { useEffect, useCallback } from 'react';
import { useSocket } from '@/providers/socket-provider';
import { usePostStore } from '../stores/post.store';

export function usePostSocket() {
  const { postsSocket, isPostsConnected } = useSocket();
  const { addPostToList, updatePostInList, removePostFromList } = usePostStore();

  const handlePostCreated = useCallback((post: any) => {
    addPostToList(post);
  }, [addPostToList]);

  const handlePostUpdated = useCallback((post: any) => {
    updatePostInList(post.id, post);
  }, [updatePostInList]);

  const handlePostDeleted = useCallback((data: { postId: string }) => {
    removePostFromList(data.postId);
  }, [removePostFromList]);

  const handlePostReaction = useCallback((_data: {
    postId: string;
    userId: string;
    reactionType: string;
    userName?: string;
    userAvatar?: string;
  }) => {
    // Reaction count handled by usePostSocketEvents.ts via post_add_reaction.
  }, []);

  const handlePostComment = useCallback((_data: {
    postId: string;
    commentId: string;
    userId: string;
    content: string;
  }) => {
    // Comment count handled by comment store WS subscription.
  }, []);

  useEffect(() => {
    if (!postsSocket || !isPostsConnected) return;

    postsSocket.on('post_created', handlePostCreated);
    postsSocket.on('post_updated', handlePostUpdated);
    postsSocket.on('post_deleted', handlePostDeleted);
    postsSocket.on('post_add_reaction', handlePostReaction);
    postsSocket.on('post_comment', handlePostComment);

    return () => {
      postsSocket.off('post_created', handlePostCreated);
      postsSocket.off('post_updated', handlePostUpdated);
      postsSocket.off('post_deleted', handlePostDeleted);
      postsSocket.off('post_add_reaction', handlePostReaction);
      postsSocket.off('post_comment', handlePostComment);
    };
  }, [
    postsSocket,
    isPostsConnected,
    handlePostCreated,
    handlePostUpdated,
    handlePostDeleted,
    handlePostReaction,
    handlePostComment,
  ]);

  return {
    isConnected: isPostsConnected,
    socket: postsSocket,
  };
}

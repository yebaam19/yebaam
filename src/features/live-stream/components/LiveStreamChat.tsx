'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/features/auth';
import { useLiveStreamSocket } from '../hooks/useLiveStreamSocket';
import {
  liveStreamCommentService,
  LiveStreamComment
} from '../services/live-stream-comment.service';
import { PaperAirplaneIcon, TrashIcon } from '@/components/icons/heroicons-shim';

interface LiveStreamChatProps {
  streamId: string;
  className?: string;
}

export function LiveStreamChat({ streamId, className = '' }: LiveStreamChatProps) {
  const t = useTranslations('liveStream');
  const { user } = useAuth();
  const [comments, setComments] = useState<LiveStreamComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // WebSocket para comentarios en tiempo real
  const { isConnected, viewerCount } = useLiveStreamSocket(
    {
      streamId,
      userId: user?.id || '',
      username: user?.username || '',
      enabled: !!user,
    },
    {
      onCommentCreated: (comment) => {
        setComments((prev) => [...prev, comment]);
        // Auto-scroll al nuevo comentario
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      },
    }
  );

  // Cargar comentarios iniciales
  useEffect(() => {
    loadComments();
  }, [streamId]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const data = await liveStreamCommentService.getComments(streamId, { limit: 50 });
      setComments(data);
      setTimeout(() => chatEndRef.current?.scrollIntoView(), 100);
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !user) return;

    setIsSending(true);
    try {
      await liveStreamCommentService.createComment(streamId, {
        content: newComment.trim(),
      });
      setNewComment('');
    } catch (error) {
      console.error('Error sending comment:', error);
      alert(t('chat.errors.send'));
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm(t('chat.deleteConfirm'))) return;

    try {
      await liveStreamCommentService.deleteComment(streamId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert(t('chat.errors.delete'));
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  };

  if (!user) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="flex-1 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
          {t('chat.loginPrompt')}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-neutral-900 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            {t('chat.title')}
          </h3>
          <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{viewerCount === 1 ? t('chat.viewersOne', { count: viewerCount }) : t('chat.viewersOther', { count: viewerCount })}</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex items-center justify-center h-full text-neutral-500 dark:text-neutral-400">
            {t('chat.empty')}
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="group flex gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 -mx-2 px-2 py-1 rounded"
            >
              {/* Avatar */}
              <div className="shrink-0">
                {comment.user.avatar ? (
                  <img
                    src={comment.user.avatar}
                    alt={comment.user.username}
                    className="w-8 h-8 rounded-full"
                    decoding="async"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold text-sm">
                    {comment.user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm text-neutral-900 dark:text-white">
                    {comment.user.username}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {formatTime(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 wrap-break-word">
                  {comment.content}
                </p>
              </div>

              {/* Delete button (solo para el autor) */}
              {comment.user.id === user.id && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="opacity-0 group-hover:opacity-100 shrink-0 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-opacity"
                  title={t('chat.deleteTitle')}
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendComment}
        className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('chat.inputPlaceholder')}
            maxLength={500}
            className="flex-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-white"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSending}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <PaperAirplaneIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

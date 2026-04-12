'use client';

import { useState, FormEvent } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/features/auth';
import { useCommentStore } from '../store/comment.store';
import { CommentAuthorAvatar } from './CommentAuthorAvatar';
import { CommentTextarea } from './CommentTextarea';
import { SubmitButton } from './SubmitButton';

interface CommentReplyInputProps {
  postId: string;
  parentCommentId: string;
  replyingTo: {
    username: string;
    fullName: string;
  };
  onCancel: () => void;
  onReplyCreated?: () => void;
  className?: string;
}

export function CommentReplyInput({ 
  postId,
  parentCommentId,
  replyingTo,
  onCancel,
  onReplyCreated,
  className = ''
}: CommentReplyInputProps) {
  const { user } = useAuth();
  const { createComment } = useCommentStore();
  
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('La respuesta no puede estar vacía');
      return;
    }

    if (content.length > 500) {
      setError('La respuesta es demasiado larga (máximo 500 caracteres)');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createComment({
        postId,
        content: content.trim(),
        parentId: parentCommentId,
      });

      // Limpiar y cerrar
      setContent('');
      onReplyCreated?.();
      onCancel();
      
      console.log(' [CommentReplyInput] Respuesta creada exitosamente');
    } catch (err) {
      console.error(' [CommentReplyInput] Error al crear respuesta:', err);
      setError(err instanceof Error ? err.message : 'Error al crear respuesta');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className={`mt-2 ${className}`}>
      {/* Header: Respondiendo a... */}
      <div className="flex items-center justify-between mb-2 px-2">
        <span className="text-xs text-gray-600 dark:text-gray-400">
          Respondiendo a <span className="font-semibold">@{replyingTo.username}</span>
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
          aria-label="Cancelar respuesta"
        >
          <XMarkIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Form */}
      <form 
        onSubmit={handleSubmit}
        className="flex items-start gap-2 min-w-0"
      >
        <div className="flex-shrink-0">
          <CommentAuthorAvatar 
            src={user.avatar}
            username={user.username}
            alt={`${user.firstName} ${user.lastName}`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <CommentTextarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`Responder a ${replyingTo.fullName}...`}
            error={error || undefined}
            disabled={isSubmitting}
            maxLength={500}
            autoFocus
          />
        </div>

        <div className="flex-shrink-0">
          <SubmitButton 
            isLoading={isSubmitting}
            hasContent={!!content.trim()}
            disabled={!content.trim() || isSubmitting}
          />
        </div>
      </form>
    </div>
  );
}

'use client';

import { useState, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/features/auth';
import { useCommentStore } from '../store/comment.store';
import { CommentAuthorAvatar } from './CommentAuthorAvatar';
import { CommentTextarea } from './CommentTextarea';
import { SubmitButton } from './SubmitButton';

interface CommentInputProps {
  postId: string;
  placeholder?: string;
  onCommentCreated?: () => void;
  className?: string;
}

/**
 * Input principal para crear comentarios
 * Incluye: Avatar + Textarea auto-resize + Botón enviar
 */
export function CommentInput({
  postId,
  placeholder,
  onCommentCreated,
  className = ''
}: CommentInputProps) {
  const t = useTranslations('feed');
  const { user } = useAuth();
  const { createComment } = useCommentStore();

  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError(t('comments.errors.empty'));
      return;
    }

    if (content.length > 500) {
      setError(t('comments.errors.tooLong'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createComment({
        postId,
        content: content.trim(),
      });

      // Limpiar input
      setContent('');

      // Callback opcional
      onCommentCreated?.();
    } catch (err) {
      console.error(' [CommentInput] Error al crear comentario:', err);
      setError(err instanceof Error ? err.message : t('comments.errors.createDefault'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null; // No mostrar si no hay usuario autenticado
  }

  return (
    <form 
      onSubmit={handleSubmit}
      className={`flex items-start gap-2 ${className}`}
    >
      <CommentAuthorAvatar 
        src={user.avatar}
        username={user.username}
        alt={`${user.firstName} ${user.lastName}`}
      />

      <CommentTextarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder ?? t('comments.inputPlaceholder')}
        error={error || undefined}
        disabled={isSubmitting}
        maxLength={500}
      />

      <SubmitButton 
        isLoading={isSubmitting}
        hasContent={content.trim().length > 0}
      />
    </form>
  );
}

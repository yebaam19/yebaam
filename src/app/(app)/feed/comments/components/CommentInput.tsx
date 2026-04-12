'use client';

import { useState, FormEvent } from 'react';
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
 * 
 * @example
 * <CommentInput 
 *   postId="123" 
 *   placeholder="Escribe un comentario..."
 *   onCommentCreated={() => console.log('Comentario creado')}
 * />
 */
export function CommentInput({ 
  postId, 
  placeholder = 'Escribe un comentario...',
  onCommentCreated,
  className = ''
}: CommentInputProps) {
  const { user } = useAuth();
  const { createComment } = useCommentStore();
  
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('El comentario no puede estar vacío');
      return;
    }

    if (content.length > 500) {
      setError('El comentario es demasiado largo (máximo 500 caracteres)');
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
      
      console.log(' [CommentInput] Comentario creado exitosamente');
    } catch (err) {
      console.error(' [CommentInput] Error al crear comentario:', err);
      setError(err instanceof Error ? err.message : 'Error al crear comentario');
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
        placeholder={placeholder}
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

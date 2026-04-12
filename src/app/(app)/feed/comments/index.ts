/**
 * Barrel exports para el módulo de comentarios
 */

// Interfaces
export type {
  Comment,
  CommentAuthor,
  CreateCommentDTO,
  UpdateCommentDTO,
  DeleteCommentDTO,
  GetCommentsResponse,
  GetCommentsFilters,
  CommentLoadingState,
  CommentSocketPayload,
  CommentUpdatedPayload,
  CommentDeletedPayload,
} from './interfaces/comment.interfaces';

// Servicios
export { commentService, CommentService } from './services/comment.service';

// Store
export { useCommentStore } from './store/comment.store';

// Hooks
export { useCommentSocket } from './hooks/useCommentSocket';

// Componentes principales
export { CommentInput } from './components/CommentInput';
export { CommentList } from './components/CommentList';
export { CommentItem } from './components/CommentItem';
export { CommentReplyInput } from './components/CommentReplyInput';
export { CommentReplyList } from './components/CommentReplyList';

// Componentes auxiliares
export { CommentTextarea } from './components/CommentTextarea';
export { CommentHeader } from './components/CommentHeader';
export { CommentContent } from './components/CommentContent';
export { CommentActions } from './components/CommentActions';
export { CommentAuthorAvatar } from './components/CommentAuthorAvatar';
export { SubmitButton } from './components/SubmitButton';

// Componentes de UI
export { CommentSkeleton, CommentListSkeleton } from './components/CommentSkeleton';
export { EmptyComments } from './components/EmptyComments';


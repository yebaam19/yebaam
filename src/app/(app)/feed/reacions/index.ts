// Componentes
export { ReactionButton } from './components/ReactionButton/ReactionButton';
export { ReactionPicker } from './components/ReactionPicker/ReactionPicker';
export { ReactionStats } from './components/ReactionStats/ReactionStats';

// Hooks
export { useReactionSocket } from './hooks/useReactionSocket';

// Store
export { useReactionStore } from './store/reaction.store';

// Interfaces y tipos
export {
  ReactionType,
  REACTION_CONFIGS,
  type Reaction,
  type ReactionConfig,
  type ReactionCounts,
  type CreateReactionDTO,
  type UpdateReactionDTO,
  type ReactionsResponse,
  type GetReactionsFilters,
} from './interfaces/reaction.interfaces';

// Service (para casos específicos)
export { reactionService } from './services/reaction.service';

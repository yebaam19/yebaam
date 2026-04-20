export type AskmeStatus = 'pending' | 'approved' | 'rejected' | 'deleted'

export interface AskmeAsker {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
}

export interface AskmeQuestion {
  id: string
  blogId: string
  question: string
  status: AskmeStatus
  isAnonymous: boolean
  createdAt: string
  answer: string | null
  answeredAt: string | null
  /** Asker is hidden from non-owner readers when isAnonymous is true. */
  asker: AskmeAsker | null
}

export interface AskmeStats {
  total: number
  pending: number
  approved: number
  rejected: number
  answered: number
  /** Percentage of approved questions that have been answered (0-100). */
  responseRate: number
}

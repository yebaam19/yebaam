export type OwnerType = 'club' | 'group' | 'blog' | 'page' | 'city' | 'profile' | 'portal' | 'community'
export type SpaceVisibility = 'public' | 'private' | 'secret'
export type ForoRoleType = 'admin' | 'moderator'

export interface ForoAuthor {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
}

export interface ForoSpace {
  id: string
  ownerType: OwnerType
  ownerId: string
  slug: string
  name: string
  description: string | null
  visibility: SpaceVisibility
  enabled: boolean
  enabledAt: string
  createdAt: string
  stats?: { topicCount: number; postCount: number }
}

export interface ForoForum {
  id: string
  categoryId: string
  spaceId: string
  parentForumId: string | null
  name: string
  description: string | null
  slug: string
  position: number
  topicCount: number
  postCount: number
  lastPostAt: string | null
  lastPostAuthor: ForoAuthor | null
  lastTopicTitle: string | null
  lastTopicSlug: string | null
  subforums: ForoForum[]
}

export interface ForoCategory {
  id: string
  name: string
  slug: string
  position: number
  spaceId: string
  forums: ForoForum[]
}

export interface ForoTopic {
  id: string
  forumId: string
  title: string
  slug: string
  isPinned: boolean
  isLocked: boolean
  postCount: number
  viewCount: number
  createdAt: string
  lastPostAt: string | null
  lastPostId: string | null
  author: ForoAuthor
  lastPostAuthor: ForoAuthor | null
}

export interface ForoPostAuthorMeta {
  postCount: number
  joinedAt: string | null
  location: string | null
  signature: string | null
}

export interface ForoPost {
  id: string
  topicId: string
  content: string
  createdAt: string
  editedAt: string | null
  postNumber: number
  author: ForoAuthor
  authorMeta?: ForoPostAuthorMeta
}

export interface ForoGlobalStaff {
  role: ForoRoleType
  user: ForoAuthor
  grantedAt: string
}

export interface ForoRoleMember {
  spaceId: string
  userId: string
  role: ForoRoleType
  grantedAt: string
  user: ForoAuthor
}

export interface OwnerCandidate {
  ownerType: OwnerType
  ownerId: string
  name: string
  slug: string | null
  privacy: SpaceVisibility
  hasSpace: boolean
  spaceSlug: string | null
  spaceEnabled: boolean | null
}

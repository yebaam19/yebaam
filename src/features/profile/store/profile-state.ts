import type { StateCreator } from 'zustand'
import type {
  UpdateInterestsDTO,
  UpdatePersonalInfoDTO,
  UpdateProfileDTO,
  UpdateSocialLinksDTO,
  UserProfile,
} from '../interfaces/profile.interfaces'
import { profileService } from '../services/profile.service'


export type ProfilePost = { id: string; [key: string]: unknown }
export type ProfilePhoto = Awaited<ReturnType<typeof profileService.getUserPhotos>>['items'][number] & { albumId?: string }
export type ProfileVideo = Awaited<ReturnType<typeof profileService.getUserVideos>>['items'][number] & { albumId?: string; caption?: string }

export interface ProfileState {
  // Estado principal
  currentProfile: UserProfile | null
  profiles: Map<string, UserProfile> // Cache de perfiles por username
  isLoading: boolean
  error: string | null

  // Posts del usuario
  userPosts: ProfilePost[]
  isLoadingPosts: boolean
  hasMorePosts: boolean
  postsCursor: string | null
  postsUserId: string | null

  // Fotos del usuario
  userPhotos: ProfilePhoto[]
  isLoadingPhotos: boolean
  hasMorePhotos: boolean
  photosCursor: string | null
  photosUserId: string | null

  // Videos del usuario
  userVideos: ProfileVideo[]
  isLoadingVideos: boolean
  hasMoreVideos: boolean
  videosCursor: string | null
  videosUserId: string | null

  // Acciones - API Calls
  fetchProfileByUsername: (username: string) => Promise<void>
  fetchMyProfile: () => Promise<void>
  updateProfile: (data: UpdateProfileDTO) => Promise<void>
  updatePersonalInfo: (data: UpdatePersonalInfoDTO) => Promise<void>
  updateSocialLinks: (data: UpdateSocialLinksDTO) => Promise<void>
  updateInterests: (data: UpdateInterestsDTO) => Promise<void>
  uploadImage: (file: File, type: 'avatar' | 'cover') => Promise<string>

  // Posts
  fetchUserPosts: (userId: string, reset?: boolean) => Promise<void>
  loadMorePosts: () => Promise<void>

  // Fotos
  fetchUserPhotos: (userId: string, reset?: boolean) => Promise<void>
  loadMorePhotos: () => Promise<void>

  // Videos
  fetchUserVideos: (userId: string, reset?: boolean) => Promise<void>
  loadMoreVideos: () => Promise<void>

  // WebSocket events
  handleProfileUpdated: (profile: UserProfile) => void
  handlePostAdded: (post: ProfilePost) => void
  handlePostRemoved: (postId: string) => void

  // Utilidades
  clearError: () => void
  reset: () => void
}


export type ProfileSlice<T> = StateCreator<ProfileState, [], [], T>

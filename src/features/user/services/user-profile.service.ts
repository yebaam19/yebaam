import { profileService } from '@/features/profile/services/profile.service';
import type { UserProfile as ProfileShape } from '@/features/profile/interfaces/profile.interfaces';

export interface UserLocation {
  country?: string;
  state?: string;
  city?: string;
}

export interface UserPrivacy {
  profileVisibility: 'public' | 'friends' | 'private';
  showEmail: boolean;
  showPhoneNumber: boolean;
  showBirthday: boolean;
  showLocation: boolean;
  allowFriendRequests: boolean;
  allowMessages: boolean;
  showOnlineStatus: boolean;
  whoCanPost: 'everyone' | 'friends' | 'only_me';
  whoCanSeeMyPosts: 'public' | 'friends' | 'only_me';
}

export interface UserStats {
  friendsCount: number;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  photosCount: number;
  videosCount: number;
  checkinsCount: number;
}

export interface UserProfile {
  userId: string;
  username: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  birthDate?: string;
  gender?: 'male' | 'female' | 'other';
  bio?: string;
  avatarUrl?: string;
  coverPhotoUrl?: string;
  location?: UserLocation;
  privacy: UserPrivacy;
  stats: UserStats;
  isActive: boolean;
  isVerified: boolean;
  isCelebrity: boolean;
  friends: string[];
  followers: string[];
  following: string[];
  workExperience: unknown[];
  education: unknown[];
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_PRIVACY: UserPrivacy = {
  profileVisibility: 'public',
  showEmail: false,
  showPhoneNumber: false,
  showBirthday: true,
  showLocation: true,
  allowFriendRequests: true,
  allowMessages: true,
  showOnlineStatus: true,
  whoCanPost: 'friends',
  whoCanSeeMyPosts: 'friends',
};

function mapToLegacyShape(p: ProfileShape): UserProfile {
  return {
    userId: p.userId,
    username: p.username,
    firstName: p.firstName ?? '',
    middleName: p.secondName,
    lastName: p.lastName ?? '',
    secondLastName: p.secondLastName,
    birthDate: p.birthDate ? p.birthDate.toISOString() : undefined,
    gender: p.gender ? (p.gender.toLowerCase() as 'male' | 'female' | 'other') : undefined,
    bio: p.bio ?? undefined,
    avatarUrl: p.avatarUrl ?? undefined,
    coverPhotoUrl: p.coverPhotoUrl ?? undefined,
    location: {
      country: p.residenceCountry ?? undefined,
      state: p.residenceState ?? undefined,
      city: p.residenceCity ?? undefined,
    },
    privacy: DEFAULT_PRIVACY,
    stats: {
      friendsCount: p._count?.posts ? p._count.posts : 0,
      followersCount: p._count?.followers ?? 0,
      followingCount: p._count?.following ?? 0,
      postsCount: p._count?.posts ?? 0,
      photosCount: 0,
      videosCount: 0,
      checkinsCount: 0,
    },
    isActive: true,
    isVerified: false,
    isCelebrity: false,
    friends: [],
    followers: [],
    following: [],
    workExperience: [],
    education: [],
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

class UserProfileService {
  async getMyProfile(): Promise<UserProfile> {
    const p = await profileService.getMyProfile();
    return mapToLegacyShape(p);
  }

  async getUserProfileByUsername(username: string): Promise<UserProfile> {
    const p = await profileService.getProfileByUsername(username);
    return mapToLegacyShape(p);
  }

  async updateMyProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const p = await profileService.updateProfile({
      firstName: data.firstName,
      secondName: data.middleName,
      lastName: data.lastName,
      secondLastName: data.secondLastName,
      bio: data.bio,
      gender: data.gender?.toUpperCase(),
      birthDate: data.birthDate,
      residenceCity: data.location?.city,
    });
    return mapToLegacyShape(p);
  }
}

export const userProfileService = new UserProfileService();

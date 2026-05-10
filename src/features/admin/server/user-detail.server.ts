import 'server-only';
import { cache } from 'react';
import { getServerClient } from '@/utils/supabase/server';

export interface AdminUserDetail {
  id: string;
  username: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  secondLastName: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  birthDate: string | null;
  gender: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  phoneNumber: string | null;
  occupation: string | null;
  workPlace: string | null;
  studyPlace: string | null;
  languages: string[];
  interests: string[];
  verificationStatus: string | null;
  isVerified: boolean | null;
  verifiedAt: string | null;
  pioneerNumber: number | null;
  termsAcceptedAt: string | null;
  profileCompleted: boolean | null;
  friendsCount: number | null;
  followersCount: number | null;
  postsCount: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastActiveAt: string | null;
}

export const getAdminUserDetailByUsername = cache(async (username: string): Promise<AdminUserDetail | null> => {
  const client = await getServerClient();
  const { data, error } = await client
    .from('profiles')
    .select(
      'id, username, first_name, middle_name, last_name, second_last_name, display_name, avatar_url, bio, birth_date, gender, country, state, city, phone_number, occupation, work_place, study_place, languages, interests, verification_status, is_verified, verified_at, pioneer_number, terms_accepted_at, profile_completed, friends_count, followers_count, posts_count, created_at, updated_at, last_active_at',
    )
    .eq('username', username)
    .maybeSingle();

  if (error || !data) return null;
  const r = data as unknown as Record<string, unknown>;
  return {
    id: r.id as string,
    username: (r.username as string | null) ?? null,
    firstName: (r.first_name as string | null) ?? null,
    middleName: (r.middle_name as string | null) ?? null,
    lastName: (r.last_name as string | null) ?? null,
    secondLastName: (r.second_last_name as string | null) ?? null,
    displayName: (r.display_name as string | null) ?? null,
    avatarUrl: (r.avatar_url as string | null) ?? null,
    bio: (r.bio as string | null) ?? null,
    birthDate: (r.birth_date as string | null) ?? null,
    gender: (r.gender as string | null) ?? null,
    country: (r.country as string | null) ?? null,
    state: (r.state as string | null) ?? null,
    city: (r.city as string | null) ?? null,
    phoneNumber: (r.phone_number as string | null) ?? null,
    occupation: (r.occupation as string | null) ?? null,
    workPlace: (r.work_place as string | null) ?? null,
    studyPlace: (r.study_place as string | null) ?? null,
    languages: (r.languages as string[] | null) ?? [],
    interests: (r.interests as string[] | null) ?? [],
    verificationStatus: (r.verification_status as string | null) ?? null,
    isVerified: (r.is_verified as boolean | null) ?? null,
    verifiedAt: (r.verified_at as string | null) ?? null,
    pioneerNumber: (r.pioneer_number as number | null) ?? null,
    termsAcceptedAt: (r.terms_accepted_at as string | null) ?? null,
    profileCompleted: (r.profile_completed as boolean | null) ?? null,
    friendsCount: (r.friends_count as number | null) ?? null,
    followersCount: (r.followers_count as number | null) ?? null,
    postsCount: (r.posts_count as number | null) ?? null,
    createdAt: (r.created_at as string | null) ?? null,
    updatedAt: (r.updated_at as string | null) ?? null,
    lastActiveAt: (r.last_active_at as string | null) ?? null,
  };
});

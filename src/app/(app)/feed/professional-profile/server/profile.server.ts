import 'server-only';
import { getServerClient } from '@/utils/supabase/server';
import type {
  Association,
  Experience,
  Language,
  License,
  ProfessionalProfile,
  ProfessionalProfileVisibility,
  Skill,
  Study,
  Title,
} from '@/features/professional-profile/interfaces/professional-profile.interfaces';

type ProfileRow = {
  id: string;
  user_id: string;
  visibility: ProfessionalProfileVisibility;
  avatar_url: string | null;
  cover_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
};

type UserProfileRow = {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

type TitleRow = { id: string; professional_profile_id: string; name: string; institution: string | null; year: number | null };
type StudyRow = TitleRow;
type AssociationRow = { id: string; professional_profile_id: string; name: string; role: string | null };
type LicenseRow = { id: string; professional_profile_id: string; name: string; number: string | null; issued_by: string | null; issued_at: string | null };
type SkillRow = { id: string; professional_profile_id: string; name: string; level: string | null };
type LanguageRow = { id: string; professional_profile_id: string; name: string; proficiency: string | null };
type ExperienceRow = {
  id: string;
  professional_profile_id: string;
  position: string;
  company: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
};

function toTitle(row: TitleRow): Title {
  return { id: row.id, professionalProfileId: row.professional_profile_id, name: row.name, institution: row.institution, year: row.year };
}
function toStudy(row: StudyRow): Study {
  return toTitle(row);
}
function toAssociation(row: AssociationRow): Association {
  return { id: row.id, professionalProfileId: row.professional_profile_id, name: row.name, role: row.role };
}
function toLicense(row: LicenseRow): License {
  return {
    id: row.id,
    professionalProfileId: row.professional_profile_id,
    name: row.name,
    number: row.number,
    issuedBy: row.issued_by,
    issuedAt: row.issued_at,
  };
}
function toSkill(row: SkillRow): Skill {
  return { id: row.id, professionalProfileId: row.professional_profile_id, name: row.name, level: row.level };
}
function toLanguage(row: LanguageRow): Language {
  return { id: row.id, professionalProfileId: row.professional_profile_id, name: row.name, proficiency: row.proficiency };
}
function toExperience(row: ExperienceRow): Experience {
  return {
    id: row.id,
    professionalProfileId: row.professional_profile_id,
    position: row.position,
    company: row.company,
    startDate: row.start_date,
    endDate: row.end_date,
    description: row.description,
  };
}

function toProfile(row: ProfileRow, user?: UserProfileRow | null): ProfessionalProfile {
  return {
    id: row.id,
    userId: row.user_id,
    visibility: row.visibility,
    avatarUrl: row.avatar_url,
    coverUrl: row.cover_url,
    bio: row.bio,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: user
      ? {
          id: user.id,
          firstName: user.first_name ?? '',
          lastName: user.last_name ?? '',
          username: user.username ?? '',
          avatar: user.avatar_url,
        }
      : undefined,
  };
}

async function hydrateProfile(
  client: Awaited<ReturnType<typeof getServerClient>>,
  base: ProfessionalProfile,
): Promise<ProfessionalProfile> {
  const profileId = base.id;
  const [
    titles,
    studies,
    associations,
    licenses,
    skills,
    languages,
    experience,
    titlesCount,
    studiesCount,
    associationsCount,
    licensesCount,
    skillsCount,
    languagesCount,
    experienceCount,
    postsCount,
    followersCount,
  ] = await Promise.all([
    client.from('professional_profile_titles').select('*').eq('professional_profile_id', profileId).order('year', { ascending: false, nullsFirst: false }),
    client.from('professional_profile_studies').select('*').eq('professional_profile_id', profileId).order('year', { ascending: false, nullsFirst: false }),
    client.from('professional_profile_associations').select('*').eq('professional_profile_id', profileId).order('created_at', { ascending: false }),
    client.from('professional_profile_licenses').select('*').eq('professional_profile_id', profileId).order('issued_at', { ascending: false, nullsFirst: false }),
    client.from('professional_profile_skills').select('*').eq('professional_profile_id', profileId).order('created_at', { ascending: false }),
    client.from('professional_profile_languages').select('*').eq('professional_profile_id', profileId).order('created_at', { ascending: false }),
    client.from('professional_profile_experience').select('*').eq('professional_profile_id', profileId).order('start_date', { ascending: false, nullsFirst: false }),
    client.from('professional_profile_titles').select('id', { count: 'exact', head: true }).eq('professional_profile_id', profileId),
    client.from('professional_profile_studies').select('id', { count: 'exact', head: true }).eq('professional_profile_id', profileId),
    client.from('professional_profile_associations').select('id', { count: 'exact', head: true }).eq('professional_profile_id', profileId),
    client.from('professional_profile_licenses').select('id', { count: 'exact', head: true }).eq('professional_profile_id', profileId),
    client.from('professional_profile_skills').select('id', { count: 'exact', head: true }).eq('professional_profile_id', profileId),
    client.from('professional_profile_languages').select('id', { count: 'exact', head: true }).eq('professional_profile_id', profileId),
    client.from('professional_profile_experience').select('id', { count: 'exact', head: true }).eq('professional_profile_id', profileId),
    client.from('professional_profile_posts').select('id', { count: 'exact', head: true }).eq('professional_profile_id', profileId),
    client.from('professional_profile_follows').select('id', { count: 'exact', head: true }).eq('professional_profile_id', profileId),
  ]);

  return {
    ...base,
    titles: ((titles.data ?? []) as TitleRow[]).map(toTitle),
    studies: ((studies.data ?? []) as StudyRow[]).map(toStudy),
    associations: ((associations.data ?? []) as AssociationRow[]).map(toAssociation),
    licenses: ((licenses.data ?? []) as LicenseRow[]).map(toLicense),
    skills: ((skills.data ?? []) as SkillRow[]).map(toSkill),
    languages: ((languages.data ?? []) as LanguageRow[]).map(toLanguage),
    experience: ((experience.data ?? []) as ExperienceRow[]).map(toExperience),
    _count: {
      titles: titlesCount.count ?? 0,
      studies: studiesCount.count ?? 0,
      associations: associationsCount.count ?? 0,
      licenses: licensesCount.count ?? 0,
      skills: skillsCount.count ?? 0,
      languages: languagesCount.count ?? 0,
      experience: experienceCount.count ?? 0,
      posts: postsCount.count ?? 0,
      followers: followersCount.count ?? 0,
    },
  };
}

async function loadUserById(
  client: Awaited<ReturnType<typeof getServerClient>>,
  userId: string,
): Promise<UserProfileRow | null> {
  const { data } = await client
    .from('profiles')
    .select('id, username, first_name, last_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();
  return (data as UserProfileRow | null) ?? null;
}

export async function getMyProfile(): Promise<ProfessionalProfile | null> {
  const client = await getServerClient();
  const { data: auth } = await client.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return null;

  const { data, error } = await client
    .from('professional_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;

  const user = await loadUserById(client, userId);
  return hydrateProfile(client, toProfile(data as ProfileRow, user));
}

export async function getProfileByUsername(username: string): Promise<ProfessionalProfile | null> {
  const client = await getServerClient();

  const { data: user } = await client
    .from('profiles')
    .select('id, username, first_name, last_name, avatar_url')
    .eq('username', username)
    .maybeSingle();
  if (!user) return null;

  const { data, error } = await client
    .from('professional_profiles')
    .select('*')
    .eq('user_id', (user as UserProfileRow).id)
    .maybeSingle();
  if (error || !data) return null;

  return hydrateProfile(client, toProfile(data as ProfileRow, user as UserProfileRow));
}

export async function getProfileById(id: string): Promise<ProfessionalProfile | null> {
  const client = await getServerClient();
  const { data, error } = await client
    .from('professional_profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;

  const user = await loadUserById(client, (data as ProfileRow).user_id);
  return hydrateProfile(client, toProfile(data as ProfileRow, user));
}

export async function listPublicProfiles(
  limit = 24,
  offset = 0,
): Promise<{ profiles: ProfessionalProfile[]; total: number }> {
  const client = await getServerClient();

  const { data, error, count } = await client
    .from('professional_profiles')
    .select('*', { count: 'exact' })
    .eq('visibility', 'PUBLIC')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error || !data) return { profiles: [], total: 0 };

  const rows = data as ProfileRow[];
  if (rows.length === 0) return { profiles: [], total: count ?? 0 };

  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: users } = await client
    .from('profiles')
    .select('id, username, first_name, last_name, avatar_url')
    .in('id', userIds);
  const userById = new Map<string, UserProfileRow>();
  for (const u of (users ?? []) as UserProfileRow[]) userById.set(u.id, u);

  const profiles = rows.map((r) => toProfile(r, userById.get(r.user_id) ?? null));
  return { profiles, total: count ?? profiles.length };
}

export async function checkIsFollowing(profileId: string): Promise<boolean> {
  const client = await getServerClient();
  const { data: auth } = await client.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) return false;

  const { data } = await client
    .from('professional_profile_follows')
    .select('id')
    .eq('professional_profile_id', profileId)
    .eq('follower_id', userId)
    .maybeSingle();
  return !!data;
}

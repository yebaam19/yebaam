import 'server-only';
import { getServerClient } from '@/utils/supabase/server';
import type { ProfessionalProfile } from '@/features/professional-profile/interfaces/professional-profile.interfaces';
import {
  type AssociationRow,
  type ExperienceRow,
  type LanguageRow,
  type LicenseRow,
  type SkillRow,
  type StudyRow,
  type TitleRow,
  STUDY_PUBLIC_COLUMNS,
  TITLE_PUBLIC_COLUMNS,
  toAssociation,
  toExperience,
  toLanguage,
  toLicense,
  toSkill,
  toStudy,
  toTitle,
} from './entities.mappers';

type SupabaseServerClient = Awaited<ReturnType<typeof getServerClient>>;

export async function hydrateProfile(
  client: SupabaseServerClient,
  base: ProfessionalProfile,
): Promise<ProfessionalProfile> {
  const profileId = base.id;
  const forProfile = (table: string) =>
    client.from(table).select('*').eq('professional_profile_id', profileId);
  // Ordered list query for one child table (nullsFirst:false is a no-op on the
  // non-nullable created_at orderings, so one signature covers all seven).
  const listRows = (table: string, columns: string, orderColumn: string) =>
    client
      .from(table)
      .select(columns)
      .eq('professional_profile_id', profileId)
      .order(orderColumn, { ascending: false, nullsFirst: false });
  const countRows = (table: string) =>
    client.from(table).select('id', { count: 'exact', head: true }).eq('professional_profile_id', profileId);

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
    listRows('professional_profile_titles', TITLE_PUBLIC_COLUMNS, 'year'),
    listRows('professional_profile_studies', STUDY_PUBLIC_COLUMNS, 'year'),
    forProfile('professional_profile_associations').order('created_at', { ascending: false }),
    listRows('professional_profile_licenses', '*', 'issued_at'),
    forProfile('professional_profile_skills').order('created_at', { ascending: false }),
    forProfile('professional_profile_languages').order('created_at', { ascending: false }),
    listRows('professional_profile_experience', '*', 'start_date'),
    countRows('professional_profile_titles'),
    countRows('professional_profile_studies'),
    countRows('professional_profile_associations'),
    countRows('professional_profile_licenses'),
    countRows('professional_profile_skills'),
    countRows('professional_profile_languages'),
    countRows('professional_profile_experience'),
    countRows('professional_profile_posts'),
    countRows('professional_profile_follows'),
  ]);

  return {
    ...base,
    titles: ((titles.data ?? []) as unknown as TitleRow[]).map(toTitle),
    studies: ((studies.data ?? []) as unknown as StudyRow[]).map(toStudy),
    associations: ((associations.data ?? []) as AssociationRow[]).map(toAssociation),
    licenses: ((licenses.data ?? []) as unknown as LicenseRow[]).map(toLicense),
    skills: ((skills.data ?? []) as SkillRow[]).map(toSkill),
    languages: ((languages.data ?? []) as LanguageRow[]).map(toLanguage),
    experience: ((experience.data ?? []) as unknown as ExperienceRow[]).map(toExperience),
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

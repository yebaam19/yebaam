import type {
  Association,
  CredentialStatus,
  Experience,
  Language,
  License,
  Skill,
  Study,
  StudyType,
  Title,
  TitleCategory,
  TitleDistinction,
} from '@/features/professional-profile/interfaces/professional-profile.interfaces';

/**
 * Row shapes + snake_case→camelCase mappers for the professional-profile child
 * entities. Shared by the read side ([`profile.server.ts`](./profile.server.ts))
 * and the write side ([`entities.actions.ts`](./entities.actions.ts)) so the
 * DB→domain shape lives in exactly one place.
 *
 * `diploma_cf_image_id` is intentionally absent from the public column lists and
 * row types — it is owner-only and hydrated separately via `hydrateOwnerExtras`.
 */

export type TitleRow = {
  id: string;
  professional_profile_id: string;
  name: string;
  institution: string | null;
  year: number | null;
  category: TitleCategory | null;
  distinction: TitleDistinction | null;
  focuses: string[] | null;
  credential_status: CredentialStatus;
  credential_request_id: string | null;
  verified_at: string | null;
  verified_by: string | null;
  verified_snapshot: Record<string, unknown> | null;
  institution_page_id: string | null;
  institution_slug: string | null;
};

export type StudyRow = {
  id: string;
  professional_profile_id: string;
  name: string;
  institution: string | null;
  year: number | null;
  study_type: StudyType | null;
  focuses: string[] | null;
  credential_status: CredentialStatus;
  credential_request_id: string | null;
  verified_at: string | null;
  verified_by: string | null;
  verified_snapshot: Record<string, unknown> | null;
  institution_page_id: string | null;
  institution_slug: string | null;
};

export type AssociationRow = {
  id: string;
  professional_profile_id: string;
  name: string;
  role: string | null;
};

export type LicenseRow = {
  id: string;
  professional_profile_id: string;
  name: string;
  number: string | null;
  issued_by: string | null;
  issued_at: string | null;
};

export type SkillRow = {
  id: string;
  professional_profile_id: string;
  name: string;
  level: string | null;
};

export type LanguageRow = {
  id: string;
  professional_profile_id: string;
  name: string;
  proficiency: string | null;
};

export type ExperienceRow = {
  id: string;
  professional_profile_id: string;
  position: string;
  company: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
};

// Public column lists — diploma_cf_image_id is intentionally excluded.
export const TITLE_PUBLIC_COLUMNS =
  'id, professional_profile_id, name, institution, year, category, distinction, focuses, credential_status, credential_request_id, verified_at, verified_by, verified_snapshot, institution_page_id, institution_slug';
export const STUDY_PUBLIC_COLUMNS =
  'id, professional_profile_id, name, institution, year, study_type, focuses, credential_status, credential_request_id, verified_at, verified_by, verified_snapshot, institution_page_id, institution_slug';

export function toTitle(row: TitleRow): Title {
  return {
    id: row.id,
    professionalProfileId: row.professional_profile_id,
    name: row.name,
    institution: row.institution,
    year: row.year,
    category: row.category,
    distinction: row.distinction,
    focuses: row.focuses ?? [],
    credentialStatus: row.credential_status,
    credentialRequestId: row.credential_request_id,
    verifiedAt: row.verified_at,
    verifiedBy: row.verified_by,
    verifiedSnapshot: row.verified_snapshot,
    institutionPageId: row.institution_page_id,
    institutionSlug: row.institution_slug,
  };
}

export function toStudy(row: StudyRow): Study {
  return {
    id: row.id,
    professionalProfileId: row.professional_profile_id,
    name: row.name,
    institution: row.institution,
    year: row.year,
    studyType: row.study_type,
    focuses: row.focuses ?? [],
    credentialStatus: row.credential_status,
    credentialRequestId: row.credential_request_id,
    verifiedAt: row.verified_at,
    verifiedBy: row.verified_by,
    verifiedSnapshot: row.verified_snapshot,
    institutionPageId: row.institution_page_id,
    institutionSlug: row.institution_slug,
  };
}

export function toAssociation(row: AssociationRow): Association {
  return {
    id: row.id,
    professionalProfileId: row.professional_profile_id,
    name: row.name,
    role: row.role,
  };
}

export function toLicense(row: LicenseRow): License {
  return {
    id: row.id,
    professionalProfileId: row.professional_profile_id,
    name: row.name,
    number: row.number,
    issuedBy: row.issued_by,
    issuedAt: row.issued_at,
  };
}

export function toSkill(row: SkillRow): Skill {
  return {
    id: row.id,
    professionalProfileId: row.professional_profile_id,
    name: row.name,
    level: row.level,
  };
}

export function toLanguage(row: LanguageRow): Language {
  return {
    id: row.id,
    professionalProfileId: row.professional_profile_id,
    name: row.name,
    proficiency: row.proficiency,
  };
}

export function toExperience(row: ExperienceRow): Experience {
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

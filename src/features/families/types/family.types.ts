export type FamilyMemberRole = 'owner' | 'admin' | 'member';
export type FamilyInviteStatus = 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired';
export type FamilyEventType =
  | 'birth'
  | 'marriage'
  | 'divorce'
  | 'death'
  | 'graduation'
  | 'migration'
  | 'adoption'
  | 'custom';
export type FamilyRelationshipKind = 'parent' | 'spouse' | 'sibling';
export type FamilyGender = 'male' | 'female' | 'other' | 'unknown';
export type FamilyDocKind = 'birth_cert' | 'marriage_cert' | 'death_cert' | 'id' | 'letter' | 'other';

export interface FamilyRow {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  cover_cf_image_id: string | null;
  privacy: 'invite_only';
  member_count: number;
  person_count: number;
  created_at: string;
  updated_at: string;
}

export interface FamilyMemberRow {
  id: string;
  family_id: string;
  profile_id: string;
  role: FamilyMemberRole;
  joined_at: string;
}

export interface FamilyPersonRow {
  id: string;
  family_id: string;
  full_name: string;
  maiden_name: string | null;
  gender: FamilyGender;
  birth_date: string | null;
  birth_place: string | null;
  death_date: string | null;
  death_place: string | null;
  bio: string | null;
  avatar_cf_image_id: string | null;
  claimed_by_profile_id: string | null;
  added_by: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyRelationshipRow {
  id: string;
  family_id: string;
  person_id: string;
  related_person_id: string;
  relationship_type: FamilyRelationshipKind;
  created_by: string;
  created_at: string;
}

export interface FamilyEventRow {
  id: string;
  family_id: string;
  event_type: FamilyEventType;
  title: string;
  description: string | null;
  event_date: string | null;
  event_place: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyPhotoRow {
  id: string;
  family_id: string;
  cf_image_id: string;
  caption: string | null;
  taken_at: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface FamilyStoryRow {
  id: string;
  family_id: string;
  title: string;
  body: string;
  event_date: string | null;
  author_profile_id: string;
  created_at: string;
  updated_at: string;
}

export interface FamilyDocumentRow {
  id: string;
  family_id: string;
  title: string;
  kind: FamilyDocKind;
  storage_path: string | null;
  cf_image_id: string | null;
  uploaded_by: string;
  created_at: string;
}

export interface FamilyInvitationRow {
  id: string;
  family_id: string;
  invitee_id: string;
  invited_by: string;
  person_id: string | null;
  status: FamilyInviteStatus;
  responded_at: string | null;
  created_at: string;
}

export interface FamilyTreeNodeRow {
  person_id: string;
  parents: string[];
  spouses: string[];
  children: string[];
}

export interface FamilyWithViewer extends FamilyRow {
  viewer_role: FamilyMemberRole | null;
  has_pending_invite: boolean;
}

export interface CreateFamilyDto {
  name: string;
  description?: string;
  coverImageId?: string;
}

export interface UpdateFamilyDto {
  id: string;
  name?: string;
  description?: string | null;
  coverImageId?: string | null;
}

export interface UpdatePersonDto {
  id: string;
  fullName?: string;
  gender?: FamilyGender;
  birthDate?: string | null;
  birthPlace?: string | null;
  deathDate?: string | null;
  deathPlace?: string | null;
  bio?: string | null;
  avatarImageId?: string | null;
}

export interface AddPersonDto {
  familyId: string;
  fullName: string;
  gender?: FamilyGender;
  birthDate?: string;
  birthPlace?: string;
  deathDate?: string;
  deathPlace?: string;
  bio?: string;
  avatarImageId?: string;
}

export interface InviteByUsernameDto {
  familyId: string;
  username: string;
  personId?: string;
}

export interface AddEventDto {
  familyId: string;
  eventType: FamilyEventType;
  title: string;
  description?: string;
  eventDate?: string;
  eventPlace?: string;
  personIds?: string[];
}

export interface AddPhotoDto {
  familyId: string;
  cfImageId: string;
  caption?: string;
  takenAt?: string;
  personIds?: string[];
}

export interface AddStoryDto {
  familyId: string;
  title: string;
  body: string;
  eventDate?: string;
}

export interface AddDocumentDto {
  familyId: string;
  title: string;
  kind: FamilyDocKind;
  storagePath?: string;
  cfImageId?: string;
}

import type { PlanAttachment } from './communityLibrary.types';

export type PlanKind = 'rules' | 'government' | 'economy';
export type SectionKind = PlanKind | 'about' | 'leaders';
export type ProfileCapability = 'settings' | 'content' | 'plans' | 'moderation';
export type ProfileCapabilities = Record<ProfileCapability, boolean>;

export interface CommunitySection {
  id: string;
  community_id: string;
  kind: SectionKind;
  title: string;
  position: number;
  is_visible: boolean;
  is_featured: boolean;
  version: number;
}

export interface PlanAxis {
  id: string;
  community_id: string;
  section_id: string;
  title: string;
  description: string;
  position: number;
  is_published: boolean;
  version: number;
}

export interface PlanPoint extends PlanAxis {
  axis_id: string;
  content: string;
  attachments?: PlanPage<PlanAttachment>;
}

export interface PlanCursor {
  position: number;
  id: string;
}

export interface PlanPage<T> {
  items: T[];
  nextCursor: PlanCursor | null;
}

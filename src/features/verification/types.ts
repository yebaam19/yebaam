export type VerificationStatus = 'unstarted' | 'pending' | 'approved' | 'rejected';

export interface VerificationProfileFields {
  birth_place: string | null;
  birth_date: string | null;
  residence_country: string | null;
  residence_state: string | null;
  residence_city: string | null;
  study_place: string | null;
  work_place: string | null;
  terms_accepted_at: string | null;
  verification_status: VerificationStatus | null;
  verified_at: string | null;
  is_verified: boolean | null;
  unique_id_code: string | null;
  pioneer_number: number | null;
}

export interface VerificationChecklist {
  requiredInfo: boolean;
  photosCount: number;
  termsAccepted: boolean;
  idDocumentSubmitted: boolean;
  allComplete: boolean;
}

export interface VerificationRequestRow {
  id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
}

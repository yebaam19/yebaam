import { supabase } from '@/utils/supabase/client';
import type { VerificationStatus } from '../types';

export interface VerificationBannerState {
  status: VerificationStatus;
  isVerified: boolean;
  uniqueIdCode: string | null;
  pioneerNumber: number | null;
  rejectionReason: string | null;
  checklist: { requiredInfo: boolean; photos: number; terms: boolean; pending: boolean };
}

export async function loadVerificationBanner(ownerUserId: string): Promise<VerificationBannerState | null> {
  const [profileRes, photosRes, pendingRes, rejectedRes] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'verification_status, is_verified, unique_id_code, pioneer_number, terms_accepted_at, birth_place, birth_date, residence_country, residence_state, residence_city, study_place, work_place, first_name, last_name',
      )
      .eq('id', ownerUserId)
      .maybeSingle(),
    supabase
      .from('verification_photos')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', ownerUserId),
    supabase
      .from('verification_requests')
      .select('id')
      .eq('user_id', ownerUserId)
      .eq('status', 'pending')
      .maybeSingle(),
    supabase
      .from('verification_requests')
      .select('rejection_reason')
      .eq('user_id', ownerUserId)
      .eq('status', 'rejected')
      .order('reviewed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const profile = profileRes.data;
  if (!profile) return null;
  const requiredInfo = Boolean(
    profile.first_name &&
      profile.last_name &&
      profile.birth_date &&
      profile.birth_place &&
      profile.residence_country &&
      profile.residence_state &&
      profile.residence_city &&
      profile.study_place &&
      profile.work_place,
  );
  return {
    status: (profile.verification_status as VerificationStatus) ?? 'unstarted',
    isVerified: profile.is_verified ?? false,
    uniqueIdCode: profile.unique_id_code,
    pioneerNumber: profile.pioneer_number,
    rejectionReason: rejectedRes.data?.rejection_reason ?? null,
    checklist: {
      requiredInfo,
      photos: photosRes.count ?? 0,
      terms: Boolean(profile.terms_accepted_at),
      pending: Boolean(pendingRes.data),
    },
  };
}

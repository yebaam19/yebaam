import 'server-only';
import { getServerClient } from '@/utils/supabase/server';
import type { VerificationChecklist, VerificationProfileFields } from '../types';

export async function getMyVerificationState(): Promise<{
  userId: string;
  profile: VerificationProfileFields;
  photos: { slot: number; cf_image_id: string }[];
  pendingRequestId: string | null;
  checklist: VerificationChecklist;
} | null> {
  const sb = await getServerClient();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  const userId = auth.user.id;

  const [{ data: profile }, { data: photos }, { data: pending }] = await Promise.all([
    sb
      .from('profiles')
      .select(
        'birth_place, birth_date, residence_country, residence_state, residence_city, study_place, work_place, terms_accepted_at, verification_status, verified_at, is_verified, unique_id_code, pioneer_number, first_name, last_name',
      )
      .eq('id', userId)
      .maybeSingle(),
    sb.from('verification_photos').select('slot, cf_image_id').eq('user_id', userId),
    sb
      .from('verification_requests')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle(),
  ]);

  const p = (profile ?? {}) as VerificationProfileFields & {
    first_name?: string | null;
    last_name?: string | null;
  };

  const requiredInfo = Boolean(
    p.birth_date &&
      p.birth_place &&
      p.residence_country &&
      p.residence_state &&
      p.residence_city &&
      p.study_place &&
      p.work_place &&
      p.first_name &&
      p.last_name,
  );

  const photoCount = (photos ?? []).length;
  const termsAccepted = Boolean(p.terms_accepted_at);
  const idDocumentSubmitted = Boolean(pending);

  const checklist: VerificationChecklist = {
    requiredInfo,
    photosCount: photoCount,
    termsAccepted,
    idDocumentSubmitted,
    allComplete:
      requiredInfo && photoCount >= 5 && termsAccepted && (idDocumentSubmitted || p.is_verified === true),
  };

  return {
    userId,
    profile: p,
    photos: photos ?? [],
    pendingRequestId: pending?.id ?? null,
    checklist,
  };
}

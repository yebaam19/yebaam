'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient } from '@/utils/supabase/server';
import {
  requiredInfoSchema,
  saveIdDocumentSchema,
  savePhotoSlotSchema,
  type RequiredInfoInput,
} from '../validators/verification.schemas';

async function requireUserId() {
  const sb = await getServerClient();
  const { data } = await sb.auth.getUser();
  if (!data.user) throw new Error('No autorizado');
  return { sb, userId: data.user.id };
}

export async function saveRequiredInfoAction(input: RequiredInfoInput): Promise<void> {
  const parsed = requiredInfoSchema.parse(input);
  const { sb, userId } = await requireUserId();
  const { error } = await sb
    .from('profiles')
    .update({
      first_name: parsed.firstName,
      last_name: parsed.lastName,
      birth_date: parsed.birthDate,
      birth_place: parsed.birthPlace,
      residence_country: parsed.residenceCountry,
      residence_state: parsed.residenceState,
      residence_city: parsed.residenceCity,
      study_place: parsed.studyPlace,
      work_place: parsed.workPlace,
    })
    .eq('id', userId);
  if (error) throw new Error(error.message);
  revalidatePath('/');
}

export async function acceptVerificationTermsAction(): Promise<void> {
  const { sb, userId } = await requireUserId();
  const { error } = await sb
    .from('profiles')
    .update({ terms_accepted_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw new Error(error.message);
  revalidatePath('/');
}

export async function savePhotoSlotAction(input: { slot: number; cfImageId: string }): Promise<void> {
  const parsed = savePhotoSlotSchema.parse(input);
  const { sb, userId } = await requireUserId();
  const { error } = await sb
    .from('verification_photos')
    .upsert(
      { user_id: userId, slot: parsed.slot, cf_image_id: parsed.cfImageId },
      { onConflict: 'user_id,slot' },
    );
  if (error) throw new Error(error.message);

  if (parsed.slot === 1) {
    await sb.from('profiles').update({ avatar_cloudflare_id: parsed.cfImageId }).eq('id', userId);
  } else if (parsed.slot === 2) {
    await sb.from('profiles').update({ cover_cloudflare_id: parsed.cfImageId }).eq('id', userId);
  }
  revalidatePath('/');
}

export async function submitVerificationRequestAction(input: {
  cfImageId: string;
  mimeType?: string | null;
}): Promise<{ requestId: string }> {
  const parsed = saveIdDocumentSchema.parse(input);
  const { sb, userId } = await requireUserId();

  const { data: profile, error: pErr } = await sb
    .from('profiles')
    .select(
      'birth_place, birth_date, residence_country, residence_state, residence_city, study_place, work_place, terms_accepted_at, first_name, last_name, is_verified',
    )
    .eq('id', userId)
    .maybeSingle();
  if (pErr) throw new Error(pErr.message);
  if (!profile) throw new Error('Perfil no encontrado');
  if (profile.is_verified) throw new Error('Tu cuenta ya está verificada');

  const requiredFields = [
    profile.first_name,
    profile.last_name,
    profile.birth_date,
    profile.birth_place,
    profile.residence_country,
    profile.residence_state,
    profile.residence_city,
    profile.study_place,
    profile.work_place,
  ];
  if (requiredFields.some((v) => !v)) {
    throw new Error('Completa todos los campos requeridos antes de enviar');
  }
  if (!profile.terms_accepted_at) {
    throw new Error('Debes aceptar los términos y condiciones');
  }

  const { count: photoCount, error: countErr } = await sb
    .from('verification_photos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (countErr) throw new Error(countErr.message);
  if ((photoCount ?? 0) < 5) {
    throw new Error('Sube las 5 fotos requeridas antes de enviar');
  }

  const { data: existingPending } = await sb
    .from('verification_requests')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .maybeSingle();
  if (existingPending) {
    throw new Error('Ya tienes una solicitud pendiente');
  }

  const { data: request, error: reqErr } = await sb
    .from('verification_requests')
    .insert({ user_id: userId })
    .select('id')
    .single();
  if (reqErr || !request) throw new Error(reqErr?.message || 'No se pudo crear la solicitud');

  const { error: docErr } = await sb.from('id_documents').insert({
    request_id: request.id,
    user_id: userId,
    cf_image_id: parsed.cfImageId,
    mime_type: parsed.mimeType ?? null,
  });
  if (docErr) {
    await sb.from('verification_requests').delete().eq('id', request.id);
    throw new Error(docErr.message);
  }

  // Best-effort admin notification — non-fatal if it fails.
  try {
    await notifyAdmins(userId);
  } catch (err) {
    console.warn('[verification] admin notify failed', err);
  }

  revalidatePath('/');
  return { requestId: request.id };
}

async function notifyAdmins(submitterId: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.EMAIL_WEBHOOK_SECRET;
  if (!url || !secret) return;
  const fnUrl = `${url}/functions/v1/notify-verification-submitted`;
  await fetch(fnUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': secret },
    body: JSON.stringify({ submitterId }),
  }).catch(() => undefined);
}

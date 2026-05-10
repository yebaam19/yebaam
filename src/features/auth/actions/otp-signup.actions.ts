'use server';

import { headers } from 'next/headers';
import { getServiceClient } from '@/utils/supabase/server';
import { sendOtpEmail } from '@/services/email/resend.service';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { generateCode, hashCode, otpExpiresAt, MAX_ATTEMPTS } from './_otp-shared';
import { isOccupationSlug } from '../constants/occupations';
import type { RegisterDTO, VerifyEmailRequest, ResendOtpRequest } from '../interfaces/auth.interfaces';

async function getRemoteIp(): Promise<string | null> {
  const h = await headers();
  return (
    h.get('cf-connecting-ip') ||
    h.get('x-real-ip') ||
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    null
  );
}

async function issueOtpFor(userId: string, email: string, firstName?: string | null) {
  const admin = getServiceClient();
  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = otpExpiresAt();

  await admin.from('otp_codes').update({ consumed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('purpose', 'signup')
    .is('consumed_at', null);

  const { error: insertError } = await admin.from('otp_codes').insert({
    user_id: userId,
    email,
    code_hash: codeHash,
    expires_at: expiresAt,
    purpose: 'signup',
  });
  if (insertError) {
    throw new Error(insertError.message || 'No se pudo generar el código de verificación');
  }

  await sendOtpEmail({ to: email, code, firstName });
}

export async function signupWithOtpAction(userData: RegisterDTO): Promise<{ message: string }> {
  if (!userData.email || !userData.password) {
    throw new Error('Email y contraseña son requeridos');
  }

  if (!isOccupationSlug(userData.occupation)) {
    throw new Error('Ocupación inválida o requerida');
  }

  const captcha = await verifyTurnstileToken(userData.captchaToken, {
    remoteIp: await getRemoteIp(),
    expectedAction: 'signup',
  });
  if (!captcha.ok) {
    throw new Error(captcha.reason);
  }

  const admin = getServiceClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: false,
    user_metadata: {
      name: [userData.firstName, userData.lastName].filter(Boolean).join(' '),
    },
  });

  if (createError || !created?.user) {
    throw new Error(createError?.message || 'Error al registrar usuario');
  }

  const userId = created.user.id;

  await admin
    .from('profiles')
    .update({
      username: userData.email.split('@')[0] || null,
      first_name: userData.firstName,
      middle_name: userData.secondName ?? null,
      last_name: userData.lastName,
      second_last_name: userData.secondLastName ?? null,
      birth_date: userData.birthDate,
      gender: userData.gender,
      country: userData.country,
      state: userData.state,
      city: userData.city,
      occupation: userData.occupation,
    })
    .eq('id', userId);

  await issueOtpFor(userId, userData.email, userData.firstName);

  return { message: 'Account created. Check your email to verify your account.' };
}

export async function verifyOtpAction(payload: VerifyEmailRequest): Promise<{ message: string }> {
  const admin = getServiceClient();
  const codeHash = hashCode(payload.otp);

  const { data: row, error: selectError } = await admin
    .from('otp_codes')
    .select('id, user_id, email, expires_at, consumed_at, attempts')
    .eq('email', payload.email)
    .eq('purpose', 'signup')
    .is('consumed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectError) {
    throw new Error(selectError.message || 'Error al verificar el código');
  }
  if (!row) {
    throw new Error('No hay un código pendiente para este email');
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    await admin.from('otp_codes').update({ consumed_at: new Date().toISOString() }).eq('id', row.id);
    throw new Error('El código expiró. Solicita uno nuevo.');
  }

  if (row.attempts >= MAX_ATTEMPTS) {
    await admin.from('otp_codes').update({ consumed_at: new Date().toISOString() }).eq('id', row.id);
    throw new Error('Demasiados intentos. Solicita un nuevo código.');
  }

  const { data: match, error: matchError } = await admin
    .from('otp_codes')
    .select('id')
    .eq('id', row.id)
    .eq('code_hash', codeHash)
    .maybeSingle();

  if (matchError) {
    throw new Error(matchError.message || 'Error al verificar el código');
  }

  if (!match) {
    await admin.from('otp_codes').update({ attempts: row.attempts + 1 }).eq('id', row.id);
    throw new Error('Código inválido');
  }

  await admin.from('otp_codes').update({ consumed_at: new Date().toISOString() }).eq('id', row.id);

  const { error: confirmError } = await admin.auth.admin.updateUserById(row.user_id, {
    email_confirm: true,
  });
  if (confirmError) {
    throw new Error(confirmError.message || 'Error al confirmar el email');
  }

  return { message: 'Email verified.' };
}

export async function resendOtpAction(payload: ResendOtpRequest): Promise<{ message: string }> {
  const captcha = await verifyTurnstileToken(payload.captchaToken, {
    remoteIp: await getRemoteIp(),
    expectedAction: 'resend-otp',
  });
  if (!captcha.ok) {
    throw new Error(captcha.reason);
  }

  const admin = getServiceClient();

  const { data: existing, error: existingError } = await admin
    .from('otp_codes')
    .select('user_id')
    .eq('email', payload.email)
    .eq('purpose', 'signup')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingError) {
    throw new Error(existingError.message || 'Error al localizar el usuario');
  }
  if (!existing) {
    throw new Error('No se encontró una cuenta pendiente de verificación para ese email');
  }

  const { data: userLookup, error: userError } = await admin.auth.admin.getUserById(existing.user_id);
  if (userError || !userLookup?.user) {
    throw new Error(userError?.message || 'No se encontró el usuario');
  }
  if (userLookup.user.email_confirmed_at) {
    throw new Error('Este email ya está verificado');
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('first_name')
    .eq('id', existing.user_id)
    .maybeSingle();

  await issueOtpFor(existing.user_id, payload.email, profile?.first_name ?? null);

  return { message: 'Verification code resent.' };
}
